import { describe, it, expect } from "vitest";
import { classifyColor } from "./classify";

describe("classifyColor", () => {
  it("maps the official Spanish color names to zone types", () => {
    expect(classifyColor("Verde")).toBe("verde");
    expect(classifyColor("Azul")).toBe("azul");
    expect(classifyColor("Alta Rotación")).toBe("alta_rotacion");
    expect(classifyColor("Naranja")).toBe("naranja");
    expect(classifyColor("Rojo")).toBe("rojo");
  });

  it("treats the grey band as free/unregulated parking", () => {
    expect(classifyColor("Gris")).toBe("libre");
  });

  it("is case- and accent-insensitive and trims whitespace", () => {
    expect(classifyColor("  verde ")).toBe("verde");
    expect(classifyColor("ALTA ROTACION")).toBe("alta_rotacion");
    expect(classifyColor("AzUl")).toBe("azul");
  });

  it("maps empty or unknown values to 'desconocido'", () => {
    expect(classifyColor("")).toBe("desconocido");
    expect(classifyColor("Magenta")).toBe("desconocido");
  });
});
