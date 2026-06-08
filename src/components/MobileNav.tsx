"use client";

import { ParkingMark } from "./Logo";

interface Props {
  onOpen: () => void;
}

/** Mobile top bar: app name + hamburger that opens the full drawer. */
export default function MobileNav({ onOpen }: Props) {
  return (
    <header className="pointer-events-auto fixed inset-x-0 top-0 z-[1000] flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
      <span className="flex items-center gap-2">
        <ParkingMark className="h-7 w-7 text-[1.05rem]" />
        <span className="font-display text-[1.3rem] font-medium leading-none tracking-tight text-ink">
          aparcagratis
        </span>
      </span>
      <button
        type="button"
        aria-label="Abrir menú"
        onClick={onOpen}
        className="-mr-1.5 flex h-9 w-9 items-center justify-center rounded-lg text-ink transition hover:bg-paper-2"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <path
            d="M4 7h14M4 11h14M4 15h14"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </header>
  );
}
