import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/platform-session";
import PlatformNav from "./_components/platform-nav";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await getPlatformSession();
  if (!session) redirect("/platform/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <PlatformNav userName={session.user.name} />
      <main>{children}</main>
    </div>
  );
}