import { Clock } from "./Clock";

export function StatusBar() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-16 items-center gap-4 border-b border-white/10 bg-slate-950/75 px-4 backdrop-blur-md sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <TriggerMark />
        <div className="min-w-0 leading-tight">
          <h1 className="text-lg font-bold tracking-tight text-slate-50">Trigger Point</h1>
          <p className="hidden truncate text-xs text-slate-400 lg:block">
            Glendale Fire Department · Wildfire evacuation pre-incident planning
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 justify-center">
        <p
          role="note"
          className="truncate rounded-full border border-warning/50 bg-warning/10 px-3 py-1 text-xs font-semibold tracking-wide text-warning sm:text-sm"
        >
          PLANNING SCENARIO
          <span className="font-medium">
            {" — "}
            <span className="hidden lg:inline">experimental projection, </span>not a forecast
          </span>
        </p>
      </div>

      <Clock />
    </header>
  );
}

function TriggerMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-9 shrink-0" aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-slate-800" />
      <path
        d="M5 23c4-1 6-6 11-6s7 5 11 6"
        className="fill-none stroke-warning"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeDasharray="3 3"
      />
      <circle cx="16" cy="11" r="3.5" className="fill-accent" />
    </svg>
  );
}
