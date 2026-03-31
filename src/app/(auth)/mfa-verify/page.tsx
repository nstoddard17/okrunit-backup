import { Suspense } from "react";
import { MfaVerifyForm } from "./mfa-verify-form";

export const metadata = {
  title: "Two-Factor Authentication",
};

export default function MfaVerifyPage() {
  return (
    <Suspense>
      <MfaVerifyForm />
    </Suspense>
  );
}
