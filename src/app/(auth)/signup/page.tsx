import { Suspense } from "react";
import { SignupForm } from "./signup-form";

export const metadata = {
  title: "Sign Up - OKrunit",
  description: "Create a new OKrunit account.",
};

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
