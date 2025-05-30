
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Users, CalendarDays, DollarSign, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', icon: Home, label: 'Dashboard' },
  { href: '/admin/patients', icon: Users, label: 'Patients' },
  { href: '/admin/appointments', icon: CalendarDays, label: 'Appointments' },
  { href: '/admin/billing', icon: DollarSign, label: 'Billing' },
  { href: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-80 bg-card text-card-foreground p-4 flex flex-col justify-between border-r border-border">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-2">
          <Avatar className="size-10">
            <AvatarImage src="https://placehold.co/40x40.png" alt="Admin" data-ai-hint="avatar" />
            <AvatarFallback>CA</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h1 className="text-foreground text-base font-medium leading-normal">Clinic Admin</h1>
            <p className="text-muted-foreground text-sm font-normal leading-normal">Admin</p>
          </div>
        </div>
        <nav className="flex flex-col gap-2 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted',
                  isActive ? 'bg-muted text-foreground' : 'text-foreground hover:text-foreground'
                )}
              >
                <item.icon className="size-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      {/* Can add a footer here if needed, e.g. Logout button */}
    </aside>
  );
}
