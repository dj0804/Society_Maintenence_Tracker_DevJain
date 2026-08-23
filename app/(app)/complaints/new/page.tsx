import { redirect } from "next/navigation";
import NewComplaintForm from "@/components/NewComplaintForm";
import PageHeader from "@/components/PageHeader";
import { requirePageUser } from "@/lib/auth";

export const metadata = { title: "Raise a Complaint | Society Maintenance Tracker" };

export default async function NewComplaintPage() {
  const session = await requirePageUser();
  if (session.role === "ADMIN") redirect("/admin/complaints");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Raise a complaint"
        description="Give the admin enough detail to act on it. A photo helps a lot."
      />
      <NewComplaintForm />
    </div>
  );
}
