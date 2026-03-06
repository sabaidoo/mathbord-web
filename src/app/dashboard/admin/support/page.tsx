import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminSupportPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/login");

  return <SupportPage role="admin" />;
}

function SupportPage(_props: { role: string }) {
  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">Support</h1>
      <p className="text-sm text-gray-500 mb-8">Help resources and contact information.</p>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-navy mb-4">Contact Us</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <span className="font-semibold text-gray-800">Email: </span>
              <a href="mailto:support@mathbord.ca" className="text-teal hover:underline">
                support@mathbord.ca
              </a>
            </p>
            <p>
              <span className="font-semibold text-gray-800">Hours: </span>
              Monday – Friday, 9 AM – 6 PM PT
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-navy mb-4">Documentation</h2>
          <p className="text-sm text-gray-400">
            Admin documentation and platform guides will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}
