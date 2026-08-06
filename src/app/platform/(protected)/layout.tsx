import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/platform-session";
import PlatformNav from "./_components/platform-nav";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await getPlatformSession();
  if (!session) redirect("/platform/login");

  return (
    <div className="min-h-screen flex flex-col sm:flex-row bg-surface-bg">
      <PlatformNav userName={session.user.name} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}