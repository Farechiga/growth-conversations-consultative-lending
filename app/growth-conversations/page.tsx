/*
 * Growth Conversations — standalone entry (Sprint 4 §C / §D).
 *
 * Entered when the banker navigates directly to /growth-conversations
 * without specifying a Member. Renders the Member lookup; selecting a
 * Member navigates to /growth-conversations/[slug] (the prefilled entry).
 *
 * The simulated current banker is Scott Brynjolffson for the demo. The
 * lookup is scoped to Members where Scott is the primary_banker. Sprint
 * 6 will add a banker-identity dropdown that changes the scoping.
 */

import "dotenv/config";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { GrowthConversationsHeader } from "./_shared";
import { MemberLookup, type LookupMember } from "./member-lookup";
import { Breadcrumb } from "@/app/_components/breadcrumb";

function getPrisma() {
  const dbPath = (process.env.DATABASE_URL ?? "file:./dev.db").replace(
    /^file:/,
    "",
  );
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: dbPath }) });
}

const SIMULATED_CURRENT_BANKER_NAME = "Scott Brynjolffson";

export default async function GrowthConversationsLandingPage() {
  const prisma = getPrisma();

  const currentBanker = await prisma.banker.findFirst({
    where: { display_name: SIMULATED_CURRENT_BANKER_NAME },
    select: { id: true, display_name: true },
  });
  const portfolioMembers = currentBanker
    ? await prisma.member.findMany({
        where: { primary_banker_id: currentBanker.id },
        include: {
          member_type: { select: { name: true } },
          // Sprint 4 §4.1b B — count active engaged Recommendations per
          // Member so each lookup row can render an "open opportunity"
          // notification. The count gate matches the Bucket 2 logic in
          // lib/priorities.ts (response in engaged | leaning_yes |
          // committed; not declined / funded).
          _count: {
            select: {
              recommendations: {
                where: {
                  response: {
                    in: ["engaged", "leaning_yes", "committed"],
                  },
                },
              },
            },
          },
        },
        orderBy: { legal_name: "asc" },
      })
    : [];
  await prisma.$disconnect();

  // Serialize Date fields to ISO strings so the client component can
  // hydrate cleanly (Date objects don't serialize through the
  // server/client boundary in Next 16).
  const lookupMembers: LookupMember[] = portfolioMembers.map((m) => ({
    id: m.id,
    slug: m.slug,
    legal_name: m.legal_name,
    doing_business_as: m.doing_business_as,
    member_type_name: m.member_type.name,
    stage: m.stage,
    last_touch_at: m.last_touch_at?.toISOString() ?? null,
    // active_signal_count is the seed-time-derived denormalized count
    // on Member; open_opportunity_count is the just-computed _count.
    active_signal_count: m.active_signal_count,
    open_opportunity_count: m._count.recommendations,
  }));

  return (
    <div className="min-h-screen w-full bg-blaze-paper">
      <div
        className="h-8 w-full"
        style={{ backgroundImage: "var(--blaze-gradient)" }}
        aria-hidden
      />
      <GrowthConversationsHeader
        bankerName={currentBanker?.display_name ?? SIMULATED_CURRENT_BANKER_NAME}
      />
      {/* Sprint 4 §4.1b C — breadcrumb. "Growth Conversations" is the
          terminal segment (current page); the home segment links back
          to the demo's home Member profile. */}
      <div className="mx-auto max-w-6xl px-8 pt-4">
        <Breadcrumb
          segments={[
            { label: "Member Signals", href: "/members/jenny" },
            { label: "Growth Conversations", current: true },
          ]}
        />
      </div>
      <main className="mx-auto max-w-6xl px-8 py-12">
        <div className="flex items-baseline">
          <span
            aria-hidden
            className="mr-3 inline-block h-6 w-[27px] bg-blaze-orange"
          />
          <h1 className="text-2xl font-semibold tracking-[0.02em] text-blaze-charcoal leading-none">
            Select Member
          </h1>
        </div>
        {/* Sprint 4 §4.1b D — instructional paragraph removed. The orange
            section mark + heading is sufficient context for a banker; the
            paragraph was explaining what a Member lookup is. */}
        <div className="mt-6">
          <MemberLookup members={lookupMembers} />
        </div>
      </main>
      <div
        className="h-1 w-full"
        style={{ backgroundImage: "var(--blaze-gradient)" }}
        aria-hidden
      />
    </div>
  );
}
