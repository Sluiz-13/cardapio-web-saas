import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import GarcomHeader from "./_components/garcom-header";

export default async function GarcomLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) redirect("/garcom/login");

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { name: true, active: true, plan: true },
  });

  if (!restaurant?.active) redirect("/garcom/login?desativado=1");

  return (
    <div className="min-h-screen bg-surface-bg">
      <GarcomHeader restaurantName={restaurant.name} userName={session.user.name} />
      <main>{children}</main>
    </div>
  );
}