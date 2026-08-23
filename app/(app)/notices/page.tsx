import NoticeBoard from "@/components/NoticeBoard";
import PageHeader, { EmptyState } from "@/components/PageHeader";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Notice Board | Society Maintenance Tracker" };

export default async function NoticesPage() {
  await requirePageUser();

  // Important notices are pinned to the top of the board.
  const notices = await prisma.notice.findMany({
    orderBy: [{ isImportant: "desc" }, { createdAt: "desc" }],
    include: { postedBy: { select: { name: true } } },
  });

  return (
    <>
      <PageHeader
        title="Notice board"
        description="Announcements from the society office. Important notices stay pinned at the top."
      />
      {notices.length === 0 ? (
        <EmptyState title="No notices yet" hint="Announcements from the society office will appear here." />
      ) : (
        <NoticeBoard notices={notices} />
      )}
    </>
  );
}
