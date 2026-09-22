import { AdminTable } from "@/components/admin/AdminTable";
import { PhotoOrderStatusControl } from "@/components/admin/PhotoOrderStatusControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { listPhotoOrders } from "@/lib/services/photo-order-service";
import { formatZonedHungarianDate, formatZonedTime } from "@/lib/utils/time";

function formatOrderItems(items: Awaited<ReturnType<typeof listPhotoOrders>>[number]["items"]) {
  return (
    <ul className="space-y-1 text-xs text-foreground/70">
      {items.map((item) => (
        <li key={item.id}>{item.photoTitle} · {item.size} · {item.quantity} db</li>
      ))}
    </ul>
  );
}

export default async function AdminPhotoOrdersPage() {
  const orders = await listPhotoOrders();

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Fotórendelések</h1>
      <p className="mt-1 text-sm text-foreground/60">Összesen {orders.length} rendelés.</p>

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
              { key: "items", header: "Tételek", render: (row) => formatOrderItems(row.items) },
              { key: "notes", header: "Megjegyzés", render: (row) => row.order.notes ?? "-" },
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
                <div className="mt-4 border-t border-border pt-3">{formatOrderItems(row.items)}</div>
                {row.order.notes ? <p className="mt-3 text-sm text-foreground/70">Megjegyzés: {row.order.notes}</p> : null}
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}