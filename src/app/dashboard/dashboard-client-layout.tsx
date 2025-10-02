'use client';

import type { ReactNode } from 'react';
import { Header } from '@/components/dashboard/header';
import type { User } from '@/types';

export default function DashboardClientLayout({ user, children }: { user: User, children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header user={user} />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-8">
        <div className="mx-auto w-full max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
