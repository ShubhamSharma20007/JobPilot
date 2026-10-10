import { useTheme } from '@/context/theme-context';
import { PRODUCT_HUNT } from './Content';
import { ArrowRight, Puzzle } from 'lucide-react';

export function ExtensionLink() {
  return (
    <a
      href="#extension"
      className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <Puzzle className="size-4 text-indigo-500" />
      Also available as a Chrome extension
      <ArrowRight className="size-3.5" />
    </a>
  );
}

export function ProductHuntBadge({ className = '' }: { className?: string }) {
  const { theme } = useTheme();
  const { url, postId } = PRODUCT_HUNT;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block ${className}`}
    >
      <img
        src={`https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=${postId}&theme=${theme}`}
        alt="JobPilot on Product Hunt"
        width="250"
        height="54"
        style={{ width: 250, height: 54 }}
      />
    </a>
  );
}
