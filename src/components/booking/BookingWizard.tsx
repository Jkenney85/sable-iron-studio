"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import { formatMoney, formatDuration, formatDate, formatTime } from "@/lib/format";
import { SlotPicker } from "./SlotPicker";
import { ReferenceUploader } from "./ReferenceUploader";
import type {
  WizardType,
  WizardArtist,
  ReferenceImage,
  PaymentChoice,
} from "./types";

type StepKey = "type" | "artist" | "time" | "contact" | "intake" | "review";

const STEP_LABELS: Record<StepKey, string> = {
  type: "Service",
  artist: "Artist",
  time: "Date & time",
  contact: "Your details",
  intake: "Your idea",
  review: "Review & pay",
};

export function BookingWizard({
  types,
  preselectedArtistSlug,
}: {
  types: WizardType[];
  preselectedArtistSlug?: string;
}) {
  const [typeId, setTypeId] = useState<string | null>(null);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [startIso, setStartIso] = useState<string | null>(null);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [intake, setIntake] = useState({
    placement: "",
    approxSize: "",
    style: "",
    budget: "",
    notes: "",
    isColor: false,
    isCoverUp: false,
  });
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("DEPOSIT");
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = useMemo(
    () => types.find((t) => t.id === typeId) ?? null,
    [types, typeId]
  );
  const selectedArtist = useMemo(
    () => selectedType?.artists.find((a) => a.id === artistId) ?? null,
    [selectedType, artistId]
  );

  const steps: StepKey[] = useMemo(() => {
    const base: StepKey[] = ["type", "artist", "time", "contact"];
    if (selectedType?.requiresIntake) base.push("intake");
    base.push("review");
    return base;
  }, [selectedType]);

  const currentStep = steps[Math.min(stepIndex, steps.length - 1)];

  function pickType(t: WizardType) {
    setTypeId(t.id);
    setPaymentChoice(t.allowedChoices[0]);
    // Preselect artist if one was passed in the URL and offers this type.
    const pre = preselectedArtistSlug
      ? t.artists.find((a) => a.slug === preselectedArtistSlug)
      : null;
    setArtistId(pre ? pre.id : null);
    setStartIso(null);
    setStepIndex(1);
  }

  const canAdvance = (): boolean => {
    switch (currentStep) {
      case "type":
        return !!typeId;
      case "artist":
        return !!artistId;
      case "time":
        return !!startIso;
      case "contact":
        return (
          customer.name.trim().length >= 2 &&
          /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email.trim())
        );
      case "intake":
        return true; // optional
      case "review":
        return true;
      default:
        return false;
    }
  };

  const amountCents =
    selectedType && paymentChoice === "DEPOSIT"
      ? selectedType.depositCents
      : selectedType?.priceCents ?? 0;

  async function submit() {
    if (!selectedType || !selectedArtist || !startIso) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentTypeId: selectedType.id,
          artistId: selectedArtist.id,
          startTime: startIso,
          paymentChoice,
          customer: {
            name: customer.name.trim(),
            email: customer.email.trim(),
            phone: customer.phone.trim(),
          },
          intake: selectedType.requiresIntake
            ? {
                placement: intake.placement,
                approxSize: intake.approxSize,
                style: intake.style,
                budget: intake.budget,
                notes: intake.notes,
                isColor: intake.isColor,
                isCoverUp: intake.isCoverUp,
                referenceImages: references,
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      // Redirect to Stripe Checkout, or to the confirmation page in demo mode.
      window.location.href = data.checkoutUrl || data.confirmationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* ── Main column ─────────────────────────────────────── */}
      {/* min-w-0 lets the inner date strip's overflow-x-auto engage instead of
          stretching the grid track and pushing the summary column off-screen. */}
      <div className="min-w-0">
        {/* Stepper */}
        <ol className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-2">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <button
                type="button"
                disabled={i > stepIndex}
                onClick={() => i < stepIndex && setStepIndex(i)}
                className={clsx(
                  "flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest transition-colors",
                  i === stepIndex
                    ? "text-vermilion"
                    : i < stepIndex
                      ? "text-bone hover:text-vermilion"
                      : "text-bone-muted/50"
                )}
              >
                <span
                  className={clsx(
                    "flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                    i === stepIndex
                      ? "border-vermilion"
                      : i < stepIndex
                        ? "border-bone bg-bone text-ink"
                        : "border-ink-line"
                  )}
                >
                  {i < stepIndex ? "✓" : i + 1}
                </span>
                <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
              </button>
              {i < steps.length - 1 && (
                <span className="h-px w-4 bg-ink-line" aria-hidden />
              )}
            </li>
          ))}
        </ol>

        <div className="card p-6 md:p-8">
          {currentStep === "type" && (
            <StepType types={types} selectedId={typeId} onPick={pickType} />
          )}

          {currentStep === "artist" && selectedType && (
            <StepArtist
              artists={selectedType.artists}
              selectedId={artistId}
              onPick={setArtistId}
            />
          )}

          {currentStep === "time" && selectedType && selectedArtist && (
            <div>
              <StepHeading
                title={`Pick a time with ${selectedArtist.name.split(" ")[0]}`}
                sub={`${formatDuration(selectedType.durationMinutes)} session · available times shown in the studio's local time.`}
              />
              <div className="mt-6">
                <SlotPicker
                  artistId={selectedArtist.id}
                  appointmentTypeId={selectedType.id}
                  selected={startIso}
                  onSelect={setStartIso}
                />
              </div>
            </div>
          )}

          {currentStep === "contact" && (
            <StepContact customer={customer} setCustomer={setCustomer} />
          )}

          {currentStep === "intake" && (
            <StepIntake
              intake={intake}
              setIntake={setIntake}
              references={references}
              setReferences={setReferences}
            />
          )}

          {currentStep === "review" && selectedType && selectedArtist && startIso && (
            <StepReview
              type={selectedType}
              artist={selectedArtist}
              startIso={startIso}
              customer={customer}
              paymentChoice={paymentChoice}
              setPaymentChoice={setPaymentChoice}
              amountCents={amountCents}
            />
          )}

          {error && (
            <p className="mt-6 rounded-lg border border-vermilion/40 bg-vermilion/10 px-4 py-3 text-sm text-vermilion-soft">
              {error}
            </p>
          )}

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0 || submitting}
              className="btn-ghost disabled:opacity-30"
            >
              ← Back
            </button>

            {currentStep === "review" ? (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="btn-primary"
              >
                {submitting
                  ? "Starting checkout…"
                  : amountCents > 0
                    ? `Pay ${formatMoney(amountCents)} →`
                    : "Confirm booking →"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => canAdvance() && setStepIndex((i) => i + 1)}
                disabled={!canAdvance()}
                className="btn-primary disabled:opacity-40"
              >
                Continue →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Summary rail ────────────────────────────────────── */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card overflow-hidden">
          <div className="border-b border-ink-line bg-ink-raised px-6 py-4">
            <div className="kicker">Your booking</div>
          </div>
          <dl className="space-y-4 p-6 text-sm">
            <SummaryRow label="Service" value={selectedType?.name} />
            <SummaryRow label="Artist" value={selectedArtist?.name} />
            <SummaryRow
              label="When"
              value={
                startIso ? `${formatDate(startIso)} · ${formatTime(startIso)}` : undefined
              }
            />
            {selectedType && (
              <>
                <div className="hairline pt-4" />
                <div className="flex items-center justify-between">
                  <dt className="text-bone-muted">Due now</dt>
                  <dd className="font-display text-2xl text-vermilion">
                    {amountCents > 0 ? formatMoney(amountCents) : "—"}
                  </dd>
                </div>
                {paymentChoice === "DEPOSIT" && selectedType.priceCents > 0 && (
                  <p className="text-[11px] leading-relaxed text-bone-muted">
                    Deposit shown. Remaining balance of{" "}
                    {formatMoney(selectedType.priceCents - selectedType.depositCents)}{" "}
                    is settled at your session.
                  </p>
                )}
              </>
            )}
          </dl>
        </div>
        <p className="mt-4 px-2 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
          🔒 Payments handled securely by Stripe
        </p>
      </aside>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StepHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
      {sub && <p className="mt-2 text-sm text-bone-muted">{sub}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
        {label}
      </dt>
      <dd className={clsx("mt-0.5", value ? "text-bone" : "text-bone-muted/50")}>
        {value || "—"}
      </dd>
    </div>
  );
}

function StepType({
  types,
  selectedId,
  onPick,
}: {
  types: WizardType[];
  selectedId: string | null;
  onPick: (t: WizardType) => void;
}) {
  return (
    <div>
      <StepHeading title="What are you booking?" sub="Choose the type of appointment." />
      <div className="mt-6 space-y-3">
        {types.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onPick(t)}
            className={clsx(
              "flex w-full items-start justify-between gap-4 rounded-xl border p-5 text-left transition-colors",
              selectedId === t.id
                ? "border-vermilion bg-vermilion/5"
                : "border-ink-line hover:border-bone-muted/50"
            )}
          >
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="font-display text-lg">{t.name}</span>
              </div>
              <p className="mt-1.5 text-sm text-bone-muted">{t.description}</p>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
                {formatDuration(t.durationMinutes)}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-display text-xl text-vermilion">
                {t.priceCents > 0 ? formatMoney(t.priceCents) : "Quote"}
              </div>
              {t.depositCents > 0 && (
                <div className="font-mono text-[9px] uppercase tracking-widest text-bone-muted">
                  {formatMoney(t.depositCents)} deposit
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepArtist({
  artists,
  selectedId,
  onPick,
}: {
  artists: WizardArtist[];
  selectedId: string | null;
  onPick: (id: string) => void;
}) {
  if (artists.length === 0) {
    return (
      <div>
        <StepHeading title="Choose your artist" />
        <p className="mt-6 rounded-lg border border-ink-line bg-ink px-4 py-6 text-center text-sm text-bone-muted">
          No artists are currently taking this appointment type. Try another
          service or reach out via the contact page.
        </p>
      </div>
    );
  }
  return (
    <div>
      <StepHeading title="Choose your artist" sub="Each artist keeps their own calendar." />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {artists.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onPick(a.id)}
            className={clsx(
              "flex items-center gap-4 rounded-xl border p-4 text-left transition-colors",
              selectedId === a.id
                ? "border-vermilion bg-vermilion/5"
                : "border-ink-line hover:border-bone-muted/50"
            )}
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-ink-raised">
              {a.avatarUrl && (
                <Image src={a.avatarUrl} alt={a.name} fill className="object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-lg">{a.name}</div>
              <div className="truncate font-mono text-[10px] uppercase tracking-widest text-vermilion">
                {a.styles.slice(0, 2).join(" · ")}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepContact({
  customer,
  setCustomer,
}: {
  customer: { name: string; email: string; phone: string };
  setCustomer: (c: { name: string; email: string; phone: string }) => void;
}) {
  return (
    <div>
      <StepHeading title="Your details" sub="So we can confirm and reach you about your appointment." />
      <div className="mt-6 space-y-5">
        <div>
          <label className="field-label">Full name *</label>
          <input
            className="field"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            placeholder="Your name"
            autoComplete="name"
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label">Email *</label>
            <input
              className="field"
              type="email"
              value={customer.email}
              onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              placeholder="you@email.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input
              className="field"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              placeholder="(555) 000-0000"
              autoComplete="tel"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepIntake({
  intake,
  setIntake,
  references,
  setReferences,
}: {
  intake: {
    placement: string;
    approxSize: string;
    style: string;
    budget: string;
    notes: string;
    isColor: boolean;
    isCoverUp: boolean;
  };
  setIntake: (v: typeof intake) => void;
  references: ReferenceImage[];
  setReferences: (r: ReferenceImage[]) => void;
}) {
  return (
    <div>
      <StepHeading
        title="Tell us about your idea"
        sub="All optional — but the more you share, the better prepared your artist will be."
      />
      <div className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label">Placement</label>
            <input
              className="field"
              value={intake.placement}
              onChange={(e) => setIntake({ ...intake, placement: e.target.value })}
              placeholder="e.g. left forearm"
            />
          </div>
          <div>
            <label className="field-label">Approx. size</label>
            <input
              className="field"
              value={intake.approxSize}
              onChange={(e) => setIntake({ ...intake, approxSize: e.target.value })}
              placeholder="e.g. 4 inches / palm-sized"
            />
          </div>
          <div>
            <label className="field-label">Style</label>
            <input
              className="field"
              value={intake.style}
              onChange={(e) => setIntake({ ...intake, style: e.target.value })}
              placeholder="e.g. fine line, blackwork"
            />
          </div>
          <div>
            <label className="field-label">Budget</label>
            <input
              className="field"
              value={intake.budget}
              onChange={(e) => setIntake({ ...intake, budget: e.target.value })}
              placeholder="e.g. $300–500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Toggle
            label="Color"
            checked={intake.isColor}
            onChange={(v) => setIntake({ ...intake, isColor: v })}
          />
          <Toggle
            label="Cover-up / rework"
            checked={intake.isCoverUp}
            onChange={(v) => setIntake({ ...intake, isCoverUp: v })}
          />
        </div>

        <div>
          <label className="field-label">Notes</label>
          <textarea
            className="field resize-none"
            rows={4}
            value={intake.notes}
            onChange={(e) => setIntake({ ...intake, notes: e.target.value })}
            placeholder="Describe the idea, meaning, references, anything we should know…"
          />
        </div>

        <div>
          <label className="field-label">Reference images</label>
          <ReferenceUploader images={references} onChange={setReferences} />
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={clsx(
        "rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors",
        checked
          ? "border-vermilion bg-vermilion text-ink"
          : "border-ink-line text-bone-muted hover:border-bone-muted"
      )}
    >
      {checked ? "✓ " : ""}
      {label}
    </button>
  );
}

function StepReview({
  type,
  artist,
  startIso,
  customer,
  paymentChoice,
  setPaymentChoice,
  amountCents,
}: {
  type: WizardType;
  artist: WizardArtist;
  startIso: string;
  customer: { name: string; email: string; phone: string };
  paymentChoice: PaymentChoice;
  setPaymentChoice: (c: PaymentChoice) => void;
  amountCents: number;
}) {
  return (
    <div>
      <StepHeading title="Review & pay" sub="Confirm the details, then hold your chair." />

      <dl className="mt-6 space-y-3 rounded-xl border border-ink-line bg-ink p-5 text-sm">
        {[
          ["Service", type.name],
          ["Artist", artist.name],
          ["When", `${formatDate(startIso)} · ${formatTime(startIso)}`],
          ["Duration", formatDuration(type.durationMinutes)],
          ["Name", customer.name],
          ["Email", customer.email],
          ...(customer.phone ? [["Phone", customer.phone]] : []),
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-bone-muted">{label}</dt>
            <dd className="text-right text-bone">{value}</dd>
          </div>
        ))}
      </dl>

      {/* Payment choice (only when the type allows both) */}
      {type.allowedChoices.length > 1 && (
        <div className="mt-6">
          <div className="field-label">Payment</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <PayOption
              active={paymentChoice === "DEPOSIT"}
              onClick={() => setPaymentChoice("DEPOSIT")}
              title="Pay deposit"
              amount={formatMoney(type.depositCents)}
              note={`Balance ${formatMoney(type.priceCents - type.depositCents)} at session`}
            />
            <PayOption
              active={paymentChoice === "FULL"}
              onClick={() => setPaymentChoice("FULL")}
              title="Pay in full"
              amount={formatMoney(type.priceCents)}
              note="Nothing due at your session"
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between rounded-xl border border-vermilion/30 bg-vermilion/5 px-5 py-4">
        <span className="font-mono text-[11px] uppercase tracking-widest text-bone-muted">
          Total due now
        </span>
        <span className="font-display text-3xl text-vermilion">
          {amountCents > 0 ? formatMoney(amountCents) : "—"}
        </span>
      </div>
    </div>
  );
}

function PayOption({
  active,
  onClick,
  title,
  amount,
  note,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  amount: string;
  note: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-xl border p-4 text-left transition-colors",
        active ? "border-vermilion bg-vermilion/5" : "border-ink-line hover:border-bone-muted/50"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-lg">{title}</span>
        <span className="font-display text-lg text-vermilion">{amount}</span>
      </div>
      <p className="mt-1 text-[11px] text-bone-muted">{note}</p>
    </button>
  );
}
