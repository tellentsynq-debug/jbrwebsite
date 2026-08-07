import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register Employee",
};

export default function EmployeeRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}