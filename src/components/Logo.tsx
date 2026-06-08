/** The parking "P" badge — the app's logo mark. */
export function ParkingMark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-[26%] bg-azul font-display font-semibold leading-none text-white shadow-sm ${className}`}
    >
      P
    </span>
  );
}

/** Logo lockup: parking "P" mark + wordmark. */
export default function Logo({
  markClass = "h-8 w-8 text-[1.25rem]",
  nameClass = "font-display text-[1.7rem] font-medium leading-none tracking-tight text-ink",
}: {
  markClass?: string;
  nameClass?: string;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <ParkingMark className={markClass} />
      <span className={nameClass}>aparcagratis</span>
    </span>
  );
}
