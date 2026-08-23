import NoticeBoard from "@/components/NoticeBoard";
import { NoticeActions, NoticeComposer } from "@/components/NoticeManager";
import PageHeader, { EmptyState } from "@/components/PageHeader";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Manage Notices | Society Maintenance Tracker" };

export default async function AdminNoticesPage() {
  await requirePageUser("ADMIN");

  const notices = await prisma.notice.findMany({
    orderBy: [{ isImportant: "desc" }, { createdAt: "desc" }],
    include: { postedBy: { select: { name: true } } },
  });

  return (
    <>
      <PageHeader
        title="Notice board"
        description="Post announcements for the society. Important notices are pinned and emailed to all residents."
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <NoticeComposer />

        <div>
          {notices.length === 0 ? (
            <EmptyState title="No notices posted yet" hint="Your first notice will appear here." />
          ) : (
            <NoticeBoard
              notices={notices}
              renderActions={(notice) => <NoticeActions id={notice.id} isImportant={notice.isImportant} />}
            />
          )}
        </div>
      </div>
    </>
  );
}
