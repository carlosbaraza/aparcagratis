import { test, expect, type Page } from "@playwright/test";

const SUMMARY = ".animate-rise .font-display";

async function setWindow(page: Page, from: string, to: string) {
  await page.locator("input[type=datetime-local]").first().fill(from);
  await page.locator("input[type=datetime-local]").nth(1).fill(to);
}

async function openCalculator(page: Page) {
  const toggle = page.getByRole("button", { name: /Calcular precio/ });
  if ((await toggle.getAttribute("aria-expanded")) !== "true") {
    await toggle.click();
  }
  await expect(page.locator("input[type=datetime-local]").first()).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // Map must mount (Leaflet canvas) before we trust the page.
  await page.waitForSelector(".leaflet-container canvas", { timeout: 30_000 });
});

test("shows map layers on top and a collapsed price calculator by default", async ({
  page,
}) => {
  await expect(page.getByRole("heading", { name: "Capas del mapa" })).toBeVisible();
  const toggle = page.getByRole("button", { name: /Calcular precio/ });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("input[type=datetime-local]").first()).toBeHidden();
});

test("renders the SER map with tiles and parking bands", async ({ page }) => {
  const tiles = await page.locator(".leaflet-tile").count();
  expect(tiles).toBeGreaterThan(0);
  await expect(page.locator(".leaflet-container canvas")).toBeVisible();
});

test("recommends the cheapest zone for a weekday evening (dinner) window", async ({
  page,
}) => {
  await openCalculator(page);
  // Monday 2026-06-08, 19:00 -> 23:00. SER ends 21:00 => 2h paid + 2h free.
  await setWindow(page, "2026-06-08T19:00", "2026-06-08T23:00");
  await page.getByRole("button", { name: /^C\b/ }).click();
  await expect(page.locator(SUMMARY)).toContainText("Zona Azul");
  await expect(page.locator(".animate-rise")).toContainText("2,48");
  await expect(page.locator(".animate-rise")).toContainText("2 h gratis");
});

test("CERO label parks for free in any regulated zone", async ({ page }) => {
  await openCalculator(page);
  await setWindow(page, "2026-06-08T10:00", "2026-06-08T12:00");
  await page.getByRole("button", { name: /CERO/ }).click();
  await expect(page.locator(SUMMARY)).toContainText("Gratis");
});

test("a vehicle with no sticker is restricted to free bands during SER hours", async ({
  page,
}) => {
  await openCalculator(page);
  await setWindow(page, "2026-06-08T10:00", "2026-06-08T12:00");
  await page.getByRole("button", { name: /Sin etiqueta/ }).click();
  await expect(page.locator(SUMMARY)).toContainText("Solo banda libre");
});

test("parking entirely outside SER hours is free for everyone", async ({ page }) => {
  await openCalculator(page);
  // Sunday 2026-06-14 midday — no SER service.
  await setWindow(page, "2026-06-14T11:00", "2026-06-14T14:00");
  await expect(page.locator(SUMMARY)).toContainText("Aparcas gratis");
});

test("switches to satellite imagery and keeps the SER bands on top", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Satélite" }).click();
  // PNOA orthophoto tiles must load.
  await expect
    .poll(
      async () =>
        page.evaluate(
          () =>
            [...document.querySelectorAll("img.leaflet-tile")].filter(
              (i) => (i as HTMLImageElement).src.includes("pnoa"),
            ).length,
        ),
      { timeout: 15_000 },
    )
    .toBeGreaterThan(0);
  await expect(page.locator(".leaflet-container canvas")).toBeVisible();
});

test("clicking the map offers Google Maps and Street View deep links", async ({
  page,
}) => {
  // Click on the map, away from the control panel on the left.
  await page.locator(".leaflet-container").click({ position: { x: 900, y: 400 } });
  const popup = page.locator(".leaflet-popup .sv-popup");
  await expect(popup).toBeVisible();

  const maps = popup.getByRole("link", { name: /Google Maps/ });
  const pano = popup.getByRole("link", { name: /Street View/ });
  await expect(maps).toHaveAttribute(
    "href",
    /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=-?\d+\.\d+,-?\d+\.\d+$/,
  );
  await expect(pano).toHaveAttribute(
    "href",
    /map_action=pano&viewpoint=-?\d+\.\d+,-?\d+\.\d+$/,
  );
  await expect(maps).toHaveAttribute("target", "_blank");
});

test("zone filters can be toggled on and off", async ({ page }) => {
  const verde = page
    .locator("section")
    .filter({ hasText: "Capas del mapa" })
    .getByRole("button", { name: "Zona Verde" });
  await expect(verde).toHaveAttribute("aria-pressed", "true");
  await verde.click();
  await expect(verde).toHaveAttribute("aria-pressed", "false");
});

test.describe("mobile layout", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("shows a navbar, bottom shortcuts and a full-screen drawer", async ({
    page,
  }) => {
    await expect(page.locator(".leaflet-container canvas")).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();

    const shortcuts = page.getByRole("navigation", { name: "Accesos rápidos" });
    for (const name of ["Verde", "Azul", "Libre", "Otras", "Vista satélite"]) {
      await expect(shortcuts.getByRole("button", { name })).toBeVisible();
    }
    // Every layer shortcut is active by default.
    await expect(
      shortcuts.getByRole("button", { name: "Verde" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      shortcuts.getByRole("button", { name: "Libre" }),
    ).toHaveAttribute("aria-pressed", "true");

    // Hamburger opens the full-screen drawer with the complete controls.
    await page.getByRole("button", { name: "Abrir menú" }).click();
    const drawer = page.locator("aside.fixed");
    await expect(drawer).toBeVisible();
    await expect(
      drawer.getByRole("heading", { name: "Capas del mapa" }),
    ).toBeVisible();
    // ZBE has no shortcut but is enabled by default.
    await expect(
      drawer.getByRole("checkbox", { name: /Bajas Emisiones/ }),
    ).toBeChecked();

    await drawer.getByRole("button", { name: "Cerrar menú" }).click();
    await expect(drawer).toBeHidden();
  });

  test("a bottom shortcut toggles its map layer", async ({ page }) => {
    const verde = page
      .getByRole("navigation", { name: "Accesos rápidos" })
      .getByRole("button", { name: "Verde" });
    await expect(verde).toHaveAttribute("aria-pressed", "true");
    await verde.click();
    await expect(verde).toHaveAttribute("aria-pressed", "false");
  });

  test('the "Otras" shortcut toggles the grouped zones together', async ({
    page,
  }) => {
    const otras = page
      .getByRole("navigation", { name: "Accesos rápidos" })
      .getByRole("button", { name: "Otras" });
    await expect(otras).toHaveAttribute("aria-pressed", "true");
    await otras.click();
    await expect(otras).toHaveAttribute("aria-pressed", "false");
    // Reflected in the drawer: Alta Rotación gets disabled.
    await page.getByRole("button", { name: "Abrir menú" }).click();
    const drawer = page.locator("aside.fixed");
    await expect(
      drawer.getByRole("button", { name: "Alta Rotación" }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});
