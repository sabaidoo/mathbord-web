import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminCommunicationsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/login");

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">Communications</h1>
      <p className="text-sm text-gray-500 mb-8">Messaging and notifications centre.</p>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-4xl mb-4">💬</p>
        <p className="text-lg font-semibold text-navy mb-2">Coming Soon</p>
        <p className="text-sm text-gray-400">
          Bulk messaging, email templates, and notification management will be available here.
        </p>
      </div>
    </div>
  );
}
