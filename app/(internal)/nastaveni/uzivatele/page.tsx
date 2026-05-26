import { notFound } from "next/navigation";
import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { UserManager } from "@/components/UserManager";

export const metadata = { title: "Správa uživatelů" };

export default async function UzivatelePage() {
  const payload = await getAuthFromCookies();
  if (!payload || payload.role !== "admin") notFound();

  const dbUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const users = dbUsers.map((u) => ({ ...u, role: u.role as "admin" | "manager", createdAt: u.createdAt.toISOString() }));

  const currentUserId = payload.userId;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900" style={{ fontFamily: "var(--font-display)" }}>
          Správa uživatelů
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Vytvářejte a spravujte účty administrátorů a manažerů.</p>
      </div>
      <UserManager initialUsers={users} currentUserId={currentUserId} />
    </div>
  );
}
