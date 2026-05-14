import Link from 'next/link';
import { BrandMark } from './BrandMark';
import clsx from 'clsx';

type BrandLogoProps = {
  /** If set, wraps mark + wordmark in a Next.js Link */
  href?: string;
  className?: string;
  /** Mark size in Tailwind classes */
  markClassName?: string;
  /** Hide “QuizFlow AI” text (navbar icon-only on xs optional) */
  wordmark?: boolean;
};

export function BrandLogo({
  href = '/',
  className,
  markClassName = 'h-9 w-9 sm:h-10 sm:w-10',
  wordmark = true,
}: BrandLogoProps) {
  const inner = (
    <span
      className={clsx(
        'inline-flex items-center gap-2.5 sm:gap-3',
        className
      )}
    >
      <BrandMark className={clsx('shrink-0', markClassName)} />
      {wordmark ? (
        <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          QuizFlow
          <span className="text-primary-600"> AI</span>
        </span>
      ) : null}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg">
        {inner}
      </Link>
    );
  }

  return inner;
}
