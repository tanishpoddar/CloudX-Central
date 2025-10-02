import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getUserById } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Briefcase,
  Cake,
  Github,
  Linkedin,
  Mail,
  Phone,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';

const getUserTitle = (role: string, team: string | null): string => {
  if (role === 'Chair of Directors' && team) {
    return `Director of ${team}`;
  }
  return role;
};

const InfoRow = ({ icon, label, value, isLink = false, href }: { icon: React.ReactNode, label: string, value: string | null | undefined, isLink?: boolean, href?: string }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {isLink ? (
          <a href={href || value} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
            {value.replace(/^(https?:\/\/)?(www\.)?/, '')}
          </a>
        ) : (
          <p className="text-sm font-medium">{value}</p>
        )}
      </div>
    </div>
  );
};

interface UserProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const resolvedParams = await params;
  const user = await getUserById(resolvedParams.id);

  if (!user) {
    notFound();
  }

  const position = getUserTitle(user.role, user.team);

  return (
    <div className="space-y-8">
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
            <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-3xl">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <h1 className="font-headline text-3xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            Professional and contact details for {user.name.split(' ')[0]}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
            <InfoRow icon={<Briefcase size={18} />} label="Position" value={position} />
            <InfoRow icon={<Users size={18} />} label="Group Name" value={`${user.team} ${user.subTeam ? `(${user.subTeam})` : ''}`} />
            <InfoRow icon={<Mail size={18} />} label="Email" value={user.email} isLink href={`mailto:${user.email}`} />
            <InfoRow icon={<Phone size={18} />} label="Phone Number" value={user.phone} />
            <InfoRow icon={<Cake size={18} />} label="Birthday" value={user.birthday ? format(new Date(user.birthday), 'MMMM do') : null} />
            <InfoRow icon={<Linkedin size={18} />} label="LinkedIn" value={user.linkedin} isLink />
            <InfoRow icon={<Github size={18} />} label="GitHub" value={user.github} isLink />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}