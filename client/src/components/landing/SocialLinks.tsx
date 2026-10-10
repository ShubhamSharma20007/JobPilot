import { Mail } from 'lucide-react';
import { SOCIALS } from './Content';

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

const iconLink =
  'inline-grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground';

export function SocialLinks({ className = 'flex' }: { className?: string }) {
  return (
    <div className={`items-center ${className}`}>
      <a
        href={SOCIALS.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Shubham on LinkedIn"
        className={iconLink}
      >
        <LinkedInIcon />
      </a>
      <a
        href={`mailto:${SOCIALS.email}`}
        aria-label="Email Shubham"
        className={iconLink}
      >
        <Mail className="size-4" />
      </a>
    </div>
  );
}
