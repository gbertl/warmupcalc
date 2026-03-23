import { useCallback, useMemo, useRef, useState } from "react";

interface Result {
  title: string;
  weight: number;
  /** Omitted for the working-weight (100%) row. */
  reps?: number;
  /** True for the final target load (not warmup). */
  isWorkingSet?: boolean;
}

/** Smallest plate / jump your gym loads in (e.g. 5 → only …40, 45, 50… exist). Change to 2.5 if you have micro plates. */
const GYM_WEIGHT_STEP_LB = 5;

function snapToGymWeight(lb: number): number {
  return Math.round(lb / GYM_WEIGHT_STEP_LB) * GYM_WEIGHT_STEP_LB;
}

/** Per-side load must be in 5 lb jumps (no 2.5s); floor after halving the snapped bar total. */
function snapPerSideFloorLb(lb: number): number {
  return Math.max(0, Math.floor(lb / GYM_WEIGHT_STEP_LB) * GYM_WEIGHT_STEP_LB);
}

/** Standard full-size plates (lb), largest first — greedy sum matches typical loading. */
const PLATE_SIZES_LB = [45, 35, 25, 10, 5] as const;

function platesBreakdownLb(totalLb: number): string {
  let remaining = totalLb;
  const parts: string[] = [];
  for (const size of PLATE_SIZES_LB) {
    const count = Math.floor(remaining / size + 1e-9);
    if (count > 0) {
      parts.push(`${count}×${size}`);
      remaining -= count * size;
    }
  }
  return parts.join(", ");
}

const EquipmentMode = {
  Barbell: "barbell",
  Machine: "machine",
} as const;

type EquipmentMode = (typeof EquipmentMode)[keyof typeof EquipmentMode];

const WARMUP_SETS: { pct: number; reps: number; title: string }[] = [
  { title: "40%", pct: 0.4, reps: 8 },
  { title: "60%", pct: 0.6, reps: 5 },
  { title: "75%", pct: 0.75, reps: 2 },
];

const SWIPE_MIN_PX = 48;
const SWIPE_HORIZONTAL_RATIO = 1.35;
const FEEDBACK_EMAIL_PARTS = ["gilbertlcsndle", "gmail.com"] as const;

