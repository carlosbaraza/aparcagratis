"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { ZoneType, DgtLabel } from "@/lib/ser/types";
import { ZONE_ORDER } from "@/lib/ser/zones";
import type { Basemap } from "./MapView";
import ControlPanel from "./ControlPanel";
import MobileNav from "./MobileNav";
import MobileShortcuts from "./MobileShortcuts";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center text-ink-soft">
      <span className="animate-pulse text-sm tracking-wide">cargando mapa…</span>
    </div>
  ),
});

/** Zones grouped under the "Otras" mobile shortcut. */
export const OTHER_ZONES: ZoneType[] = [
  "alta_rotacion",
  "naranja",
  "rojo",
  "desconocido",
];

// Every layer (and the ZBE overlay) is enabled by default.
const DEFAULT_ENABLED: Record<ZoneType, boolean> = {
  verde: true,
  azul: true,
  alta_rotacion: true,
  naranja: true,
  rojo: true,
  libre: true,
  desconocido: true,
};

/** Format a Date as a value for <input type="datetime-local">. */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export default function App() {
  const [enabled, setEnabled] = useState<Record<ZoneType, boolean>>(DEFAULT_ENABLED);
  const [showZbe, setShowZbe] = useState(true);
  const [basemap, setBasemap] = useState<Basemap>("map");
  const [label, setLabel] = useState<DgtLabel>("c");
  const [isResident, setIsResident] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Seed the dinner-time example with *today's* date. This must run on the
  // client: the page is statically prerendered, so the build-time date would be
  // stale. Setting state here is the intended way to read this browser-only value.
  useEffect(() => {
    const now = new Date();
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0);
    const e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStart(toLocalInput(s));
    setEnd(toLocalInput(e));
    setMounted(true);
  }, []);

  const toggleZone = (z: ZoneType) =>
    setEnabled((prev) => ({ ...prev, [z]: !prev[z] }));

  const setZones = (zones: ZoneType[], value: boolean) =>
    setEnabled((prev) => {
      const next = { ...prev };
      for (const z of zones) next[z] = value;
      return next;
    });

  const stableEnabled = useMemo(() => enabled, [enabled]);

  const controlProps = {
    enabled,
    onToggleZone: toggleZone,
    zoneOrder: ZONE_ORDER,
    showZbe,
    onToggleZbe: () => setShowZbe((v) => !v),
    basemap,
    onBasemap: setBasemap,
    label,
    onLabel: setLabel,
    isResident,
    onResident: setIsResident,
    start,
    end,
    onStart: setStart,
    onEnd: setEnd,
    ready: mounted,
  } as const;

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <MapView enabled={stableEnabled} showZbe={showZbe} basemap={basemap} />

      {/* Desktop: floating left panel */}
      <div className="pointer-events-none absolute inset-0 z-[1000] hidden sm:flex">
        <ControlPanel variant="desktop" {...controlProps} />
      </div>

      {/* Mobile: top navbar + bottom shortcuts + full-screen drawer */}
      <div className="sm:hidden">
        <MobileNav onOpen={() => setDrawerOpen(true)} />

        <MobileShortcuts
          enabled={enabled}
          otherZones={OTHER_ZONES}
          onToggleZone={toggleZone}
          onSetZones={setZones}
          basemap={basemap}
          onBasemap={setBasemap}
        />

        {drawerOpen && (
          <div className="fixed inset-0 z-[2000]">
            <ControlPanel
              variant="mobile"
              onClose={() => setDrawerOpen(false)}
              {...controlProps}
            />
          </div>
        )}
      </div>
    </main>
  );
}
