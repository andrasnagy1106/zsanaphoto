import { AdminTable } from "@/components/admin/AdminTable";
import { PhotoOrderDetailsDialog } from "@/components/admin/PhotoOrderDetailsDialog";
import { PhotoOrderStatusControl } from "@/components/admin/PhotoOrderStatusControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/photo-order-catalog";
import { listPhotoOrders } from "@/lib/services/photo-order-service";
import { formatZonedHungarianDate, formatZonedTime } from "@/lib/utils/time";

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

export default async function AdminPhotoOrdersPage() {
  const orders = await listPhotoOrders();
  const totalRevenue = orders.reduce(
    (sum, o) => sum + (o.order.totalAmount > 0 ? o.order.totalAmount : o.items.reduce((s, i) => s + i.totalPrice, 0)),
    0,
  );

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Fotórendelések</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Összesen {orders.length} rendelés · Összbevétel: <strong className="text-foreground">{formatPrice(totalRevenue)}</strong>
      </p>

      <div className="mt-6">
        {orders.length === 0 ? (
          <EmptyState title="Jelenleg nincs fotórendelés." />
        ) : (
          <AdminTable
            rows={orders}
            rowKey={(row) => row.order.id}
            columns={[
              { key: "number", header: "Rendelés", render: (row) => <span className="font-mono font-medium">{row.order.orderNumber}</span> },
              { key: "booking", header: "Foglalás", render: (row) => row.booking.bookingNumber },
              { key: "customer", header: "Ügyfél", render: (row) => <span>{row.booking.customerName}<br /><span className="text-xs text-foreground/55">{row.booking.customerEmail}</span></span> },
              { key: "service", header: "Szolgáltatás", render: (row) => row.service.name },
              { key: "items", header: "Tételek", render: renderOrderDetails },
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