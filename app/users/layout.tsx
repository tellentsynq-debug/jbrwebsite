import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "JBR Staffing",
    template: "%s | JBR Staffing",
  },
  description: "JBR Staffing - Connecting talent with opportunity",
};

export default function UsersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-full flex flex-col">{children}</div>;
}
