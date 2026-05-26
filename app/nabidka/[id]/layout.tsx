import { ToastProvider } from "@/components/Toast";

export default function NabidkaLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
