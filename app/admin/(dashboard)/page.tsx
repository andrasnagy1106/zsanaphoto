import Link from "next/link";
import { getDashboardStats } from "@/lib/services/booking-service";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    { label: "Mai foglalások", value: stats.todayCount, href: "/admin/bookings" },
    { label: "Függőben", value: stats.pendingCount, href: "/admin/bookings?status=PENDING" },
    { label: "Megerősítve", value: stats.confirmedCount, href: "/admin/bookings?status=CONFIRMED" },
    { label: "Következő 7 nap", value: stats.next7Count, href: "/admin/bookings" },
    { label: "Lemondva", value: stats.cancelledCount, href: "/admin/bookings?status=CANCELLED" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Áttekintés</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-border bg-white p-6 transition-colors hover:border-accent"
          >
            <p className="text-sm text-foreground/60">{card.label}</p>
            <p className="mt-2 font-display text-3xl text-foreground">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
