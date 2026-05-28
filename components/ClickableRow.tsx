"use client";

import { useRouter } from "next/navigation";

export function ClickableRow({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <tr
      onClick={() => router.push(href)}
      className={className}
      style={{ cursor: "pointer" }}
    >
      {children}
    </tr>
  );
}
