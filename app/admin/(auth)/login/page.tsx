import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/guard";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin bejelentkezés",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect("/admin");
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-white p-8 shadow-sm">
      <p className="font-display text-2xl text-foreground">Zsana Photo Admin</p>
      <p className="mt-1 text-sm text-foreground/60">Jelentkezz be a kezelőfelület eléréséhez.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
