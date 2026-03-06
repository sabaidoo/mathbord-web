import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { initials } from "@/lib/utils";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { name, role } = session.user;
  const userInitials = initials(name ?? "");

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} userName={name ?? ""} />
      <div className="flex-1 ml-[250px] flex flex-col">
        <Header
          userName={name ?? ""}
          role={role}
          avatarInitials={userInitials}
        />
        <main className="flex-1 p-8 bg-surface">{children}</main>
      </div>
    </div>
  );
}
