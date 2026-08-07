import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/platform-session";
import DashboardClient from "./_components/dashboard-client";

export default async function PlatformDashboardPage() {
  const session = await getPlatformSession();
  if (!session) redirect("/platform/login");
  return <DashboardClient />;
}