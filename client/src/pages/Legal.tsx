import type { ReactNode } from 'react';

/** Shared page frame: soft glow, gradient title, readable body */
function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72"
      >
        <div className="absolute top-[-9rem] left-1/2 h-[18rem] w-[40rem] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl dark:bg-indigo-500/20" />
      </div>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <header className="border-b pb-6">
          <h1 className="font-heading text-3xl font-bold">
            <span className="bg-linear-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              {title}
            </span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {updated}
          </p>
        </header>

        <div className="mt-8 space-y-4 leading-relaxed text-foreground/90">
          {children}
        </div>
      </section>
    </div>
  );
}

/** Section heading with a small gradient bar, so long pages are easy to scan */
function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 pt-6 font-heading text-xl font-semibold text-foreground">
      <span
        aria-hidden
        className="h-5 w-1 shrink-0 rounded-full bg-linear-to-b from-indigo-500 to-violet-500"
      />
      {children}
    </h2>
  );
}

const mailLink =
  'font-medium text-foreground underline underline-offset-4 decoration-indigo-500/50 hover:decoration-indigo-500';

export function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="October 2026">
      <H2>What we collect</H2>
      <p>
        Your Google account name, email address and profile picture when you
        sign in, the PDF resumes you upload, the recruiter email addresses you
        enter, and your email template and sending settings.
      </p>

      <H2>Gmail access</H2>
      <p>
        With your permission, JobPilot sends job application emails from your
        Gmail account (gmail.send) and checks for delivery failure notices
        (gmail.readonly). We only read bounce notices from mailer-daemon or
        postmaster. We do not read, store or share any other email in your
        inbox.
      </p>

      <H2>How we use and store data</H2>
      <p>
        Data is used only to provide the service. We do not sell your data or
        use it for advertising or AI model training.
      </p>

      <H2>How we protect your data</H2>
      <p>
        We take the following steps to protect your data, including sensitive
        Google user data such as your Google access tokens:
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <span className="font-medium text-foreground">
            Encryption in transit.
          </span>{' '}
          All communication between your browser, our servers and Google's APIs
          uses HTTPS (TLS).
        </li>
        <li>
          <span className="font-medium text-foreground">
            Encryption of tokens.
          </span>{' '}
          Google OAuth tokens are encrypted before they are stored and are never
          exposed to your browser or to the Chrome extension.
        </li>
        <li>
          <span className="font-medium text-foreground">Secure sessions.</span>{' '}
          You stay signed in through a secure, server-managed session cookie.
        </li>
        <li>
          <span className="font-medium text-foreground">Access control.</span>{' '}
          Your data is only available to your own account. Access to our servers
          and databases is restricted to the developer and protected by
          authentication and credentials kept outside the source code.
        </li>
        <li>
          <span className="font-medium text-foreground">Least privilege.</span>{' '}
          We request only the Gmail permissions needed to send your applications
          and detect delivery failures.
        </li>
        <li>
          <span className="font-medium text-foreground">No human access.</span>{' '}
          No one at JobPilot reads your Gmail data, except where you ask us for
          support, where it is needed to investigate abuse or a security issue,
          or where the law requires it.
        </li>
        <li>
          <span className="font-medium text-foreground">No sharing.</span> We do
          not share Google user data with third parties, other than the
          infrastructure providers that host the service and only as needed to
          run it.
        </li>
      </ul>

      <H2>Data retention</H2>
      <p>
        We keep your data only while your account is active. When you disconnect
        Google, your stored Google tokens are deleted and sending stops. When
        you ask us to delete your account, we delete your account, resumes,
        template, sheet data and stored Google tokens within 30 days.
      </p>

      <H2>Google API Services User Data Policy</H2>
      <p>
        JobPilot's use and transfer of information received from Google APIs
        adheres to the{' '}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noopener noreferrer"
          className={mailLink}
        >
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements.
      </p>

      <H2>Deleting your data</H2>
      <p>
        You can disconnect Google at any time from Settings in JobPilot, or
        revoke access at{' '}
        <a
          href="https://myaccount.google.com/permissions"
          target="_blank"
          rel="noopener noreferrer"
          className={mailLink}
        >
          https://myaccount.google.com/permissions
        </a>
        . To delete your account and data, email{' '}
        <a href="mailto:shubhamsharma20007@gmail.com" className={mailLink}>
          shubhamsharma20007@gmail.com
        </a>
        .
      </p>

      <H2>Contact</H2>
      <p>
        <a href="mailto:shubhamsharma20007@gmail.com" className={mailLink}>
          shubhamsharma20007@gmail.com
        </a>
      </p>
    </LegalPage>
  );
}

export function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="October 2026">
      <p>
        JobPilot helps you send job application emails from your own Gmail
        account. You are responsible for the content you send and for following
        Gmail's sending policies and applicable anti-spam laws.
      </p>
      <p>
        The service is provided as is, without warranties. We may change or stop
        the service at any time. You can stop using JobPilot and revoke its
        access to your Google account whenever you like.
      </p>
      <p>
        Contact:{' '}
        <a href="mailto:shubhamsharma20007@gmail.com" className={mailLink}>
          shubhamsharma20007@gmail.com
        </a>
      </p>
    </LegalPage>
  );
}
