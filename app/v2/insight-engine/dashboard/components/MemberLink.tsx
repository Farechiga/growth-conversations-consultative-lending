"use client";

/*
 * Sprint 7a-patch Block G — synthetic Member → fixture link routing.
 *
 * Every Member click in the dashboard routes through this component.
 * Fixture Members (4 Prisma seeds) link to their slugged workstation.
 * Synthetic Members (216 generated rows) link to one of the 4 fixtures
 * by Member-Type analog, with `representative_of=...&example_for=...`
 * query parameters that trigger a notation banner on the fixture page.
 *
 * Mapping per patch §G.2:
 *   event_services         → jenny
 *   maintenance_services   → northland
 *   specialty_manufacturer → cygnus
 *   professional_services  → cygnus
 *   healthcare_services    → cygnus
 *   food_services          → jenny
 *   retail                 → jenny
 *   construction           → northland
 */

import Link from "next/link";
import type { MemberType, SyntheticMember } from "@/lib/synthetic-data/types";

const FIXTURE_NAMES = new Set<string>([
  "Jenny's Catering",
  "Northland HVAC",
  "Cygnus Bioscience",
  "Riverside Catering",
]);

const FIXTURE_SLUG_BY_NAME: Record<string, string> = {
  "Jenny's Catering": "jenny",
  "Northland HVAC": "northland",
  "Cygnus Bioscience": "cygnus",
  "Riverside Catering": "riverside",
};

export const MEMBER_TYPE_TO_FIXTURE_SLUG: Record<MemberType, string> = {
  event_services: "jenny",
  maintenance_services: "northland",
  specialty_manufacturer: "cygnus",
  professional_services: "cygnus",
  healthcare_services: "cygnus",
  food_services: "jenny",
  retail: "jenny",
  construction: "northland",
};

export function memberHref(args: {
  name: string;
  memberType?: MemberType;
}): string {
  if (FIXTURE_NAMES.has(args.name)) {
    return `/v2/members/${FIXTURE_SLUG_BY_NAME[args.name]}`;
  }
  const slug = args.memberType
    ? MEMBER_TYPE_TO_FIXTURE_SLUG[args.memberType]
    : "jenny";
  const params = new URLSearchParams({
    representative_of: args.name,
    ...(args.memberType ? { example_for: args.memberType } : {}),
  });
  return `/v2/members/${slug}?${params.toString()}`;
}

export function MemberLink({
  name,
  memberType,
  className,
  children,
}: {
  name: string;
  memberType?: MemberType;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={memberHref({ name, memberType })}
      className={className ?? "font-medium text-blaze-charcoal hover:text-blaze-orange-deep hover:underline"}
    >
      {children ?? name}
    </Link>
  );
}

export function SyntheticMemberLink({
  member,
  className,
}: {
  member: Pick<SyntheticMember, "name" | "member_type">;
  className?: string;
}) {
  return (
    <MemberLink
      name={member.name}
      memberType={member.member_type}
      className={className}
    />
  );
}
