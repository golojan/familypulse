/**
 * Placeholder ad slot for the public right rail. Renders a labelled, clearly
 * non-content box so the layout reserves space for advertising. Swap the inner
 * markup for a real ad-network embed (e.g. an AdSense <ins> unit) when ready.
 */
export function AdSlot({
  label = "Advertisement",
  height = 250,
}: {
  label?: string;
  height?: number;
}) {
  return (
    <aside
      aria-label={label}
      className="grid place-items-center rounded-lg border border-dashed border-fp-line bg-fp-soft text-center shadow-soft"
      style={{ minHeight: height }}
    >
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-fp-muted/70">
          {label}
        </p>
        <p className="mt-1 text-xs font-semibold text-fp-muted/60">Your ad could be here</p>
      </div>
    </aside>
  );
}
