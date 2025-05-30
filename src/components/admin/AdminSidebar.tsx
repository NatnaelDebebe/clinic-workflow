
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Users, CalendarDays, DollarSign, BarChart3, Settings, Stethoscope, FlaskConical, UserSquare, NotebookPen } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', icon: Home, label: 'Dashboard', roles: ['admin', 'doctor', 'receptionist', 'lab_tech'] },
  { href: '/admin/users', icon: Users, label: 'User Management', roles: ['admin'] },
  { href: '/admin/patients', icon: Users, label: 'Patients', roles: ['admin', 'receptionist', 'doctor'] },
  { href: '/admin/appointments', icon: CalendarDays, label: 'Appointments', roles: ['admin', 'receptionist', 'doctor'] },
  { href: '/admin/my-appointments', icon: NotebookPen, label: 'My Appointments', roles: ['doctor'] }, 
  { href: '/admin/schedule', icon: CalendarDays, label: 'Schedule', roles: ['receptionist', 'doctor'] },
  { href: '/admin/lab-requests', icon: FlaskConical, label: 'Lab Requests', roles: ['admin', 'lab_tech', 'doctor'] },
  { href: '/admin/billing', icon: DollarSign, label: 'Billing', roles: ['admin', 'receptionist'] },
  { href: '/admin/ai-tools', icon: UserSquare, label: 'AI Comms Tool', roles: ['receptionist'] },
  { href: '/admin/reports', icon: BarChart3, label: 'Reports', roles: ['admin'] },
  { href: '/admin/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
];

// This would ideally come from an auth context
const currentUserRole = 'lab_tech'; // Example: 'admin', 'doctor', 'receptionist', 'lab_tech'
const currentUserName = 'Lab Personnel'; // Placeholder, should be dynamic
const currentUserInitials = 'LP'; // Placeholder

export default function AdminSidebar() {
  const pathname = usePathname();

  const accessibleNavItems = navItems.filter(item => item.roles.includes(currentUserRole));

  return (
    <aside className="w-80 bg-card text-card-foreground p-4 flex flex-col justify-between border-r border-border">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-2">
          <Avatar className="size-10">
            {/* Placeholder image, update with actual user image if available */}
            <AvatarImage src="https://placehold.co/40x40.png" alt={currentUserName} data-ai-hint="avatar" />
            <AvatarFallback>{currentUserInitials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h1 className="text-foreground text-base font-medium leading-normal">{currentUserName}</h1>
            <p className="text-muted-foreground text-sm font-normal leading-normal capitalize">{currentUserRole.replace('_', ' ')}</p>
          </div>
        </div>
        <nav className="flex flex-col gap-2 mt-4">
          {accessibleNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            // Special handling for /admin exact match if other routes start with /admin/
            const isDashboardActive = item.href === '/admin' && pathname === '/admin';
            // More specific active state for nested routes like /admin/lab-requests/[id]
            const isCurrentPageActive = item.href === '/admin/lab-requests' && pathname.startsWith('/admin/lab-requests');


            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted',
                  (isActive || isDashboardActive || isCurrentPageActive) ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground hover:text-foreground'
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
