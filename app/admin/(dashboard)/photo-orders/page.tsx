import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { PhotoOrderDetailsDialog } from "@/components/admin/PhotoOrderDetailsDialog";
import { PhotoOrderStatusControl } from "@/components/admin/PhotoOrderStatusControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/photo-order-catalog";
import { listPhotoOrders } from "@/lib/services/photo-order-service";
import { listServices } from "@/lib/services/service-service";
import { formatZonedHungarianDate, formatZonedTime } from "@/lib/utils/time";
import type { PhotoOrder } from "@/db/schema";

const STATUS_OPTIONS: { value: PhotoOrder["status"] | ""; label: string }[] = [
  { value: "", label: "Összes státusz" },
  { value: "NEW", label: "Új" },
  { value: "PROCESSING", label: "Feldolgozás alatt" },
  { value: "COMPLETED", label: "Teljesítve" },
  { value: "CANCELLED", label: "Törölve" },
];

function renderOrderDetails(row: Awaited<ReturnType<typeof listPhotoOrders>>[number]) {
  return (
    <PhotoOrderDetailsDialog
      order={row.order}
      customerName={row.booking.customerName}
      bookingNumber={row.booking.bookingNumber}
      items={row.items}
    />
  );
}

interface AdminPhotoOrdersPageProps {
  searchParams: Promise<{
    status?: string;
    serviceId?: string;
  }>;
}

export default async function AdminPhotoOrdersPage({ searchParams }: AdminPhotoOrdersPageProps) {
  const params = await searchParams;
  const status = (params.status || undefined) as PhotoOrder["status"] | undefined;
  const serviceId = params.serviceId || undefined;

  const [orders, services] = await Promise.all([
    listPhotoOrders({ status, serviceId }),
    listServices(),
  ]);

  const totalRevenue = orders.reduce(
    (sum, o) => sum + (o.order.totalAmount > 0 ? o.order.totalAmount : o.items.reduce((s, i) => s + i.totalPrice, 0)),
    0,
  );

  const exportParams = new URLSearchParams();
  if (status) exportParams.set("status", status);
  if (serviceId) exportParams.set("serviceId", serviceId);
  const exportUrl = `/api/admin/photo-orders/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  const hasActiveFilters = Boolean(status || serviceId);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-foreground">Fotórendelések</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Összesen {orders.length} rendelés a kiválasztott szűrés szerint · Összbevétel:{" "}
            <strong className="text-foreground">{formatPrice(totalRevenue)}</strong>
          </p>
        </div>
        <a
          href={exportUrl}
          download
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exportálás Excelbe (CSV)
        </a>
      </div>

      {/* Filter bar */}
      <form className="mt-6 rounded-xl border border-border bg-white p-4 shadow-sm" method="get">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="filter-service" className="block text-xs font-medium text-foreground/70 mb-1">
              Szolgáltatás / Esemény
            </label>
            <select
              id="filter-service"
              name="serviceId"
              defaultValue={serviceId ?? ""}
              className="min-h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-accent"
            >
              <option value="">Összes szolgáltatás</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-status" className="block text-xs font-medium text-foreground/70 mb-1">
              Rendelés státusza
            </label>
            <select
              id="filter-status"
              name="status"
              defaultValue={status ?? ""}
              className="min-h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-accent"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="min-h-10 flex-1 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-accent-dark transition-colors"
            >
              Szűrés
            </button>
            {hasActiveFilters && (
              <Link
                href="/admin/photo-orders"
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-white px-3 py-2 text-xs font-medium text-foreground/70 hover:bg-muted"
              >
                Törlés
              </Link>
            )}
          </div>
        </div>
      </form>

      <div className="mt-6">
        {orders.length === 0 ? (
          <EmptyState title="Nem található a szűrésnek megfelelő fotórendelés." />
        ) : (
          <AdminTable
            rows={orders}
            rowKey={(row) => row.order.id}
            columns={[
              { key: "number", header: "Rendelés", render: (row) => <span className="font-mono font-medium">{row.order.orderNumber}</span> },
              { key: "booking", header: "Foglalás", render: (row) => <span className="font-mono">{row.booking.bookingNumber}</span> },
              { key: "customer", header: "Ügyfél", render: (row) => <span>{row.booking.customerName}<br /><span className="text-xs text-foreground/55">{row.booking.customerEmail}</span></span> },
              { key: "service", header: "Szolgáltatás", render: (row) => row.service.name },
              { key: "items", header: "Tételek & Összeg", render: renderOrderDetails },
              { key: "created", header: "Érkezett", render: (row) => `${formatZonedHungarianDate(row.order.createdAt)} ${formatZonedTime(row.order.createdAt)}` },
              { key: "status", header: "Állapot", render: (row) => <PhotoOrderStatusControl order={row.order} /> },
            ]}
            mobileCard={(row) => (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono font-medium">{row.order.orderNumber}</p>
                    <p className="mt-1 text-sm text-foreground/70">{row.booking.customerName}</p>
                    <p className="text-xs text-foreground/50">{row.booking.bookingNumber} · {row.service.name}</p>
                  </div>
                  <PhotoOrderStatusControl order={row.order} />
                </div>
                <div className="mt-4 border-t border-border pt-3">{renderOrderDetails(row)}</div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}