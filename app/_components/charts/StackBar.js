/**
 * One bar split into ordered parts (for example the age of money owed),
 * with a 2px gap between parts. segments: [{ key, label, value, color }].
 * The legend and figures are printed under the bar.
 */
export default function StackBar({ title, total, segments, format }) {
  const sum = segments.reduce((t, s) => t + s.value, 0);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-heading">{title}</span>
        <span className="num font-bold text-heading">{total}</span>
      </div>
      <div className="mt-2 flex h-6 gap-[2px] overflow-hidden rounded-[4px] bg-background" aria-hidden>
        {sum > 0
          ? segments.filter((s) => s.value > 0).map((s) => (
              <span key={s.key} className="h-full" style={{ width: `${(s.value / sum) * 100}%`, background: `var(${s.color})` }} />
            ))
          : null}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-secondary">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-[3px]" style={{ background: `var(${s.color})` }} aria-hidden />
            {s.label}: <span className="num font-semibold text-heading">{format(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
