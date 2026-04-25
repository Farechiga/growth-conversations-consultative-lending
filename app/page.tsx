/*
 * Theme-verification page. One-off surface for Francisco to eyeball the Blaze token pass.
 * Will be replaced by the real app shell in the next Day-1 step. Intentionally uses raw
 * Tailwind utilities (not shadcn components) so failures are obviously theme-token failures
 * and not component-layer bugs.
 */

import Link from "next/link";

const ORANGE_SWATCHES = [
  { name: "orange", hex: "#B45F26", bg: "bg-blaze-orange" },
  { name: "orange-bright", hex: "#BC5D1D", bg: "bg-blaze-orange-bright" },
  { name: "orange-deep", hex: "#AD571C", bg: "bg-blaze-orange-deep" },
  { name: "orange-burnt", hex: "#8E3F0E", bg: "bg-blaze-orange-burnt" },
  { name: "orange-pale", hex: "#F2D9C2", bg: "bg-blaze-orange-pale" },
];

const GREY_SWATCHES = [
  { name: "grey-darker", hex: "#262626", bg: "bg-blaze-grey-darker" },
  { name: "grey-dark", hex: "#2B2B29", bg: "bg-blaze-grey-dark" },
  { name: "grey-body", hex: "#4F5052", bg: "bg-blaze-grey-body" },
  { name: "grey-mid", hex: "#636468", bg: "bg-blaze-grey-mid" },
  { name: "grey-soft", hex: "#888780", bg: "bg-blaze-grey-soft" },
];

const PARCHMENT_SWATCHES = [
  { name: "cream", hex: "#F5EFE5", bg: "bg-blaze-cream" },
  { name: "parchment", hex: "#E8E0D4", bg: "bg-blaze-parchment" },
  { name: "dust", hex: "#D7D3D0", bg: "bg-blaze-dust" },
  { name: "white", hex: "#FEFFFF", bg: "bg-blaze-white" },
];

const FUNCTIONAL_SWATCHES = [
  { name: "success", hex: "#5C7A3F", bg: "bg-blaze-success" },
  { name: "warning", hex: "#B47424", bg: "bg-blaze-warning" },
  { name: "danger", hex: "#9C3325", bg: "bg-blaze-danger" },
  { name: "info", hex: "#3D5A6C", bg: "bg-blaze-info" },
];

const BANKERS = [
  { name: "Scott Brynjolffson", role: "Primary banker" },
  { name: "Marcus Webb", role: "CRE specialist" },
  { name: "Priya Patel", role: "Growth lead" },
];

