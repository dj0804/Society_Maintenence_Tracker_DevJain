import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

/** Entry point: send people wherever their role belongs. */
export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(session.role === "ADMIN" ? "/admin" : "/complaints");
}
