import Link from 'next/link';
import { LogoIcon } from '@/components/icons/LogoIcon';

export default function AppHeader() {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border px-10 py-3">
      <Link href="/" className="flex items-center gap-4 text-foreground">
        <div className="size-4">
          <LogoIcon />
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] font-headline">
          Clinic System
        </h2>
      </Link>
      {/* Navigation items can be added here if needed */}
    </header>
  );
}
