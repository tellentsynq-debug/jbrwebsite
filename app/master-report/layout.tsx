import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Master Report",
};

export default function MasterReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}