"use client";

import { useMemo, useState } from "react";
import type { DgtLabel, ZoneType } from "@/lib/ser/types";
import { ZONE_META } from "@/lib/ser/zones";
import { DGT_OPTIONS } from "@/lib/ser/dgt";
import { evaluateParking, type ParkingDecision } from "@/lib/ser/decision";
import type { Basemap } from "./MapView";

interface Props {
  enabled: Record<ZoneType, boolean>;
  onToggleZone: (z: ZoneType) => void;
  zoneOrder: ZoneType[];
  showZbe: boolean;
  onToggleZbe: () => void;
  basemap: Basemap;
  onBasemap: (b: Basemap) => void;
  label: DgtLabel;
  onLabel: (l: DgtLabel) => void;
  isResident: boolean;
  onResident: (v: boolean) => void;
  start: string;
  end: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  ready: boolean;
  /** "desktop" = floating left panel; "mobile" = full-screen drawer. */
  variant?: "desktop" | "mobile";
  /** Close handler, shown as an ✕ button in the mobile drawer. */
  onClose?: () => void;
}

const CHOOSABLE: ZoneType[] = ["verde", "azul", "alta_rotacion"];

function euro(n: number): string {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function minutesLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export default function ControlPanel(props: Props) {
  const { enabled, label, isResident, start, end, ready } = props;
  const isMobile = props.variant === "mobile";
  const [priceOpen, setPriceOpen] = useState(false);

  const asideClass = isMobile
    ? "panel-scroll pointer-events-auto fixed inset-0 z-[2001] flex h-dvh w-full flex-col overflow-y-auto bg-paper"
    : "panel-scroll pointer-events-auto m-3 flex max-h-[calc(100dvh-1.5rem)] w-[22rem] max-w-[calc(100vw-1.5rem)] flex-col overflow-y-auto rounded-2xl border border-line bg-paper/85 shadow-[0_8px_40px_-12px_rgba(27,26,22,0.35)] backdrop-blur-md";

  const startDate = useMemo(() => (start ? new Date(start) : null), [start]);
  const endDate = useMemo(() => (end ? new Date(end) : null), [end]);
  const validWindow = !!startDate && !!endDate && endDate > startDate;

  const decisions = useMemo(() => {
    if (!validWindow) return null;
    const map = {} as Record<ZoneType, ParkingDecision>;
    for (const z of CHOOSABLE) {
      map[z] = evaluateParking({
        zone: z,
        label,
        start: startDate!,
        end: endDate!,
        isResident,
      });
    }
    return map;
  }, [validWindow, startDate, endDate, label, isResident]);

  const summary = useMemo(() => {
    if (!decisions) return null;
    const any = decisions.verde;
    if (any.regulatedMinutes === 0) {
      return {
        tone: "free" as const,
        title: "Aparcas gratis",
        body: `Tu horario cae fuera del SER (${minutesLabel(
          any.totalMinutes,
        )} libres). Puedes aparcar en cualquier banda sin pagar.`,
      };
    }
    const allowed = CHOOSABLE.map((z) => decisions[z]).filter((d) => d.allowed);
    if (allowed.length === 0) {
      return {
        tone: "blocked" as const,
        title: "Solo banda libre",
        body: "Con esta etiqueta no puedes usar el SER en horario regulado. Busca una banda libre (gris) o aparca tras el cierre del SER.",
      };
    }
    const cheapest = allowed.reduce((a, b) => (b.finalCost < a.finalCost ? b : a));
    return {
      tone: "pay" as const,
      title:
        cheapest.finalCost === 0
          ? `Gratis en ${ZONE_META[cheapest.zone].label}`
          : `Más barato: ${ZONE_META[cheapest.zone].label}`,
      body: `${euro(cheapest.finalCost)} por ${minutesLabel(
        cheapest.regulatedMinutes,
      )} de pago${
        cheapest.freeMinutes > 0
          ? ` + ${minutesLabel(cheapest.freeMinutes)} gratis`
          : ""
      }.`,
    };
  }, [decisions]);

  return (
    <aside className={asideClass}>
      <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
        <div>
          <h1 className="font-display text-[1.7rem] font-medium leading-none tracking-tight text-ink">
            aparcagratis
          </h1>
          <p className="mt-1.5 text-[0.78rem] leading-snug text-ink-soft">
            Zonas SER de Madrid. Mira dónde puedes aparcar según tu etiqueta y
            horario, y cuánto cuesta.
          </p>
        </div>
        {isMobile && props.onClose && (
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={props.onClose}
            className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink transition hover:bg-paper-2"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </header>

      <div className="mx-5 h-px bg-line" />

      {/* ── Capas del mapa (parte superior) ── */}
      <section className="px-5 py-4">
        <h2 className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Capas del mapa
        </h2>

        <div
          role="group"
          aria-label="Tipo de mapa"
          className="mb-3 flex rounded-lg border border-line bg-paper-2/50 p-0.5 text-[0.78rem]"
        >
          {(
            [
              ["map", "Mapa"],
              ["satellite", "Satélite"],
            ] as [Basemap, string][]
          ).map(([id, text]) => {
            const active = props.basemap === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => props.onBasemap(id)}
                className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${
                  active
                    ? "bg-ink text-paper shadow-sm"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {text}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {props.zoneOrder.map((z) => {
            const active = enabled[z];
            const meta = ZONE_META[z];
            return (
              <button
                key={z}
                type="button"
                aria-pressed={active}
                onClick={() => props.onToggleZone(z)}
                title={meta.description}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.74rem] transition ${
                  active
                    ? "border-ink/15 bg-paper-2 text-ink"
                    : "border-line bg-transparent text-ink-soft opacity-60 hover:opacity-100"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: active ? meta.color : "transparent",
                    boxShadow: `inset 0 0 0 1.5px ${meta.color}`,
                  }}
                />
                {meta.label}
              </button>
            );
          })}
        </div>

        <label className="mt-3 flex cursor-pointer items-center gap-2 text-[0.8rem] text-ink">
          <input
            type="checkbox"
            checked={props.showZbe}
            onChange={props.onToggleZbe}
            className="h-3.5 w-3.5 accent-[#1b1a16]"
          />
          Mostrar Zonas de Bajas Emisiones (ZBE)
        </label>
        {enabled.libre && (
          <p className="mt-2 text-[0.68rem] leading-snug text-ink-soft">
            Las bandas grises son aparcamiento libre (no regulado): el mapa carga
            ~53 000 tramos, puede tardar un momento.
          </p>
        )}
      </section>

      <div className="mx-5 h-px bg-line" />

      {/* ── Calcular precio (colapsable, cerrado por defecto) ── */}
      <section className="px-5 py-4">
        <button
          type="button"
          aria-expanded={priceOpen}
          onClick={() => setPriceOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Calcular precio de aparcamiento
          </span>
          <svg
            viewBox="0 0 16 16"
            width="14"
            height="14"
            aria-hidden="true"
            className={`shrink-0 text-ink-soft transition-transform ${
              priceOpen ? "rotate-180" : ""
            }`}
          >
            <path
              d="M4 6l4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {priceOpen && (
          <div className="mt-4">
            <h3 className="mb-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Etiqueta DGT
            </h3>
            <div className="grid grid-cols-5 gap-1.5">
              {DGT_OPTIONS.map((o) => {
                const active = label === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => props.onLabel(o.id)}
                    className={`flex flex-col items-center rounded-lg border px-1 py-1.5 text-center transition ${
                      active
                        ? "border-ink bg-ink text-paper"
                        : "border-line bg-paper-2/60 text-ink hover:border-ink/40"
                    }`}
                  >
                    <span
                      className="mb-0.5 h-1.5 w-1.5 rounded-full"
                      style={{ background: o.color }}
                    />
                    <span className="text-[0.66rem] font-semibold leading-tight">
                      {o.label}
                    </span>
                    <span className="text-[0.55rem] leading-tight opacity-70">
                      {o.effect}
                    </span>
                  </button>
                );
              })}
            </div>

            <label className="mt-3 flex cursor-pointer items-center gap-2 text-[0.8rem] text-ink">
              <input
                type="checkbox"
                checked={isResident}
                onChange={(e) => props.onResident(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#1f9d55]"
              />
              Soy residente de la zona verde
            </label>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-[0.66rem] font-semibold uppercase tracking-wide text-ink-soft">
                Desde
                <input
                  type="datetime-local"
                  value={start}
                  onChange={(e) => props.onStart(e.target.value)}
                  className="rounded-lg border border-line bg-paper-2/60 px-2 py-1.5 text-[0.78rem] font-normal normal-case tracking-normal text-ink outline-none focus:border-ink/50"
                />
              </label>
              <label className="flex flex-col gap-1 text-[0.66rem] font-semibold uppercase tracking-wide text-ink-soft">
                Hasta
                <input
                  type="datetime-local"
                  value={end}
                  onChange={(e) => props.onEnd(e.target.value)}
                  className="rounded-lg border border-line bg-paper-2/60 px-2 py-1.5 text-[0.78rem] font-normal normal-case tracking-normal text-ink outline-none focus:border-ink/50"
                />
              </label>
            </div>

            {ready &&
              (!validWindow ? (
                <p className="mt-3 rounded-xl border border-line bg-paper-2/50 px-4 py-3 text-[0.8rem] text-ink-soft">
                  Indica un horario válido (la hora de fin debe ser posterior al
                  inicio).
                </p>
              ) : (
                summary && (
                  <div
                    key={summary.title}
                    className="animate-rise mt-3 rounded-xl border border-line bg-paper-2/70 p-4"
                  >
                    <span className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                      {summary.tone === "blocked" ? "Atención" : "Recomendación"}
                    </span>
                    <p className="mt-1 font-display text-[1.45rem] font-medium leading-tight text-ink">
                      {summary.title}
                    </p>
                    <p className="mt-1 text-[0.82rem] leading-snug text-ink-soft">
                      {summary.body}
                    </p>

                    {decisions && (
                      <ul className="mt-3 space-y-1.5">
                        {CHOOSABLE.map((z) => {
                          const d = decisions[z];
                          return (
                            <li
                              key={z}
                              className="flex items-center justify-between gap-2 text-[0.8rem]"
                            >
                              <span className="flex items-center gap-2 text-ink">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ background: ZONE_META[z].color }}
                                />
                                {ZONE_META[z].label}
                              </span>
                              <span
                                className={`font-medium tabular-nums ${
                                  !d.allowed
                                    ? "text-rojo/80"
                                    : d.finalCost === 0
                                      ? "text-verde"
                                      : "text-ink"
                                }`}
                              >
                                {!d.allowed
                                  ? "No permitido"
                                  : d.finalCost === 0
                                    ? "Gratis"
                                    : euro(d.finalCost)}
                                {d.allowed && d.exceedsMaxStay && (
                                  <span className="ml-1 text-[0.62rem] text-naranja">
                                    máx.
                                  </span>
                                )}
                              </span>
                            </li>
                          );
                        })}
                        <li className="flex items-center justify-between gap-2 text-[0.8rem]">
                          <span className="flex items-center gap-2 text-ink">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: ZONE_META.libre.color }}
                            />
                            {ZONE_META.libre.label}
                          </span>
                          <span className="font-medium text-verde">Gratis</span>
                        </li>
                      </ul>
                    )}
                  </div>
                )
              ))}
          </div>
        )}
      </section>

      <footer className="mt-auto border-t border-line px-5 py-3 text-[0.64rem] leading-snug text-ink-soft">
        Datos oficiales del Ayuntamiento de Madrid (Servicio de Estacionamiento
        Regulado). Tarifas orientativas 2025 · verifica siempre la señalización.
      </footer>
    </aside>
  );
}
