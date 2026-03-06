import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminSystemPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/login");

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">System</h1>
      <p className="text-sm text-gray-500 mb-8">Platform configuration and settings.</p>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-4xl mb-4">⚙️</p>
        <p className="text-lg font-semibold text-navy mb-2">Coming Soon</p>
        <p className="text-sm text-gray-400">
          Curriculum management, rate configuration, and platform settings will be available here.
        </p>
      </div>
    </div>
  );
}
