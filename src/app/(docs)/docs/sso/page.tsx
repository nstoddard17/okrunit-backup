import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SSO / SAML Setup",
  description:
    "Configure SAML Single Sign-On for your OKRunit organization. Works with Okta, Azure AD, Google Workspace, OneLogin, and any SAML 2.0 provider.",
};

export default function SSODocsPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
        SSO / SAML Setup
      </h1>
      <p className="mt-4 text-lg text-zinc-600 leading-relaxed">
        SAML Single Sign-On lets your team members sign in to OKRunit using your
        company&apos;s identity provider (IdP). SSO is available on Business and
        Enterprise plans.
      </p>

      <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <h3 className="font-semibold text-emerald-900">Supported Providers</h3>
        <p className="mt-1 text-sm text-emerald-800">
          OKRunit works with any SAML 2.0 identity provider, including Okta,
          Azure AD (Entra ID), Google Workspace, OneLogin, JumpCloud, PingOne,
          and Auth0.
        </p>
      </div>

      {/* Quick setup */}
      <h2 className="mt-12 text-2xl font-semibold text-zinc-900">
        Quick Setup (Recommended)
      </h2>
      <p className="mt-2 text-zinc-700">
        The fastest way to configure SSO is to import your IdP&apos;s metadata
        URL. This auto-fills all the technical details for you.
      </p>

      <ol className="mt-4 space-y-4 text-zinc-700">
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
            1
          </span>
          <div>
            <strong className="text-zinc-900">Create a SAML app in your IdP.</strong>{" "}
            In your identity provider&apos;s admin console, create a new SAML 2.0
            application. You&apos;ll need to provide these values from OKRunit
            (found at the bottom of the SSO settings page):
            <div className="mt-3 space-y-2">
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                <span className="text-xs font-medium text-zinc-500">ACS URL</span>
                <p className="mt-0.5 font-mono text-sm text-zinc-800">
                  https://your-domain.com/api/auth/saml/callback
                </p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                <span className="text-xs font-medium text-zinc-500">Entity ID / Audience URI</span>
                <p className="mt-0.5 font-mono text-sm text-zinc-800">
                  https://your-domain.com/api/auth/saml/metadata
                </p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                <span className="text-xs font-medium text-zinc-500">Name ID Format</span>
                <p className="mt-0.5 font-mono text-sm text-zinc-800">
                  Email Address
                </p>
              </div>
            </div>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
            2
          </span>
          <div>
            <strong className="text-zinc-900">Copy your IdP&apos;s metadata URL.</strong>{" "}
            After creating the SAML app, your IdP will provide a metadata URL.
            This is usually found in the app&apos;s &quot;Sign On&quot; or
            &quot;SAML Settings&quot; section. It looks something like:
            <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-sm">
              <code className="text-zinc-100">https://your-idp.okta.com/app/abc123/sso/saml/metadata</code>
            </pre>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
            3
          </span>
          <div>
            <strong className="text-zinc-900">Import it in OKRunit.</strong>{" "}
            Go to <strong>Settings &rarr; SSO</strong>, paste the metadata URL
            into the &quot;Quick Setup&quot; box, and click <strong>Import</strong>.
            This auto-fills the Entity ID, SSO URL, and certificate.
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
            4
          </span>
          <div>
            <strong className="text-zinc-900">Enter your email domain.</strong>{" "}
            Type your company&apos;s email domain (e.g.{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm text-zinc-800">
              acme.com
            </code>
            ). Users with that email domain will be able to sign in with SSO.
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
            5
          </span>
          <div>
            <strong className="text-zinc-900">Enable and save.</strong>{" "}
            Toggle &quot;Enable SSO&quot; on and click <strong>Save Configuration</strong>.
            Your team can now sign in by clicking &quot;Sign in with SSO&quot; on
            the login page.
          </div>
        </li>
      </ol>

      {/* Provider-specific guides */}
      <h2 className="mt-12 text-2xl font-semibold text-zinc-900">
        Provider-Specific Guides
      </h2>

      {/* Okta */}
      <h3 className="mt-6 text-lg font-semibold text-zinc-900">Okta</h3>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-zinc-700">
        <li>In Okta Admin, go to <strong>Applications &rarr; Create App Integration</strong>.</li>
        <li>Select <strong>SAML 2.0</strong> and click Next.</li>
        <li>
          Set the <strong>Single sign-on URL</strong> to your ACS URL and the{" "}
          <strong>Audience URI</strong> to your Entity ID (shown in OKRunit&apos;s SSO settings).
        </li>
        <li>For <strong>Name ID format</strong>, select <strong>EmailAddress</strong>.</li>
        <li>Click Next, then Finish.</li>
        <li>
          On the app&apos;s <strong>Sign On</strong> tab, find the{" "}
          <strong>Metadata URL</strong> and paste it into OKRunit&apos;s Quick Setup.
        </li>
        <li>Assign users or groups to the app in Okta.</li>
      </ol>

      {/* Azure AD */}
      <h3 className="mt-6 text-lg font-semibold text-zinc-900">
        Azure AD (Microsoft Entra ID)
      </h3>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-zinc-700">
        <li>
          In the Azure portal, go to{" "}
          <strong>Microsoft Entra ID &rarr; Enterprise Applications &rarr; New Application</strong>.
        </li>
        <li>Click <strong>Create your own application</strong>, name it &quot;OKRunit&quot;, select &quot;Integrate any other application&quot;.</li>
        <li>
          Go to <strong>Single sign-on &rarr; SAML</strong>.
        </li>
        <li>
          In <strong>Basic SAML Configuration</strong>, set the <strong>Identifier (Entity ID)</strong> and{" "}
          <strong>Reply URL (ACS URL)</strong> to the values shown in OKRunit&apos;s SSO settings.
        </li>
        <li>
          Copy the <strong>App Federation Metadata Url</strong> from section 3 and paste it into
          OKRunit&apos;s Quick Setup.
        </li>
        <li>Assign users or groups to the enterprise application.</li>
      </ol>

      {/* Google Workspace */}
      <h3 className="mt-6 text-lg font-semibold text-zinc-900">Google Workspace</h3>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-zinc-700">
        <li>
          In Google Admin, go to{" "}
          <strong>Apps &rarr; Web and mobile apps &rarr; Add app &rarr; Add custom SAML app</strong>.
        </li>
        <li>Name the app &quot;OKRunit&quot; and click Continue.</li>
        <li>
          On the <strong>Google Identity Provider details</strong> page, copy the{" "}
          <strong>SSO URL</strong> and download the <strong>Certificate</strong>. You can also copy
          the <strong>Metadata URL</strong> if shown.
        </li>
        <li>
          In <strong>Service provider details</strong>, set the <strong>ACS URL</strong> and{" "}
          <strong>Entity ID</strong> to the values from OKRunit&apos;s SSO settings. Set{" "}
          <strong>Name ID format</strong> to <strong>EMAIL</strong>.
        </li>
        <li>If Google provided a metadata URL, paste it into OKRunit&apos;s Quick Setup. Otherwise, manually enter the SSO URL and paste the certificate using the &quot;Edit&quot; link.</li>
        <li>Turn the app ON for the organizational units that should have access.</li>
      </ol>

      {/* Manual setup */}
      <h2 className="mt-12 text-2xl font-semibold text-zinc-900">
        Manual Configuration
      </h2>
      <p className="mt-2 text-zinc-700">
        If your IdP doesn&apos;t provide a metadata URL, you can manually
        configure SSO by clicking the &quot;Edit&quot; link on the SSO settings
        page and entering:
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left">
              <th className="pb-2 pr-4 font-semibold text-zinc-900">Field</th>
              <th className="pb-2 pr-4 font-semibold text-zinc-900">Description</th>
            </tr>
          </thead>
          <tbody className="text-zinc-700">
            <tr className="border-b border-zinc-100">
              <td className="py-2 pr-4 font-medium">Entity ID</td>
              <td className="py-2">
                Your IdP&apos;s unique identifier (also called Issuer URL). Usually looks like a URL.
              </td>
            </tr>
            <tr className="border-b border-zinc-100">
              <td className="py-2 pr-4 font-medium">SSO URL</td>
              <td className="py-2">
                The URL where users are redirected to authenticate. This is your IdP&apos;s SAML sign-in endpoint.
              </td>
            </tr>
            <tr className="border-b border-zinc-100">
              <td className="py-2 pr-4 font-medium">X.509 Certificate</td>
              <td className="py-2">
                The public certificate your IdP uses to sign SAML assertions. Paste the full PEM-encoded certificate.
              </td>
            </tr>
            <tr className="border-b border-zinc-100">
              <td className="py-2 pr-4 font-medium">Email Domain</td>
              <td className="py-2">
                Your company&apos;s email domain (e.g. acme.com). Users with matching emails can use SSO.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Attribute mapping */}
      <h2 className="mt-12 text-2xl font-semibold text-zinc-900">
        Attribute Mapping
      </h2>
      <p className="mt-2 text-zinc-700">
        OKRunit needs a few user attributes from your IdP to create accounts.
        The defaults work for most providers, but you can customize them in the
        advanced settings if your IdP uses different attribute names.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left">
              <th className="pb-2 pr-4 font-semibold text-zinc-900">OKRunit Field</th>
              <th className="pb-2 pr-4 font-semibold text-zinc-900">Default Attribute</th>
              <th className="pb-2 font-semibold text-zinc-900">Notes</th>
            </tr>
          </thead>
          <tbody className="text-zinc-700">
            <tr className="border-b border-zinc-100">
              <td className="py-2 pr-4 font-medium">Email</td>
              <td className="py-2 pr-4">
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm text-zinc-800">NameID</code>{" "}
                or{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm text-zinc-800">email</code>
              </td>
              <td className="py-2">Required. Set your IdP&apos;s Name ID format to Email Address.</td>
            </tr>
            <tr className="border-b border-zinc-100">
              <td className="py-2 pr-4 font-medium">First Name</td>
              <td className="py-2 pr-4">
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm text-zinc-800">firstName</code>
              </td>
              <td className="py-2">Optional. Used to set the display name.</td>
            </tr>
            <tr className="border-b border-zinc-100">
              <td className="py-2 pr-4 font-medium">Last Name</td>
              <td className="py-2 pr-4">
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm text-zinc-800">lastName</code>
              </td>
              <td className="py-2">Optional. Combined with first name for display.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* How users sign in */}
      <h2 className="mt-12 text-2xl font-semibold text-zinc-900">
        How Users Sign In
      </h2>
      <p className="mt-2 text-zinc-700">
        Once SSO is enabled, your team members sign in like this:
      </p>
      <ol className="mt-4 space-y-4 text-zinc-700">
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
            1
          </span>
          <div>
            Go to the OKRunit login page and click <strong>&quot;Sign in with SSO&quot;</strong>.
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
            2
          </span>
          <div>
            Enter their work email address (e.g. jane@acme.com) and click <strong>Continue with SSO</strong>.
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
            3
          </span>
          <div>
            They&apos;re redirected to your company&apos;s identity provider to
            authenticate (password, MFA, etc.).
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
            4
          </span>
          <div>
            After authenticating, they&apos;re automatically redirected back to
            OKRunit and signed in. If it&apos;s their first time, an account is
            created automatically and they&apos;re added to your organization.
          </div>
        </li>
      </ol>

      {/* FAQ */}
      <h2 className="mt-12 text-2xl font-semibold text-zinc-900">
        Frequently Asked Questions
      </h2>

      <h3 className="mt-6 text-lg font-semibold text-zinc-900">
        Can users still sign in with email and password?
      </h3>
      <p className="mt-2 text-zinc-700">
        Yes. Enabling SSO adds an additional sign-in method but doesn&apos;t
        remove email/password login. Users can choose whichever method they prefer.
      </p>

      <h3 className="mt-6 text-lg font-semibold text-zinc-900">
        What happens when a new user signs in via SSO?
      </h3>
      <p className="mt-2 text-zinc-700">
        OKRunit automatically creates an account for them and adds them to your
        organization as a <strong>member</strong>. Organization admins can then
        adjust their role if needed.
      </p>

      <h3 className="mt-6 text-lg font-semibold text-zinc-900">
        Can I use SSO with multiple email domains?
      </h3>
      <p className="mt-2 text-zinc-700">
        Currently each organization supports one email domain for SSO. If you
        need multiple domains, please contact support.
      </p>

      <h3 className="mt-6 text-lg font-semibold text-zinc-900">
        Which SAML binding does OKRunit use?
      </h3>
      <p className="mt-2 text-zinc-700">
        OKRunit uses <strong>HTTP-Redirect</strong> for the AuthnRequest (SP &rarr; IdP)
        and <strong>HTTP-POST</strong> for the SAML Response (IdP &rarr; SP).
      </p>
    </article>
  );
}
