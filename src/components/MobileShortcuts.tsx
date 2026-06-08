"use client";

import type { ZoneType } from "@/lib/ser/types";
import { ZONE_META } from "@/lib/ser/zones";
import type { Basemap } from "./MapView";

interface Props {
  enabled: Record<ZoneType, boolean>;
  otherZones: ZoneType[];
  onToggleZone: (z: ZoneType) => void;
  onSetZones: (zones: ZoneType[], value: boolean) => void;
  basemap: Basemap;
  onBasemap: (b: Basemap) => void;
}

const OTHER_DOT =
  "conic-gradient(#0EA5A5 0 33%, #E8702A 0 66%, #D93838 0 100%)";

function ColorDot({ color, active }: { color: string; active: boolean }) {
  return (
    <span
      className="h-3 w-3 rounded-full"
      style={{
        background: active ? color : "transparent",
        boxShadow: `inset 0 0 0 1.6px ${active ? "transparent" : color}`,
      }}
    />
  );
}

function Item({
  label,
  active,
  onClick,
  children,
  ariaLabel,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={ariaLabel ?? label}
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[0.64rem] font-medium transition ${
        active ? "text-ink" : "text-ink-soft opacity-55"
      }`}
    >
      {children}
      {label}
    </button>
  );
}

/** Bottom quick-toggle bar (mobile): Verde · Azul · Libre · Otras · Satélite. */
export default function MobileShortcuts({
  enabled,
  otherZones,
  onToggleZone,
  onSetZones,
  basemap,
  onBasemap,
}: Props) {
  const otrasActive = otherZones.some((z) => enabled[z]);
  const satellite = basemap === "satellite";

  return (
    <nav
      aria-label="Accesos rápidos"
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-[1000] flex items-stretch gap-1 border-t border-line bg-paper/92 px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md"
    >
      <Item
        label="Verde"
        active={enabled.verde}
        onClick={() => onToggleZone("verde")}
      >
        <ColorDot color={ZONE_META.verde.color} active={enabled.verde} />
      </Item>
      <Item
        label="Azul"
        active={enabled.azul}
        onClick={() => onToggleZone("azul")}
      >
        <ColorDot color={ZONE_META.azul.color} active={enabled.azul} />
      </Item>
      <Item
        label="Libre"
        active={enabled.libre}
        onClick={() => onToggleZone("libre")}
      >
        <ColorDot color={ZONE_META.libre.color} active={enabled.libre} />
      </Item>
      <Item
        label="Otras"
        active={otrasActive}
        onClick={() => onSetZones(otherZones, !otrasActive)}
      >
        <span
          className="h-3 w-3 rounded-full"
          style={{
            background: otrasActive ? OTHER_DOT : "transparent",
            boxShadow: otrasActive ? "none" : "inset 0 0 0 1.6px #8a9099",
          }}
        />
      </Item>
      <Item
        label="Satélite"
        active={satellite}
        ariaLabel="Vista satélite"
        onClick={() => onBasemap(satellite ? "map" : "satellite")}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          aria-hidden="true"
          className={satellite ? "text-azul" : "text-ink-soft"}
        >
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <path
            d="M2 8h12M8 2c2 2 2 10 0 12M8 2C6 4 6 12 8 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
          />
        </svg>
      </Item>
    </nav>
  );
}
