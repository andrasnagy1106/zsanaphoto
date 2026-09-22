"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAdminUserAction,
  deleteAdminUserAction,
} from "@/app/actions/admin-settings-actions";
import type { SafeAdminUser } from "@/lib/services/admin-user-service";
import { formatZonedHungarianDate, formatZonedTime } from "@/lib/utils/time";

interface AdminUserManagerProps {
  adminUsers: SafeAdminUser[];
  currentAdminId: string;
}

export function AdminUserManager({ adminUsers, currentAdminId }: AdminUserManagerProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameInputId = useId();
  const emailInputId = useId();
  const passwordInputId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isCreating, startCreateTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  function openModal() {
    setError(null);
    setName("");
    setEmail("");
    setPassword("");
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startCreateTransition(async () => {
      const result = await createAdminUserAction({ name, email, password });
      if (result.success) {
        closeModal();
        setSuccess(`Az új adminisztrátor (${name}) sikeresen hozzáadva.`);
        router.refresh();
      } else {
        setError(result.error ?? "A létrehozás nem sikerült.");
      }
    });
  }

  function handleDelete(user: SafeAdminUser) {
    if (user.id === currentAdminId) {
      alert("A saját fiókodat nem törölheted.");
      return;
    }

    if (
      !window.confirm(
        `Biztosan törölni szeretnéd a(z) "${user.name}" (${user.email}) adminisztrátort?`,
      )
    ) {
      return;
    }

    setSuccess(null);
    startDeleteTransition(async () => {
      const result = await deleteAdminUserAction(user.id);
      if (result.success) {
        setSuccess(`A(z) "${user.name}" adminisztrátor sikeresen törölve.`);
        router.refresh();
      } else {
        alert(result.error ?? "A törlés sikertelen.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Adminisztrátorok kezelése</h2>
          <p className="mt-0.5 text-xs text-foreground/60">
            A rendszergazdai fiókok, akik hozzáférnek az adminisztrációs felülethez.
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          + Új admin hozzáadása
        </button>
      </div>

      {success && (
        <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-medium text-emerald-800">
          {success}
        </div>
      )}

      {/* Admin Users Table / List */}
      <div className="mt-4 divide-y divide-border border-t border-border">
        {adminUsers.map((user) => {
          const isCurrent = user.id === currentAdminId;
          return (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{user.name}</span>
                  {isCurrent && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                      Te (Jelenlegi fiók)
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground/60 mt-0.5">{user.email}</p>
                <p className="text-[11px] text-foreground/40 mt-0.5">
                  Létrehozva: {formatZonedHungarianDate(user.createdAt)} {formatZonedTime(user.createdAt)}
                </p>
              </div>

              {!isCurrent && (
                <button
                  type="button"
                  onClick={() => handleDelete(user)}
                  disabled={isDeleting}
                  className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
                >
                  Törlés
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Admin Modal */}
      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/55"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal();
        }}
      >
        <div className="p-5 sm:p-7 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-accent">Felhasználókezelés</p>
              <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl text-foreground">
                Új adminisztrátor
              </h2>
              <p className="mt-1 text-xs text-foreground/60">
                Hozz létre egy új fiókot az admin felülethez való belépéshez.
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-xl text-foreground/60 hover:bg-muted hover:text-foreground"
              aria-label="Ablak bezárása"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleCreate} className="mt-5 space-y-4">
            <div>
              <label htmlFor={nameInputId} className="block text-xs font-semibold text-foreground">
                Név *
              </label>
              <input
                id={nameInputId}
                type="text"
                required
                placeholder="pl. Kovács Katalin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label htmlFor={emailInputId} className="block text-xs font-semibold text-foreground">
                E-mail cím *
              </label>
              <input
                id={emailInputId}
                type="email"
                required
                placeholder="pl. katalin@zsanaphoto.hu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label htmlFor={passwordInputId} className="block text-xs font-semibold text-foreground">
                Jelszó * (min. 8 karakter)
              </label>
              <input
                id={passwordInputId}
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>

            {error && <p className="text-xs font-medium text-red-600">{error}</p>}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={closeModal}
                className="min-h-10 rounded-md border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Mégse
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="min-h-10 rounded-md bg-accent px-5 py-2 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-50 shadow-sm"
              >
                {isCreating ? "Mentés..." : "Admin létrehozása"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}