function Swatch({ name, hex, bg }: { name: string; hex: string; bg: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${bg} h-10 w-10 rounded border border-blaze-dust`} />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-blaze-grey-darker">{name}</span>
        <span className="text-xs text-blaze-grey-soft">{hex}</span>
      </div>
    </div>
  );
}

export default function ThemeCheckPage() {
  return (
    <div className="min-h-screen w-full bg-background">
      {/* §3 signature gradient band */}
      <div
        className="h-8 w-full"
        style={{ backgroundImage: "var(--blaze-gradient)" }}
        aria-hidden
      />

      {/* Header: wordmark + banker selector (static mock) */}
      <header className="border-b border-blaze-dust bg-blaze-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="text-blaze-orange-deep">Member</span>{" "}
            <span className="text-blaze-grey-darker">Signals</span>
          </h1>
          <div className="rounded border border-blaze-grey-soft/40 bg-blaze-white px-3 py-1.5 text-sm text-blaze-grey-darker">
            Logged in as <span className="font-medium">Scott Brynjolffson</span>
            <span className="ml-2 text-xs text-blaze-grey-soft">Primary banker</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-8 py-12">
        <p className="mb-2 text-xs uppercase tracking-wide text-blaze-grey-soft">
          Theme verification
        </p>
        <h2 className="mb-3 text-3xl font-semibold text-blaze-grey-darker">
          Blaze token check
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-blaze-grey-body">
          This surface exists only to confirm the Mira&nbsp;→&nbsp;Blaze theming pass
          landed correctly. It is not part of the demo. Once the palette, typography,
          buttons, and component patterns all read as expected against the style guide,
          this page gets replaced with the real app shell.
        </p>

        <p className="mt-4 max-w-2xl text-sm text-blaze-grey-body">
          Day-2 work in progress:{" "}
          <Link
            href="/members/jenny"
            className="font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
          >
            Jenny's Catering — Member profile (smoke test)
          </Link>
          .
        </p>

        {/* Section: palette */}
        <section className="mt-12">
          <h3 className="mb-4 text-base font-semibold text-blaze-grey-dark">
            Palette (sampled from the Blaze source PDF)
          </h3>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-blaze-grey-soft">
                Burnished orange
              </p>
              <div className="space-y-2">
                {ORANGE_SWATCHES.map((s) => (
                  <Swatch key={s.name} {...s} />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-blaze-grey-soft">
                Deep warm grey
              </p>
              <div className="space-y-2">
                {GREY_SWATCHES.map((s) => (
                  <Swatch key={s.name} {...s} />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-blaze-grey-soft">
                Warm parchment
              </p>
              <div className="space-y-2">
                {PARCHMENT_SWATCHES.map((s) => (
                  <Swatch key={s.name} {...s} />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-blaze-grey-soft">
                Functional
              </p>
              <div className="space-y-2">
                {FUNCTIONAL_SWATCHES.map((s) => (
                  <Swatch key={s.name} {...s} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section: typography scale */}
        <section className="mt-12">
          <h3 className="mb-4 text-base font-semibold text-blaze-grey-dark">
            Typography scale (§5.2)
          </h3>
          <div className="space-y-3 rounded border border-blaze-dust bg-blaze-white p-6">
            <p className="text-[32px] font-semibold leading-tight text-blaze-orange-deep">
              Display H1 · Improving lives
            </p>
            <p className="text-2xl font-semibold text-blaze-grey-darker">
              H1 · Page title in standard context
            </p>
            <p className="text-xl font-semibold text-blaze-grey-darker">
              H2 · Section heading
            </p>
            <p className="text-base font-semibold text-blaze-grey-dark">
              H3 · Subsection heading, card title
            </p>
            <p className="text-sm text-blaze-grey-darker">
              Body · The default reading weight for banker-facing text.
            </p>
            <p className="text-sm font-medium text-blaze-grey-darker">
              Body emphasis · For inline keywords and key terms.
            </p>
            <p className="text-[13px] text-blaze-grey-soft">
              Small · Captions, timestamps, secondary metadata.
            </p>
            <p className="text-xs font-medium uppercase tracking-wide text-blaze-grey-soft">
              Caption · Label above a metric number
            </p>
          </div>
        </section>

        {/* Section: buttons */}
        <section className="mt-12">
          <h3 className="mb-4 text-base font-semibold text-blaze-grey-dark">
            Buttons (§7)
          </h3>
          <div className="flex flex-wrap items-center gap-4">
            <button className="rounded bg-blaze-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blaze-orange-bright active:bg-blaze-orange-burnt">
              Run Growth track
            </button>
            <button className="rounded border border-blaze-grey-soft bg-transparent px-4 py-2 text-sm font-medium text-blaze-grey-dark transition-colors hover:bg-blaze-cream">
              Cancel
            </button>
            <button className="rounded bg-transparent px-2 py-1 text-sm font-medium text-blaze-orange-deep transition-colors hover:text-blaze-orange-burnt hover:underline">
              Learn more
            </button>
            <button className="rounded border border-blaze-danger bg-transparent px-4 py-2 text-sm font-medium text-blaze-danger transition-colors hover:bg-blaze-danger hover:text-white">
              Decline
            </button>
          </div>
        </section>

        {/* Section: orange-headed panel (§4) */}
        <section className="mt-12">
          <h3 className="mb-4 text-base font-semibold text-blaze-grey-dark">
            Orange-headed panel (§4 — dominant component pattern)
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="overflow-hidden rounded-md border border-blaze-dust">
              <div className="bg-blaze-orange px-3 py-2 text-sm font-medium text-white">
                Revolving line of credit
              </div>
              <div className="bg-blaze-white px-4 py-3 text-sm text-blaze-grey-dark">
                Smooth out income fluctuations with a financial buffer.
              </div>
            </div>
            <div className="overflow-hidden rounded-md border border-blaze-dust">
              <div className="bg-blaze-orange px-3 py-2 text-sm font-medium text-white">
                Business Visa
              </div>
              <div className="bg-blaze-white px-4 py-3 text-sm text-blaze-grey-dark">
                Float working expenses, earn rewards on operational spend.
              </div>
            </div>
          </div>
        </section>

        {/* Section: chips (§8.4) */}
        <section className="mt-12">
          <h3 className="mb-4 text-base font-semibold text-blaze-grey-dark">
            Chips (§8.4 — Meeting recap chip-tap UI)
          </h3>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md border border-blaze-orange bg-blaze-orange px-3 py-1.5 text-sm text-white">
              Cash flow seasonal
            </button>
            <button className="rounded-md border border-blaze-grey-soft/30 bg-blaze-cream px-3 py-1.5 text-sm text-blaze-grey-dark transition-colors hover:bg-blaze-parchment">
              Payroll on the 15th
            </button>
            <button className="rounded-md border border-blaze-grey-soft/30 bg-blaze-cream px-3 py-1.5 text-sm text-blaze-grey-dark transition-colors hover:bg-blaze-parchment">
              Equipment aging
            </button>
            <button className="rounded-md border border-blaze-grey-soft/30 bg-blaze-cream px-3 py-1.5 text-sm text-blaze-grey-dark transition-colors hover:bg-blaze-parchment">
              Hiring pressure
            </button>
          </div>
        </section>

        {/* Section: banker identities (Q-006 resolution) */}
        <section className="mt-12 mb-16">
          <h3 className="mb-4 text-base font-semibold text-blaze-grey-dark">
            Banker identities (Q-006 resolved)
          </h3>
          <div className="overflow-hidden rounded-md border border-blaze-dust">
            {BANKERS.map((b, i) => (
              <div
                key={b.name}
                className={`flex items-center justify-between px-4 py-3 text-sm ${
                  i === 0 ? "bg-blaze-orange-pale" : "bg-blaze-white"
                } ${i < BANKERS.length - 1 ? "border-b border-blaze-dust" : ""}`}
              >
                <span className="font-medium text-blaze-grey-darker">{b.name}</span>
                <span className="text-xs text-blaze-grey-soft">{b.role}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <div
        className="h-1 w-full"
        style={{ backgroundImage: "var(--blaze-gradient)" }}
        aria-hidden
      />
    </div>
  );
}
