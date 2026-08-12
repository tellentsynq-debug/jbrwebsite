import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Warehouse",
};

export default function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
