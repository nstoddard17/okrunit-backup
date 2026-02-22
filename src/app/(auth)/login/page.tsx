import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Log In - Gatekeeper",
  description: "Sign in to your Gatekeeper account.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
