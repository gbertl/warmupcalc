import { useState } from "react";

interface Result {
  title: string;
  weight: number;
  reps: number;
}

/** Smallest plate / jump your gym loads in (e.g. 5 → only …40, 45, 50… exist). Change to 2.5 if you have micro plates. */
const GYM_WEIGHT_STEP_LB = 5;

function snapToGymWeight(lb: number): number {
  return Math.round(lb / GYM_WEIGHT_STEP_LB) * GYM_WEIGHT_STEP_LB;
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

const App = () => {
  const [weight, setWeight] = useState<number | "">("");
  const [result, setResult] = useState<Result[]>([]);

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || Number(raw) === 0) {
      setWeight("");
      setResult([]);
      return;
    }

    const value = Number(raw);
    setWeight(value);

    const result: Result[] = [];

    result.push({
      title: "40%",
      weight: snapToGymWeight(value * 0.4),
      reps: 8,
    });
    result.push({
      title: "60%",
      weight: snapToGymWeight(value * 0.6),
      reps: 5,
    });
    result.push({
      title: "75%",
      weight: snapToGymWeight(value * 0.75),
      reps: 2,
    });

    setResult(result);
  };

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
            Choose your working weight to see warmup sets and per-side plate
            loads. On machines? You can ignore the loading details.
          </p>
        </header>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8">
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
            <ul className="mt-8 space-y-0 divide-y divide-white/10">
              {result.map((item) => (
                <li
                  key={item.title}
                  className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium tabular-nums text-blue-400/90">
                      {item.title}
                    </span>
                    <span className="text-lg font-semibold tabular-nums text-white">
                      {item.weight} lbs
                    </span>
                    <span className="text-slate-500">×</span>
                    <span className="tabular-nums text-slate-300">
                      {item.reps} reps
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500 sm:max-w-[55%] sm:text-right">
                    {platesBreakdownLb(item.weight)}
                  </p>
                </li>
              ))}
            </ul>
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
            href="mailto:gilbertlcsndle@gmail.com"
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
