import PageHeader from "@/components/PageHeader";
import SettingsForm from "@/components/SettingsForm";
import { requirePageUser } from "@/lib/auth";
import { getOverdueThresholdDays } from "@/lib/overdue";

export const metadata = { title: "Settings | Society Maintenance Tracker" };

export default async function AdminSettingsPage() {
  await requirePageUser("ADMIN");
  return (
    <>
      <PageHeader title="Settings" description="Configure how the tracker treats ageing complaints." />
      <SettingsForm initialDays={await getOverdueThresholdDays()} />
    </>
  );
}
