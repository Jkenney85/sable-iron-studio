import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { updateAppointmentType } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

const POLICIES = [
  { value: "DEPOSIT_REQUIRED", label: "Deposit required" },
  { value: "FULL_REQUIRED", label: "Full payment required" },
  { value: "CUSTOMER_CHOICE", label: "Customer chooses deposit or full" },
];

export default async function AppointmentTypesPage() {
  const types = await prisma.appointmentType.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Services"
        subtitle="Appointment types, pricing and deposit / payment rules."
      />

      {types.length === 0 ? (
        <EmptyState title="No services yet" hint="Seed demo data to get started" />
      ) : (
        <div className="space-y-4">
          {types.map((t) => (
            <form
              key={t.id}
              action={updateAppointmentType}
              className="card space-y-5 p-6"
            >
              <input type="hidden" name="id" value={t.id} />
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                <input
                  name="name"
                  defaultValue={t.name}
                  className="field !py-2 font-display text-lg"
                />
              </div>

              <div>
                <label className="field-label">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={t.description}
                  className="field resize-none text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="field-label">Duration (min)</label>
                  <input
                    type="number"
                    name="duration"
                    min={15}
                    step={15}
                    defaultValue={t.durationMinutes}
                    className="field"
                  />
                </div>
                <div>
                  <label className="field-label">Full price ($)</label>
                  <input
                    type="number"
                    name="price"
                    min={0}
                    step="0.01"
                    defaultValue={(t.priceCents / 100).toFixed(2)}
                    className="field"
                  />
                </div>
                <div>
                  <label className="field-label">Deposit ($)</label>
                  <input
                    type="number"
                    name="deposit"
                    min={0}
                    step="0.01"
                    defaultValue={(t.depositCents / 100).toFixed(2)}
                    className="field"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Payment rule</label>
                <select
                  name="paymentPolicy"
                  defaultValue={t.paymentPolicy}
                  className="field"
                >
                  {POLICIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm text-bone-muted">
                    <input
                      type="checkbox"
                      name="requiresIntake"
                      defaultChecked={t.requiresIntake}
                      className="accent-vermilion"
                    />
                    Collect tattoo intake
                  </label>
                  <label className="flex items-center gap-2 text-sm text-bone-muted">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={t.active}
                      className="accent-vermilion"
                    />
                    Bookable
                  </label>
                </div>
                <button type="submit" className="btn-primary">
                  Save
                </button>
              </div>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
