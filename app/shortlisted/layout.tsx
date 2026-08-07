import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shortlisted",
};

export default function ShortlistedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}