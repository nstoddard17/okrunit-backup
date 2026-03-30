import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Log In - OKrunit",
  description: "Sign in to your OKrunit account.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
