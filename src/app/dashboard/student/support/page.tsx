import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function StudentSupportPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "student") redirect("/login");

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
          <h2 className="text-sm font-bold text-navy mb-4">Student Resources</h2>
          <p className="text-sm text-gray-400">
            Study tips, platform help, and guides for using the virtual classroom will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}