const App = () => {
  const [mode, setMode] = useState<EquipmentMode>(EquipmentMode.Barbell);
  const [weight, setWeight] = useState<number | "">("");
  const cardSwipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const onCardSwipeTouchStart = useCallback((e: React.TouchEvent) => {
    const el = e.target as HTMLElement | null;
    if (el?.closest("input, textarea, select, a, [contenteditable]")) {
      cardSwipeStartRef.current = null;
      return;
    }
    const t = e.changedTouches[0];
    cardSwipeStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onCardSwipeTouchEnd = useCallback((e: React.TouchEvent) => {
    const start = cardSwipeStartRef.current;
    cardSwipeStartRef.current = null;
    if (!start) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;

    if (Math.abs(dx) < SWIPE_MIN_PX) return;
    if (Math.abs(dx) < Math.abs(dy) * SWIPE_HORIZONTAL_RATIO) return;

    if (dx < 0) {
      setMode((m) =>
        m === EquipmentMode.Barbell ? EquipmentMode.Machine : m,
      );
    } else {
      setMode((m) =>
        m === EquipmentMode.Machine ? EquipmentMode.Barbell : m,
      );
    }
  }, []);

  const onCardSwipeTouchCancel = useCallback(() => {
    cardSwipeStartRef.current = null;
  }, []);

  const handleEmailClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const [local, domain] = FEEDBACK_EMAIL_PARTS;
      window.location.href = `mailto:${local}@${domain}`;
    },
    [],
  );

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || Number(raw) === 0) {
      setWeight("");
      return;
    }
    setWeight(Number(raw));
  };

  const result: Result[] = useMemo(() => {
    if (weight === "" || weight === 0) {
      return [];
    }

    const value = Number(weight);

    if (mode === EquipmentMode.Machine) {
      return [
        ...WARMUP_SETS.map((s) => ({
          title: s.title,
          weight: snapToGymWeight(value * s.pct),
          reps: s.reps,
        })),
        {
          title: "100%",
          weight: snapToGymWeight(value),
          isWorkingSet: true,
        },
      ];
    }

    /** Barbell: % of full bar → snap total → ÷2 → floor per side to 5 lb (no 2.5 lb plates). */
    const perSide = (pct: number) =>
      snapPerSideFloorLb(snapToGymWeight(value * pct) / 2);

    return [
      ...WARMUP_SETS.map((s) => ({
        title: s.title,
        weight: perSide(s.pct),
        reps: s.reps,
      })),
      {
        title: "100%",
        weight: perSide(1),
        isWorkingSet: true,
      },
    ];
  }, [weight, mode]);

  const warmupRows = result.filter((r) => !r.isWorkingSet);
  const workingRow = result.find((r) => r.isWorkingSet);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div
        className="bg-gradient-animate pointer-events-none absolute inset-0"
        aria-hidden
      />
      <div
        className="bg-mesh-drift pointer-events-none absolute inset-0"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-slate-950/30 via-transparent to-slate-950/90"
        aria-hidden
      />

      <main className="relative z-10 w-full max-w-md space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            WarmupCalc
          </h1>
          <p className="text-sm leading-relaxed text-slate-400">
            Enter your target working weight and we&apos;ll calculate warmup
            sets
          </p>
        </header>

        <div
          className="touch-pan-y rounded-2xl border border-white/10 bg-slate-950/40 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8"
          onTouchStart={onCardSwipeTouchStart}
          onTouchEnd={onCardSwipeTouchEnd}
          onTouchCancel={onCardSwipeTouchCancel}
        >
          <div
            className="mb-6 flex rounded-xl border border-white/10 bg-slate-900/50 p-1"
            role="tablist"
            aria-label="Equipment type"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === EquipmentMode.Barbell}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                mode === EquipmentMode.Barbell
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-300"
              }`}
              onClick={() => setMode(EquipmentMode.Barbell)}
            >
              Barbell
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === EquipmentMode.Machine}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                mode === EquipmentMode.Machine
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-300"
              }`}
              onClick={() => setMode(EquipmentMode.Machine)}
            >
              Machine
            </button>
          </div>

          <label
            htmlFor="weight"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400"
          >
            Working weight (lbs)
          </label>
          <input
            id="weight"
            type="number"
            min={0}
            inputMode="decimal"
            onChange={handleWeightChange}
            value={weight}
            placeholder="e.g. 225"
            className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3.5 text-lg text-white shadow-inner placeholder:text-slate-500 focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />

          {result.length > 0 && (
            <div className="mt-8 space-y-0">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                Warmup
              </p>
              <ul className="divide-y divide-white/10">
                {warmupRows.map((item) => (
                  <li
                    key={item.title}
                    className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                  >
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-medium tabular-nums text-blue-400/90">
                        {item.title}
                      </span>
                      <span className="text-lg font-semibold tabular-nums text-white">
                        {item.weight} lbs
                        {mode === EquipmentMode.Barbell && (
                          <span className="ml-1 text-xs font-normal text-slate-500">
                            per side
                          </span>
                        )}
                      </span>
                      {item.reps != null && (
                        <>
                          <span className="text-slate-500">×</span>
                          <span className="tabular-nums text-slate-300">
                            {item.reps} reps
                          </span>
                        </>
                      )}
                    </div>
                    {mode === EquipmentMode.Barbell && (
                      <p className="text-xs leading-relaxed text-slate-500 sm:max-w-[55%] sm:text-right">
                        {platesBreakdownLb(item.weight)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>

              {workingRow && (
                <div className="mt-6 border-t border-white/15 pt-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-400/95">
                    Working set
                  </p>
                  <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/25 px-4 py-4 shadow-inner shadow-black/20 sm:px-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-medium tabular-nums text-emerald-300/90">
                          {workingRow.title}
                        </span>
                        <span className="text-xl font-semibold tabular-nums text-white">
                          {workingRow.weight} lbs
                          {mode === EquipmentMode.Barbell && (
                            <span className="ml-1 text-sm font-normal text-slate-400">
                              per side
                            </span>
                          )}
                        </span>
                      </div>
                      {mode === EquipmentMode.Barbell && (
                        <p className="text-xs leading-relaxed text-slate-400 sm:max-w-[55%] sm:text-right">
                          {platesBreakdownLb(workingRow.weight)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {result.length === 0 && (
            <p className="mt-6 text-center text-sm text-slate-500">
              Results appear here once you enter a weight.
            </p>
          )}
        </div>

        <p className="text-center text-xs text-slate-600">
          Have feedback? I&apos;d love to hear it —{" "}
          <a
            className="text-slate-500 underline decoration-slate-600/50 underline-offset-2 hover:text-slate-400"
            href="#email"
            onClick={handleEmailClick}
          >
            email
          </a>
          {" / "}
          <a
            className="text-slate-500 underline decoration-slate-600/50 underline-offset-2 hover:text-slate-400"
            href="https://github.com/gbertl/warmupcalc/issues/new"
            rel="noreferrer"
            target="_blank"
          >
            GitHub issue
          </a>
        </p>
      </main>
    </div>
  );
};

export default App;
