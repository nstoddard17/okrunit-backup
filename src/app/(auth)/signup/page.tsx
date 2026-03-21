import { Suspense } from "react";
import { SignupForm } from "./signup-form";

export const metadata = {
  title: "Sign Up - OKRunit",
  description: "Create a new OKRunit account.",
};

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
