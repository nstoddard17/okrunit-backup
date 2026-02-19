import { Suspense } from "react";
import { SignupForm } from "./signup-form";

export const metadata = {
  title: "Sign Up - Gatekeeper",
  description: "Create a new Gatekeeper account.",
};

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
