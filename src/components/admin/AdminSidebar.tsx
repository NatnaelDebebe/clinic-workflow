
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Users, DollarSign, BarChart3, Settings, FlaskConical, LogOut, UserSquare, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/data/users';
import { userRoles as validUserRoles } from '@/lib/data/users';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { href: '/admin', icon: Home, label: 'Dashboard', roles: ['admin', 'doctor', 'receptionist', 'lab_tech', 'patient'] },
  { href: '/admin/users', icon: Users, label: 'User Management', roles: ['admin'] },
  { href: '/admin/patients', icon: Users, label: 'Patients', roles: ['admin', 'receptionist', 'doctor'] },
  // { href: '/admin/appointments', icon: CalendarDays, label: 'Appointments', roles: ['admin', 'receptionist', 'doctor'] }, // Appointment link removed
  // { href: '/admin/my-appointments', icon: CalendarCheck, label: 'My Appointments', roles: ['doctor'] }, // My Appointment link removed
  { href: '/admin/lab-requests', icon: FlaskConical, label: 'Lab Requests', roles: ['admin', 'lab_tech', 'doctor', 'receptionist'] },
  { href: '/admin/manage-lab-tests', icon: ListChecks, label: 'Manage Lab Tests', roles: ['admin'] },
  { href: '/admin/billing', icon: DollarSign, label: 'Billing', roles: ['admin', 'receptionist'] },
  { href: '/admin/ai-tools', icon: UserSquare, label: 'AI Comms Tool', roles: ['receptionist'] },
  { href: '/admin/reports', icon: BarChart3, label: 'Reports', roles: ['admin'] },
  { href: '/admin/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
];

const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<{fullName: string; role: UserRole; username: string; id?: string} | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser) as { fullName: string; role: UserRole; username: string; id?: string };
          // Basic check: ensure userData is an object and has a role. Deeper validation (like presence of ID) is on pages.
          if (userData && typeof userData === 'object' && userData.role && validUserRoles.includes(userData.role)) {
            setCurrentUser(userData);
          } else {
            // If basic structure is wrong, clear and redirect.
            toast({ variant: "destructive", title: "Session Error", description: "Invalid user data in session. Please log in again." });
            localStorage.removeItem('loggedInUser');
            if (pathname !== '/') router.push('/');
          }
        } catch (error) {
          console.error("Failed to parse user data from localStorage in Sidebar", error);
          localStorage.removeItem('loggedInUser');
          if (pathname !== '/') router.push('/');
        }
      } else {
        // No user data found, redirect if not on login page.
        if (pathname !== '/') {
          router.push('/');
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount. Router and toast are stable, pathname check is internal to effect.

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('loggedInUser');
    }
    router.push('/');
  };
  
  if (!isClient) { 
    return (
      <aside className="w-80 bg-card text-card-foreground p-4 flex flex-col justify-between border-r border-border">
        <div>Loading user...</div>
      </aside>
    );
  }
  
  // Don't render sidebar at all on the login page
  if (pathname === '/') return null;

  // If still no current user after client check and not on login, means redirect should have happened or is in progress.
  if (!currentUser && pathname !== '/') {
      return (
          <aside className="w-80 bg-card text-card-foreground p-4 flex flex-col justify-between border-r border-border">
              <div>Authenticating...</div>
          </aside>
      );
  }

  const accessibleNavItems = navItems.filter(item => currentUser && item.roles.includes(currentUser.role));
  const userInitials = currentUser ? getInitials(currentUser.fullName) : '';

  return (
    <aside className="w-80 bg-card text-card-foreground p-4 flex flex-col justify-between border-r border-border">
      {currentUser && (
        <>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-2">
              <Avatar className="size-10">
                <AvatarImage src={`https://placehold.co/40x40.png?text=${userInitials}`} alt={currentUser.fullName} data-ai-hint="avatar placeholder"/>
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <h1 className="text-foreground text-base font-medium leading-normal">{currentUser.fullName}</h1>
                <p className="text-muted-foreground text-sm font-normal leading-normal capitalize">
                  {currentUser.role.replace('_', ' ')}
                </p>
              </div>
            </div>
            <nav className="flex flex-col gap-2 mt-4">
              {accessibleNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/')) || (pathname.startsWith(item.href) && item.href !== '/admin' && !pathname.substring(item.href.length).includes('/'));

                let finalIsActive = isActive;
                if (item.href === '/admin' && pathname !== '/admin' && pathname.startsWith('/admin/')) {
                  finalIsActive = false;
                }
                if (item.href === '/admin' && pathname === '/admin') {
                    finalIsActive = true;
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted',
                      finalIsActive ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground hover:text-foreground'
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
        </>
      )}
    </aside>
  );
}
