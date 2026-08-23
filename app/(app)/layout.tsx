import NavBar from "@/components/NavBar";
import { requirePageUser } from "@/lib/auth";

/** Shell for every signed-in page. Middleware guards routes; this renders chrome. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageUser();
  return (
    <div className="min-h-screen">
      <NavBar name={session.name} role={session.role} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
