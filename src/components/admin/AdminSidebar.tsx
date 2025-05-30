
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Users, CalendarDays, DollarSign, BarChart3, Settings, FlaskConical, NotebookPen, LogOut, UserSquare } from 'lucide-react';
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
  { href: '/admin/lab-requests', icon: FlaskConical, label: 'Lab Requests', roles: ['admin', 'lab_tech', 'doctor', 'receptionist'] },
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
  const [currentUser, setCurrentUser] = useState<{fullName: string; role: UserRole; username: string} | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); 
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // Ensure no hardcoded role assignment here
          setCurrentUser(userData);
        } catch (error) {
          console.error("Failed to parse user data from localStorage", error);
          localStorage.removeItem('loggedInUser');
          router.push('/'); 
        }
      } else {
        router.push('/');
      }
    }
  }, [router]); // Rerunning when router object changes, which might include route changes.

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
  
  if (!currentUser) {
    // This case handles when user data is not yet loaded or user is not logged in.
    // It might briefly show before redirecting if not logged in.
    return (
         <aside className="w-80 bg-card text-card-foreground p-4 flex flex-col justify-between border-r border-border">
            <div>Authenticating...</div>
        </aside>
    );
  }

  const accessibleNavItems = navItems.filter(item => currentUser && item.roles.includes(currentUser.role));
  const userInitials = getInitials(currentUser.fullName);

  return (
    <aside className="w-80 bg-card text-card-foreground p-4 flex flex-col justify-between border-r border-border">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-2">
          <Avatar className="size-10">
            <AvatarImage src={`https://placehold.co/40x40.png?text=${userInitials}`} alt={currentUser.fullName} data-ai-hint="avatar placeholder" />
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
            // More robust active link checking
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/')) || (pathname.startsWith(item.href) && item.href !== '/admin' && !pathname.substring(item.href.length).includes('/'));

            // Special case for /admin dashboard link to not be active if on a sub-page, unless it's exactly /admin
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
    </aside>
  );
}
