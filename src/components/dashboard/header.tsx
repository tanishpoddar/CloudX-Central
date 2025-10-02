
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, Users, CalendarCheck, GanttChartSquare, FilePlus, Rss, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { logout } from '@/app/actions';
import { Logo } from '@/components/logo';
import type { User, UserRole, Team } from '@/types';
import { cn } from '@/lib/utils';
import { NotificationPopover } from './notification-popover';
import { useState, useEffect } from 'react';


const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: null, roles: ['Co-founder', 'Secretary', 'Chair of Directors', 'Lead', 'Member'] },
  { href: '/dashboard/tasks', label: 'Tasks', icon: null, roles: ['Co-founder', 'Secretary', 'Chair of Directors', 'Lead', 'Member'] },
  { href: '/dashboard/my-week', label: 'My Week', icon: CalendarCheck, roles: ['Co-founder', 'Secretary', 'Chair of Directors', 'Lead', 'Member'] },
  { href: '/dashboard/gantt', label: 'Gantt', icon: GanttChartSquare, roles: ['Co-founder', 'Secretary', 'Chair of Directors', 'Lead', 'Member'] },
  { href: '/dashboard/generate-tasks', label: 'Generate Tasks', icon: FilePlus, roles: ['Co-founder', 'Secretary', 'Chair of Directors', 'Lead'] },
  { href: '/dashboard/announcements', label: 'Announcements', icon: Rss, roles: ['Co-founder', 'Secretary', 'Chair of Directors', 'Lead', 'Member'] },
  { href: '/dashboard/users', label: 'Users', icon: null, roles: ['Co-founder', 'Secretary', 'Chair of Directors', 'Lead', 'Member'] },
  { href: '/dashboard/admin', label: 'Admin', icon: Shield, roles: ['Co-founder', 'Secretary', 'Chair of Directors'] },
  { href: '/dashboard/logs', label: 'Logs', icon: null, roles: ['Co-founder', 'Secretary', 'Chair of Directors', 'Lead', 'Member'] },
];

const getUserTitle = (role: UserRole, team: Team | null): string => {
  if (role === 'Chair of Directors' && team) {
    return `Director of ${team}`;
  }
  return role;
}

export function Header({ user }: { user: User }) {
  const userInitials = user.name.split(' ').map((n) => n[0]).join('');
  const pathname = usePathname();
  const userTitle = getUserTitle(user.role, user.team);
  const [greeting, setGreeting] = useState<{ text: string; punctuation: string }>({ text: 'Welcome Back', punctuation: '!' });
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const visibleNavItems = navItems.filter(item => item.roles.includes(user.role));

  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      setGreeting({ text: 'Good Morning', punctuation: '!' });
    } else if (currentHour < 17) {
      setGreeting({ text: 'Good Afternoon', punctuation: '!' });
    } else if (currentHour < 21) {
      setGreeting({ text: 'Good Evening', punctuation: '!' });
    } else {
      setGreeting({ text: 'Burning the midnight oil', punctuation: '?' });
    }
  }, []);
  

  return (
    <header className="sticky top-0 z-50 flex flex-col items-center border-b border-white/10 bg-black/50 backdrop-blur-lg">
      
      <div className="w-full border-b border-white/10 px-4 md:px-6">
        <div className="relative flex h-16 items-center justify-center">
            <div className="absolute left-0 md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-background/95">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Mobile Navigation Menu</SheetTitle>
                    <SheetDescription>
                      A list of links to navigate to different sections of the application.
                    </SheetDescription>
                  </SheetHeader>
                  <nav className="grid gap-6 text-lg font-medium">
                      <Link
                      href="/dashboard"
                      className="flex items-center gap-2 text-lg font-semibold"
                      onClick={() => setIsSheetOpen(false)}
                      >
                      <Logo />
                      </Link>
                      {visibleNavItems.map(({ href, label }) => (
                      <Link
                          key={href}
                          href={href}
                          className={cn(
                          'transition-colors hover:text-foreground',
                          pathname === href
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          )}
                          onClick={() => setIsSheetOpen(false)}
                      >
                          {label}
                      </Link>
                      ))}
                  </nav>
                </SheetContent>
            </Sheet>
            </div>
            
            <div className="absolute left-1/2 -translate-x-1/2">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <Logo />
                </Link>
            </div>
        </div>
      </div>
      
      <nav className="hidden w-full items-center justify-center border-b border-white/10 px-4 py-2 md:flex">
          <div className="flex items-center justify-center gap-6">
            {visibleNavItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative rounded-md px-3 py-1 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-white/10 hover:text-white',
                  pathname.startsWith(href) && href !== '/dashboard' || pathname === href ? 'text-white' : ''
                )}
              >
                {label}
                {(pathname.startsWith(href) && href !== '/dashboard' || pathname === href) && (
                  <span className="absolute inset-x-1 -bottom-2 h-0.5 rounded-full bg-primary transition-all"></span>
                )}
              </Link>
            ))}
          </div>
      </nav>

      <div className="w-full max-w-7xl px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-y-2">
          <div className="flex flex-col">
              <h1 className="font-headline text-2xl font-bold md:text-3xl text-white">
                {greeting.text}, {user?.name.split(' ')[0]}{greeting.punctuation}
              </h1>
              <p className="text-md text-muted-foreground">{`You are the ${userTitle} at CloudX.`}</p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>

            <NotificationPopover user={user} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/users/${user.id}`} className="cursor-pointer">My Account</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={logout}>
                  <button type="submit" className="w-full text-left">
                    <DropdownMenuItem className="cursor-pointer">Logout</DropdownMenuItem>
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

    </header>
  );
}
