import { ImportantBadge } from "@/components/Badges";
import { formatDateTime } from "@/lib/format";

export type NoticeItem = {
  id: string;
  title: string;
  body: string;
  isImportant: boolean;
  createdAt: Date;
  postedBy: { name: string };
};

/**
 * The notice board. Callers pass notices already ordered important-first;
 * `renderActions` lets the admin view attach controls to each notice.
 */
export default function NoticeBoard({
  notices,
  renderActions,
}: {
  notices: NoticeItem[];
  renderActions?: (notice: NoticeItem) => React.ReactNode;
}) {
  return (
    <ul className="space-y-3">
      {notices.map((notice) => (
        <li
          key={notice.id}
          className={`card p-5 ${notice.isImportant ? "border-l-4 border-l-danger bg-danger-soft/25" : ""}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              {notice.isImportant && (
                <div className="mb-2">
                  <ImportantBadge />
                </div>
              )}
              <h2 className="font-medium">{notice.title}</h2>
              <p className="mt-0.5 text-xs text-muted">
                Posted {formatDateTime(notice.createdAt)} by {notice.postedBy.name}
              </p>
            </div>
            {renderActions?.(notice)}
          </div>
          <p className="mt-3 text-sm whitespace-pre-wrap text-ink/80">{notice.body}</p>
        </li>
      ))}
    </ul>
  );
}
