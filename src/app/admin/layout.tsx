
import AdminSidebar from '@/components/admin/AdminSidebar';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-0">
        {children}
      </main>
    </div>
  );
}
