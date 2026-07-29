import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import AdminNav from "./_components/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) redirect("/admin/login");

  const restaurant = await db.restaurant.findUnique({
    where: { id: session.user.restaurantId },
  });

  return (
    <div className="min-h-screen bg-paper">
      <AdminNav restaurantName={restaurant?.name ?? ""} userName={session.user.name} />
      <main>{children}</main>
    </div>
  );
}