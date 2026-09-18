import { listInquiries } from "@/lib/services/inquiry-service";
import { AdminTable } from "@/components/admin/AdminTable";
import { InquiryStatusControl } from "@/components/admin/InquiryStatusControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatZonedHungarianDate } from "@/lib/utils/time";

export default async function AdminInquiriesPage() {
  const inquiries = await listInquiries();

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Érdeklődések</h1>

      <div className="mt-6">
        {inquiries.length === 0 ? (
          <EmptyState title="Jelenleg nincs érdeklődés." />
        ) : (
          <AdminTable
            rows={inquiries}
            rowKey={(inquiry) => inquiry.id}
            columns={[
              { key: "institution", header: "Intézmény", render: (i) => i.institutionName },
              { key: "contact", header: "Kapcsolattartó", render: (i) => i.contactName },
              { key: "email", header: "E-mail", render: (i) => i.email },
              { key: "phone", header: "Telefon", render: (i) => i.phone },
              { key: "period", header: "Időszak", render: (i) => i.preferredPeriod ?? "-" },
              { key: "created", header: "Létrehozva", render: (i) => formatZonedHungarianDate(i.createdAt) },
              { key: "status", header: "Státusz", render: (i) => <InquiryStatusControl inquiry={i} /> },
            ]}
            mobileCard={(i) => (
              <div>
                <p className="font-medium text-foreground">{i.institutionName}</p>
                <p className="text-sm text-foreground/70">{i.contactName} · {i.email} · {i.phone}</p>
                <p className="text-sm text-foreground/50">{formatZonedHungarianDate(i.createdAt)}</p>
                <div className="mt-2">
                  <InquiryStatusControl inquiry={i} />
                </div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
