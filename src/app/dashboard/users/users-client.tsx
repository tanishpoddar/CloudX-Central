"use client";

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { UserCard } from './user-card';
import type { User, Team } from '@/types';

const TeamSection = ({ title, users }: { title: string; users: User[] }) => {
  if (users.length === 0) return null;
  return (
    <div>
      <h2 className="mb-4 font-headline text-2xl font-bold">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {users.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
      </div>
    </div>
  );
};

export default function UsersClient({ users }: { users: User[] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    return users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.team?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.subTeam?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, users]);

  // Define custom sort orders
  const presidiumOrder = ['Tanish Poddar', 'Sarthak Lal', 'Asmi Sharma'];
  const directorOrder = ['Sukhad Kaur', 'Kavya Singh', 'Saksham Gupta'];
  const leadTeamOrder = ['Technology', 'Corporate', 'Creatives'];

  const presidium = filteredUsers
    .filter(u => u.role === 'Co-founder' || u.role === 'Secretary')
    .sort((a, b) => presidiumOrder.indexOf(a.name) - presidiumOrder.indexOf(b.name));

  const directors = filteredUsers
    .filter(u => u.role === 'Chair of Directors')
    .sort((a, b) => directorOrder.indexOf(a.name) - directorOrder.indexOf(b.name));
    
  const leads = filteredUsers
    .filter(u => u.role === 'Lead')
    .sort((a, b) => {
        const teamAIndex = leadTeamOrder.indexOf(a.team as Team);
        const teamBIndex = leadTeamOrder.indexOf(b.team as Team);

        if (teamAIndex !== teamBIndex) {
            return teamAIndex - teamBIndex;
        }

        return a.name.localeCompare(b.name);
    });

  const members = filteredUsers.filter(u => u.role === 'Member').sort((a, b) => a.name.localeCompare(b.name));

  const technologyMembers = members.filter(u => u.team === 'Technology');
  const corporateMembers = members.filter(u => u.team === 'Corporate');
  const creativesMembers = members.filter(u => u.team === 'Creatives');

  return (
    <div className="space-y-8">
      <Card className="glass">
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>
            Browse and find members of the CloudX organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, role, team..."
              className="w-full max-w-sm pl-8"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <TeamSection title="Presidium" users={presidium} />
        <TeamSection title="Directors" users={directors} />
        <TeamSection title="Leads" users={leads} />

        {members.length > 0 && (
          <div>
            <h2 className="mb-4 font-headline text-2xl font-bold">Members</h2>
            <div className="space-y-6">
              <TeamSection title="Technology" users={technologyMembers} />
              <TeamSection title="Corporate" users={corporateMembers} />
              <TeamSection title="Creatives" users={creativesMembers} />
            </div>
          </div>
        )}
         {filteredUsers.length === 0 && (
             <Card className="glass">
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No users found matching your search.</p>
                </CardContent>
             </Card>
         )}
      </div>
    </div>
  );
}
