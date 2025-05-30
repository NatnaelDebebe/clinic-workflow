
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Users, CalendarDays, DollarSign, BarChart3, Settings, Stethoscope, FlaskConical, UserSquare, NotebookPen, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/data/users';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';

const navItems = [
  { href: '/admin', icon: Home, label: 'Dashboard', roles: ['admin', 'doctor', 'receptionist', 'lab_tech', 'patient'] },
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

// Function to get initials from full name
const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('User');
  const [currentUserInitials, setCurrentUserInitials] = useState<string>('U');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Component has mounted, localStorage is available
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setCurrentUserRole(userData.role as UserRole);
          setCurrentUserName(userData.fullName || 'User');
          setCurrentUserInitials(getInitials(userData.fullName || 'User'));
        } catch (error) {
          console.error("Failed to parse user data from localStorage", error);
          // Fallback or redirect if data is corrupted
          localStorage.removeItem('loggedInUser');
          router.push('/'); // Redirect to login
        }
      } else {
        // No logged-in user found, redirect to login
        router.push('/');
      }
    }
  }, [router]);

  if (!isClient || !currentUserRole) {
    // Show a loading state or null while waiting for client-side hydration and role check
    // Or redirect immediately if preferred, but this avoids flash of content
    return (
      <aside className="w-80 bg-card text-card-foreground p-4 flex flex-col justify-between border-r border-border">
        <div>Loading...</div>
      </aside>
    );
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('loggedInUser');
    }
    router.push('/');
  };

  const accessibleNavItems = navItems.filter(item => currentUserRole && item.roles.includes(currentUserRole));

  return (
    <aside className="w-80 bg-card text-card-foreground p-4 flex flex-col justify-between border-r border-border">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-2">
          <Avatar className="size-10">
            <AvatarImage src={`https://placehold.co/40x40.png?text=${currentUserInitials}`} alt={currentUserName} data-ai-hint="avatar placeholder" />
            <AvatarFallback>{currentUserInitials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h1 className="text-foreground text-base font-medium leading-normal">{currentUserName}</h1>
            <p className="text-muted-foreground text-sm font-normal leading-normal capitalize">
              {currentUserRole.replace('_', ' ')}
            </p>
          </div>
        </div>
        <nav className="flex flex-col gap-2 mt-4">
          {accessibleNavItems.map((item) => {
            const isActive = (item.href === '/admin' && pathname === item.href) ||
                             (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted',
                  isActive ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground hover:text-foreground'
                )}
              >
                <item.icon className="size-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <Button variant="outline" onClick={handleLogout} className="w-full">
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </aside>
  );
}
