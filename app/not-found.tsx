import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-medium text-muted">404</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">We could not find that page</h1>
        <p className="mt-2 text-sm text-muted">
          The page may have been removed, or you may not have access to it.
        </p>
        <Link href="/" className="btn-primary mt-6">
          Go back home
        </Link>
      </div>
    </div>
  );
}
