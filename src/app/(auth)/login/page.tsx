import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Log In - OKRunit",
  description: "Sign in to your OKRunit account.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
