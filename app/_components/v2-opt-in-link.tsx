"use client";

/*
 * V2 opt-in cross-link — Sprint 4.7 Q-X1.
 *
 * Renders the "Try the new view →" affordance on v1 surfaces ONLY when
 * the v2 feature flag is on. Flag is opt-in via `?v2=true` query string
 * during the build phase; persists for the rest of the session via
 * sessionStorage so the banker can navigate without re-typing the
 * query.
 *
 * Default state (no flag): renders nothing — v1 banker has no idea v2
 * exists. This is the intentional posture during build per Q-X1.
 *
 * Sprint 6 may flip the default for the EVP demo deployment.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const FLAG_KEY = "blaze:v2-flag";

export function V2OptInLink({ href }: { href: string }) {
  const searchParams = useSearchParams();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const queryFlag = searchParams.get("v2") === "true";
    if (queryFlag) {
      window.sessionStorage.setItem(FLAG_KEY, "true");
      setEnabled(true);
      return;
    }
    const stored = window.sessionStorage.getItem(FLAG_KEY) === "true";
    setEnabled(stored);
  }, [searchParams]);

  if (!enabled) return null;

  return (
    <>
      <Link
        href={href}
        className="text-xs font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
      >
        Try the new view →
      </Link>
      <span className="h-4 w-px bg-blaze-rule" aria-hidden />
    </>
  );
}
