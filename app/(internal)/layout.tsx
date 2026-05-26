import { cookies } from "next/headers";
import { Sidebar } from "@/components/Sidebar";
import { StoreProvider } from "@/lib/store";
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

  const user = payload
    ? await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, email: true, role: true },
      })
    : null;

  return (
    <StoreProvider>
      <ToastProvider>
        <div className="flex min-h-screen">
          <Sidebar user={user} newCommentsCount={0} />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </ToastProvider>
    </StoreProvider>
  );
}
