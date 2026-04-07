import { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/services/auth.service";
import { DeviceGate } from "@/components/shared/device-gate";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifySession();

  if (!user) {
    redirect("/login");
  }

  return (
    <DeviceGate>
      <div className="flex flex-1">
        {children}
      </div>
    </DeviceGate>
  );
}
