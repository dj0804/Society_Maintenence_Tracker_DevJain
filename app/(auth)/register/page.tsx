import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Create account | Society Maintenance Tracker" };

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
