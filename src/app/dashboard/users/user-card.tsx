'use client';

import Link from 'next/link';
import type { User } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function UserCard({ user }: { user: User }) {
  const userInitials = user.name.split(' ').map(n => n[0]).join('');

  const getPosition = (user: User) => {
    if (user.role === 'Chair of Directors' && user.team) {
      return `Director of ${user.team}`;
    }
     if (user.role === 'Lead' && user.subTeam) {
        const subTeamName = user.subTeam.replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return `${subTeamName} Lead`;
    }
    return user.role;
  }

  const teamColorClasses: Record<string, string> = {
    Technology: 'bg-blue-900/50 text-blue-300 border-blue-700 hover:bg-blue-900/80',
    Corporate: 'bg-green-900/50 text-green-300 border-green-700 hover:bg-green-900/80',
    Creatives: 'bg-pink-900/50 text-pink-300 border-pink-700 hover:bg-pink-900/80',
    Presidium: 'bg-primary/20 text-primary border-primary/50'
  };


  return (
    <Link href={`/dashboard/users/${user.id}`} className="group">
        <Card className="glass h-full transition-all duration-300 ease-in-out group-hover:border-primary group-hover:shadow-lg group-hover:-translate-y-1">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                <Avatar className="h-20 w-20 border-2 border-muted-foreground group-hover:border-accent transition-colors">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{getPosition(user)}</p>
                    {user.team && (
                        <Badge 
                            variant="outline" 
                            className={cn("mt-2", user.team && teamColorClasses[user.team])}
                        >
                            {user.team}
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    </Link>
  );
}
