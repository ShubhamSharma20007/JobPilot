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

function Strong({ children }: { children: ReactNode }) {
  return <span className="font-medium text-foreground">{children}</span>;
}

const mailLink =
  'font-medium text-foreground underline underline-offset-4 decoration-indigo-500/50 hover:decoration-indigo-500';

const CONTACT_EMAIL = 'shubhamsharma20007@gmail.com';

function ContactLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className={mailLink}>
      {CONTACT_EMAIL}
    </a>
  );
}

export function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="October 2026">
      <p>
        JobPilot is a service and Chrome extension that helps you send job
        application emails from your own Gmail account. This policy explains
        what data we collect, why, and how we handle it. The short version: we
        only use your data to run JobPilot for you, we never sell it, and we
        never use it for advertising.
      </p>

      <H2>What we collect</H2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <Strong>Account information.</Strong> Your Google account name, email
          address, profile picture and Google account ID when you sign in.
        </li>
        <li>
          <Strong>Resumes.</Strong> The PDF resumes you upload, and the profile
          we extract from your default resume (for example your target
          position, skills and years of experience).
        </li>
        <li>
          <Strong>Recruiter emails and sending data.</Strong> The recruiter
          email addresses you add to your sheet (typed, pasted, added from a
          job, or added with the Chrome extension), plus the status of each
          send (sent, failed, skipped, reason for failure and timestamps).
        </li>
        <li>
          <Strong>Settings and template.</Strong> Your email template, daily
          limit, send window, follow-up and notification preferences, and your
          time zone.
        </li>
        <li>
          <Strong>Job activity.</Strong> The jobs you apply to or hide in Find
          jobs, and the emails drafted for them.
        </li>
        <li>
          <Strong>Google access tokens.</Strong> If you connect Gmail, the
          tokens Google issues so JobPilot can send on your behalf.
        </li>
        <li>
          <Strong>Session cookie.</Strong> A secure cookie that keeps you
          signed in.
        </li>
      </ul>

      <H2>Gmail access</H2>
      <p>
        With your permission, JobPilot uses two Gmail permissions:{' '}
        <span className="font-mono text-sm">gmail.send</span> to send your
        application and follow-up emails from your account, and{' '}
        <span className="font-mono text-sm">gmail.readonly</span> only to
        detect delivery failure notices (bounces) and replies to emails that
        JobPilot sent, so we can mark failures in your sheet and avoid sending
        a follow-up after a recruiter has replied.
      </p>
      <p>
        We only look at bounce notices from mailer-daemon or postmaster and at
        threads created by JobPilot. We do not read, store, copy or share any
        other email in your inbox.
      </p>

      <H2>How we use your data</H2>
      <ul className="list-disc space-y-2 pl-6">
        <li>To send your applications and follow-ups at the pace you set.</li>
        <li>To show results (sent, failed, reasons) in your sheet.</li>
        <li>
          To read your resume, work out your target position and rank job
          openings against it.
        </li>
        <li>
          To draft application emails when you click AI apply, using facts from
          your resume.
        </li>
        <li>
          To send you the failure alerts and daily summaries you turn on, and
          to respond to support requests.
        </li>
      </ul>
      <p>
        We do not sell your data. We do not use it for advertising,
        profiling, creditworthiness or lending decisions, or to train
        generative AI or machine learning models.
      </p>

      <H2>AI processing</H2>
      <p>
        When you upload a resume, or click AI apply, the text of your resume
        and the relevant job post are sent to a third-party AI service so it
        can extract your profile and draft an email. This happens only to
        provide those features to you. The text is not used to train AI
        models, and the service is only allowed to process it on our behalf.
        We never send your Gmail messages or Google access tokens to an AI
        service.
      </p>

      <H2>Chrome extension</H2>
      <p>
        The JobPilot extension has a single purpose: to let you select a
        recruiter's email address on a web page and add it to your own JobPilot
        sheet.
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <Strong>What it reads.</Strong> A small script runs on the pages you
          visit and checks the text you select, on your device, to see whether
          it looks like an email address. If it does, a small Add button
          appears.
        </li>
        <li>
          <Strong>What it sends.</Strong> Nothing leaves your browser until you
          click Add. Then only that one email address is sent to JobPilot over
          HTTPS, together with your existing JobPilot session cookie, and it is
          saved to your sheet.
        </li>
        <li>
          <Strong>What it does not do.</Strong> It does not read, record, store
          or transmit your browsing history, page content, form fields,
          passwords or anything you have not selected. It does not store your
          credentials, and it uses your existing JobPilot sign-in.
        </li>
        <li>
          <Strong>Permissions.</Strong> The extension requests access to all
          sites only so it can detect a selected email address wherever you
          find one. It requests access to the JobPilot server to check your
          sign-in and save emails, and the side panel permission to show its
          interface.
        </li>
        <li>
          <Strong>No remote code.</Strong> All extension code is included in
          the package you install. It does not load or run code from any other
          source.
        </li>
        <li>
          <Strong>No third parties.</Strong> The extension does not include
          advertising, analytics or tracking.
        </li>
      </ul>

      <H2>How we protect your data</H2>
      <p>
        We take the following steps to protect your data, including sensitive
        Google user data such as your Google access tokens:
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <Strong>Encryption in transit.</Strong> All communication between
          your browser, our servers and Google's APIs uses HTTPS (TLS).
        </li>
        <li>
          <Strong>Encryption of tokens.</Strong> Google OAuth tokens are
          encrypted before they are stored and are never exposed to your
          browser or to the Chrome extension.
        </li>
        <li>
          <Strong>Secure sessions.</Strong> You stay signed in through a
          secure, server-managed session cookie.
        </li>
        <li>
          <Strong>Access control.</Strong> Your data is only available to your
          own account. Access to our servers and databases is restricted to the
          developer and protected by authentication and credentials kept
          outside the source code.
        </li>
        <li>
          <Strong>Least privilege.</Strong> We request only the Gmail
          permissions needed to send your applications and detect delivery
          failures and replies.
        </li>
        <li>
          <Strong>No human access.</Strong> No one at JobPilot reads your Gmail
          data, except where you ask us for support, where it is needed to
          investigate abuse or a security issue, or where the law requires it.
        </li>
      </ul>

      <H2>Who we share data with</H2>
      <p>
        We do not sell, rent or trade your data, and we do not share Google
        user data with anyone except as follows: infrastructure providers that
        host and run JobPilot (servers, database, file storage, email delivery
        and the AI service described above), only as needed to provide the
        service and under obligations to protect it; and authorities, where
        the law requires it. Emails you choose to send go to the recruiters you
        choose, from your own Gmail account.
      </p>

      <H2>Data retention</H2>
      <p>
        We keep your data only while your account is active. When you
        disconnect Google, your stored Google tokens are deleted and sending
        stops. When you delete your account, we delete your account, resumes,
        template, sheet data and stored Google tokens. Backups are cleared
        within 30 days.
      </p>

      <H2>Cookies</H2>
      <p>
        We use one essential cookie to keep you signed in, and your browser's
        local storage to remember your light or dark theme. We do not use
        advertising or tracking cookies. Our pages load fonts from Google
        Fonts, which means your browser requests them from Google.
      </p>

      <H2>Google API Services User Data Policy</H2>
      <p>
        JobPilot's use and transfer of information received from Google APIs to
        any other app will adhere to the{' '}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noopener noreferrer"
          className={mailLink}
        >
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements. In particular, we only use
        Google user data to provide and improve the features you see in
        JobPilot, we do not transfer it to others except as needed to provide
        those features, comply with law, or as part of a merger or sale with
        notice to you, we do not use it for advertising, and no humans read it
        except in the limited cases described above.
      </p>

      <H2>Your choices and deleting your data</H2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          Disconnect Google at any time from Settings in JobPilot, or revoke
          access at{' '}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
            className={mailLink}
          >
            myaccount.google.com/permissions
          </a>
          .
        </li>
        <li>
          Delete your account and all associated data from Settings, under
          Danger zone. You can also email <ContactLink /> and we will do it for
          you.
        </li>
        <li>
          Remove the Chrome extension at any time from chrome://extensions.
        </li>
        <li>
          Ask us what data we hold about you, or to correct it, by emailing{' '}
          <ContactLink />.
        </li>
      </ul>

      <H2>Children</H2>
      <p>
        JobPilot is not directed at children under 16, and we do not knowingly
        collect their data.
      </p>

      <H2>Changes to this policy</H2>
      <p>
        If we change this policy in a meaningful way, we will update the date
        above and, for material changes, tell you in the app or by email.
      </p>

      <H2>Contact</H2>
      <p>
        Questions or requests about privacy: <ContactLink />
      </p>
    </LegalPage>
  );
}

export function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="October 2026">
      <p>
        JobPilot helps you send job application emails from your own Gmail
        account. By using JobPilot and its Chrome extension, you agree to these
        terms.
      </p>

      <H2>Your responsibilities</H2>
      <p>
        You are responsible for the content you send, for having a lawful
        reason to contact each recipient, and for following Gmail's sending
        policies and applicable anti-spam laws. Do not use JobPilot to send
        spam, harassment, deceptive or unlawful messages.
      </p>

      <H2>AI-written emails</H2>
      <p>
        Emails drafted by AI apply are generated from your resume and the job
        post. Review your template and settings, and make sure what is sent is
        accurate. You are responsible for emails sent from your account.
      </p>

      <H2>Service availability</H2>
      <p>
        The service is provided as is, without warranties. We do not guarantee
        that emails will be delivered, read or answered. We may change or stop
        the service at any time. You can stop using JobPilot and revoke its
        access to your Google account whenever you like.
      </p>

      <H2>Privacy</H2>
      <p>
        How we handle your data is described in our{' '}
        <a href="/privacy" className={mailLink}>
          Privacy Policy
        </a>
        .
      </p>

      <H2>Contact</H2>
      <p>
        <ContactLink />
      </p>
    </LegalPage>
  );
}