import type { Metadata } from 'next';
import AppHeader from '@/components/shared/AppHeader';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';

export const metadata: Metadata = {
  title: 'ClinicFlow',
  description: 'Clinic Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700;900&family=Public+Sans:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <div className="relative flex size-full min-h-screen flex-col bg-background group/design-root overflow-x-hidden">
          <div className="layout-container flex h-full grow flex-col">
            <AppHeader />
            <main className="px-4 sm:px-6 lg:px-10 xl:px-40 flex flex-1 justify-center py-5">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
