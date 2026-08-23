export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-ink text-sm font-semibold text-white">
            SM
          </span>
          <h1 className="text-lg font-semibold tracking-tight">Society Maintenance Tracker</h1>
          <p className="mt-1 text-sm text-muted">
            Raise complaints, follow their progress, and stay up to date with society notices.
          </p>
        </div>
        <div className="card p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
