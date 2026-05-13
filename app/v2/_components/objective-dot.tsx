"use client";

/*
 * v2 ObjectiveDot — Sprint 4.7 Turn 1 Block C.
 *
 * Single dot primitive used by the v2 sidebar's objectives section.
 * Each captured piece of evidence renders as one dot against the
 * objective(s) it advances. Dots are the primary glance-able UI
 * primitive of v2.
 *
 * Visual states (per ARCHITECTURE_V2 §5.1):
 *   filled   — solid `--blaze-grey-darker` fill, no stroke
 *              "this evidence is captured and current"
 *   outlined — hollow circle, 0.5px `--blaze-grey-darker` stroke,
 *              40% opacity
 *              "this evidence type is suggested but optional"
 *   faint    — hollow circle, `--blaze-grey-soft` stroke, 20% opacity
 *              "not yet relevant; placeholder space"
 *   accented — solid `--blaze-orange-burnt` fill (CC's pick from the
 *              two §5.1 options — solid-fill chosen over outlined-with-
 *              ring because the visual weight is needed against rows
 *              of all-grey dots; the open-thread accent should pop)
 *              "this evidence is the open thread; needs banker attention"
 *
 * Sizing: 8px diameter (4px radius), 6px gap between dots in a row
 * (per §5.4). Sizing is fixed; rendering at other sizes requires
 * passing a size prop in a future iteration.
 *
 * Click behavior (per §5.3) — dots are interactive:
 *   filled   → captured evidence detail panel
 *   outlined → capture form for that evidence type
 *   faint    → no-op (or subtle "not yet relevant" tooltip)
 *   accented → detail panel for the open thread
 *
 * Turn 1 wires click handlers to placeholder behavior; Turn 2 surfaces
 * the real detail/capture panels.
 */

export type DotState = "filled" | "outlined" | "faint" | "accented";

export function ObjectiveDot({
  state,
  onClick,
  ariaLabel,
}: {
  state: DotState;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const baseClass = "h-2 w-2 rounded-full";
  let stateClass = "";
  switch (state) {
    case "filled":
      stateClass = "bg-blaze-grey-darker";
      break;
    case "outlined":
      stateClass = "border-[0.5px] border-blaze-grey-darker bg-transparent opacity-40";
      break;
    case "faint":
      stateClass = "border border-blaze-grey-soft bg-transparent opacity-20";
      break;
    case "accented":
      stateClass = "bg-blaze-orange-burnt";
      break;
  }
  const interactive = !!onClick;
  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? `${state} dot`}
        className={`${baseClass} ${stateClass} cursor-pointer transition-opacity hover:opacity-80`}
      />
    );
  }
  return (
    <span
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
      className={`${baseClass} ${stateClass} inline-block`}
    />
  );
}

/*
 * ObjectiveDotRow — convenience wrapper that renders a horizontal row
 * of dots with the spec'd 6px gap. Used by the sidebar's objective
 * blocks.
 */
export function ObjectiveDotRow({
  dots,
  ariaLabel,
}: {
  dots: Array<{ state: DotState; onClick?: () => void; ariaLabel?: string }>;
  ariaLabel?: string;
}) {
  return (
    <div
      role="list"
      aria-label={ariaLabel}
      className="flex items-center gap-1.5"
    >
      {dots.map((d, i) => (
        <ObjectiveDot
          key={i}
          state={d.state}
          onClick={d.onClick}
          ariaLabel={d.ariaLabel}
        />
      ))}
    </div>
  );
}
