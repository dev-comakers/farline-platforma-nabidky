import { Sidebar } from "@/components/Sidebar";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/Toast";

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
      <ToastProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </ToastProvider>
    </StoreProvider>
  );
}
