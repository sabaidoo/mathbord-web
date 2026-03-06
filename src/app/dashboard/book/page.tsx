import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function BookPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div>
      <h1 className="font-display text-3xl text-navy mb-1">Book a Session</h1>
      <p className="text-sm text-gray-500 mb-8">
        Use the calendar in your dashboard to schedule lessons. This page will eventually
        contain a full booking form.
      </p>
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
        <p className="text-lg">For now, please navigate to your Schedule page and use the &quot;Book&quot; option there.</p>
      </div>
    </div>
  );
}
