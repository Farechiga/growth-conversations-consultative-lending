/*
 * Sprint 5b.2 — Insight Engine portfolio surfaces layout.
 *
 * Sprint 7a — the Insight Engine landing is now the EVP-facing
 * dashboard with its own header. The legacy 4-tab routes
 * (`tracks` / `portfolio` / `coverage` / `stage-skip`) keep the
 * Member Signals wordmark header + nav bar via this shared layout.
 * Children render edge-to-edge so the dashboard page can use full
 * viewport width; legacy pages constrain their own content via inner
 * `max-w-6xl` wrappers where needed.
 */

import Link from "next/link";

export default function InsightEngineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-blaze-paper">
      <header className="border-b border-blaze-rule bg-white">
        {/* Full-width header (px-8, no max-w-6xl) so the wordmark + nav
            left-align to the dashboard body's left edge, and the
            "Growth Opportunities" label + demo note right-align to the
            page's right edge. */}
        <div className="flex items-baseline justify-between px-8 py-4">
          <Link href="/" className="text-base font-semibold text-blaze-charcoal hover:opacity-80">
            <span className="text-blaze-orange">Member</span> Signals
          </Link>
          <p className="text-[10px] uppercase tracking-[0.08em] text-blaze-charcoal">
            <span className="text-blaze-orange-deep">Growth</span> Opportunities
          </p>
        </div>
        <nav className="border-t border-blaze-rule">
          <div className="flex gap-6 px-8 py-2 text-sm">
            {/* Sprint 7a — dashboard at /v2/insight-engine is the
                default landing. Nav trimmed (2026-06): the
                "Lending product performance" (/tracks) and "Members who
                skipped earlier work" (/stage-skip) surfaces are hidden
                from the nav for now — the routes/pages still exist and
                work if linked directly; only the nav links are removed. */}
            <NavLink href="/v2/insight-engine">Dashboard</NavLink>
            <NavLink href="/v2/insight-engine/portfolio">Member portfolio</NavLink>
            <NavLink href="/v2/insight-engine/coverage">Open threads</NavLink>
            <span className="ml-auto text-xs text-blaze-grey-soft">
              Demo phase: all bankers see all surfaces (Pilot adds RBAC)
            </span>
          </div>
        </nav>
      </header>
      <main>{children}</main>
      <div
        className="mt-6 h-1 w-full"
        style={{ backgroundImage: "var(--blaze-gradient)" }}
        aria-hidden
      />
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-blaze-grey-body transition-colors hover:text-blaze-orange-deep"
    >
      {children}
    </Link>
  );
}
