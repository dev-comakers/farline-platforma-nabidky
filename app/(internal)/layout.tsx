import { cookies } from "next/headers";
import { Sidebar } from "@/components/Sidebar";
import { MobileLayout } from "@/components/MobileLayout";
import { ToastProvider } from "@/components/Toast";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = token ? await verifyToken(token) : null;

  const [user, newCommentsCount] = await Promise.all([
    payload
      ? prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, name: true, email: true, role: true },
        })
      : null,
    prisma.comment.count({ where: { isNew: true } }),
  ]);

  return (
    <ToastProvider>
      <MobileLayout sidebar={<Sidebar user={user} newCommentsCount={newCommentsCount} />}>
        {children}
      </MobileLayout>
    </ToastProvider>
  );
}
