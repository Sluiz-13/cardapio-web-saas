import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getNextDueDate, getDaysUntilDue } from "@/lib/billing";
import AdminNav from "./_components/admin-nav";
import { PlanDueBanner } from "./_components/plan-due-banner";
import { WhatsAppFab } from "@/components/ui/WhatsAppFab";
import AutoPrintWatcher from "./_components/auto-print-watcher";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) redirect("/admin/login");
  if (session.user.role === "STAFF") redirect("/garcom");

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
  });

  if (!restaurant?.active) redirect("/admin/login?desativado=1");

  const dueDate = getNextDueDate(restaurant.lastPaymentConfirmedAt, restaurant.createdAt);
  const daysUntilDue = getDaysUntilDue(dueDate);

  return (
    <div className="min-h-screen flex flex-col sm:flex-row bg-surface-bg">
      <AdminNav
        restaurantName={restaurant?.name ?? ""}
        userName={session.user.name}
        logoUrl={restaurant?.logoUrl}
        role={session.user.role ?? "OWNER"}
      />
      <AutoPrintWatcher
        printMethod={restaurant?.printMethod ?? "MANUAL"}
        printerIp={restaurant?.printerIp}
        printerPort={restaurant?.printerPort}
        printerBluetoothAddress={restaurant?.printerBluetoothAddress}
        printerQzName={restaurant?.printerQzName}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <PlanDueBanner daysUntilDue={daysUntilDue} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <WhatsAppFab message={`Olá! Sou do restaurante ${restaurant?.name ?? ""} e preciso de suporte com o MenuAir. Podem me ajudar?`} />
    </div>
  );
}