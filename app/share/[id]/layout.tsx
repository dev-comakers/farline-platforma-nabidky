import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/Toast";

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
      <ToastProvider>{children}</ToastProvider>
    </StoreProvider>
  );
}
