"use client";

/*
 * + Action capture form — Sprint 4.7 Block L (standalone ActionCard).
 *
 * In v1 the ActionCard sub-form lives inside Resolve for engaged-spectrum
 * responses. v2 promotes it to a standalone activity so the banker can
 * record an operational follow-up without re-running Resolve. Same
 * compliance-scan wiring as Resolve's ActionCard description.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveActionCard } from "../actions";
import { scanText } from "@/lib/compliance-keywords";
import {
  ComplianceScanModal,
  type ScanFieldResult,
} from "@/app/_components/compliance-scan-modal";

export type ActionBankerOption = {
  id: string;
  display_name: string;
};

function defaultDueAtIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export function ActionForm({
  memberId,
  bankerId,
  conversationId,
  bankers,
  onSuccess,
  onCancel,
}: {
  memberId: string;
  bankerId: string;
  conversationId: string | null;
  bankers: ActionBankerOption[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState(bankerId);
  const [dueAtIso, setDueAtIso] = useState(defaultDueAtIso());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingScan, setPendingScan] = useState<{
    fieldsWithMatches: ScanFieldResult[];
  } | null>(null);

  function commitSave() {
    setError(null);
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!ownerId) {
      setError("Owner is required.");
      return;
    }
    if (!dueAtIso) {
      setError("Due date is required.");
      return;
    }

    // Block Q — compliance scan on description [FL:BANKER-PROSE].
    const matches = scanText(description);
    if (matches.length > 0) {
      setPendingScan({
        fieldsWithMatches: [
          { fieldName: "ActionCard.description", matches },
        ],
      });
      return;
    }

    dispatchSave();
  }

  function dispatchSave() {
    setPendingScan(null);
    startTransition(async () => {
      const result = await saveActionCard({
        member_id: memberId,
        banker_id: bankerId,
        conversation_id: conversationId,
        description,
        owner_id: ownerId,
        due_at_iso: dueAtIso,
      });
      if (result.ok) {
        router.refresh();
        onSuccess();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-xs text-blaze-grey-body">
          Description <span className="text-blaze-orange-deep">*</span>
        </span>
        <span className="block text-[11px] italic text-blaze-grey-soft">
          Describe the business action and timing. Avoid notes about the
          Member's personal characteristics.
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What the banker commits to do next, e.g., 'Send LOC application materials Friday; follow up Tuesday'"
          className="mt-1 w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Owner" required>
          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
          >
            {bankers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.display_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="When?" required>
          <input
            type="date"
            value={dueAtIso}
            onChange={(e) => setDueAtIso(e.target.value)}
            className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
          />
        </Field>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={commitSave}
          disabled={isPending}
          className="rounded bg-blaze-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blaze-orange-bright active:bg-blaze-orange-burnt disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="text-sm font-medium text-blaze-grey-body hover:text-blaze-charcoal"
        >
          Cancel
        </button>
      </div>
      {error && (
        <p className="text-sm text-blaze-danger" role="alert">
          {error}
        </p>
      )}

      {pendingScan && (
        <ComplianceScanModal
          bankerId={bankerId}
          memberId={memberId}
          fieldsWithMatches={pendingScan.fieldsWithMatches}
          onContinue={dispatchSave}
          onEdit={() => setPendingScan(null)}
          onCancel={() => {
            setPendingScan(null);
            onCancel();
          }}
        />
      )}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-blaze-grey-body">
        {label}
        {required && <span className="ml-1 text-blaze-orange-deep">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
