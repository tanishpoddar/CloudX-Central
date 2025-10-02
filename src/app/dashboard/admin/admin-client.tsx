'use client';

import { useState, useTransition, useRef } from 'react';
import type { User, UserRole, Team, SubTeam } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { updateUser, seedUsers } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, Upload } from 'lucide-react';
import Papa from 'papaparse';

const roles: UserRole[] = ['Co-founder', 'Secretary', 'Chair of Directors', 'Lead', 'Member'];
const teams: (Team | null | string)[] = ['Presidium', 'Technology', 'Corporate', 'Creatives', null];
const subTeams: (SubTeam | null | string)[] = [
    'dev', 'ui-ux', 'aiml', 'cloud', 'iot',
    'events', 'ops', 'pr', 'sponsorship',
    'digital-design', 'media', null
];
const NONE_VALUE = "__NONE__";

export default function AdminClient({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (userId: string, field: keyof User, value: string | null) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, [field]: value === NONE_VALUE ? null : value } : user
      )
    );
  };

  const handleSaveChanges = (userId: string) => {
    const userToSave = users.find(u => u.id === userId);
    if (!userToSave) return;

    startTransition(async () => {
      try {
        await updateUser(userToSave);
        toast({
          title: 'User Updated',
          description: `${userToSave.name}'s data has been saved.`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to update user.',
        });
        setUsers(initialUsers);
      }
    });
  };

  const handleSeedDatabase = () => {
    startTransition(async () => {
      try {
        const newUsers = await seedUsers(users);
        setUsers(newUsers);
        toast({
          title: 'Database Seeded',
          description: 'User data has been replaced with the data from the table.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to seed database.',
        });
      }
    });
  };

  const handleDownloadCsv = () => {
    const csv = Papa.unparse(users);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'users_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse<User>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Cast user as any temporarily to fix CSV string nulls
          const parsedUsers = results.data.map((user: any) => ({
            ...user,
            team: user.team === 'null' || user.team === '' ? null : user.team,
            subTeam: user.subTeam === 'null' || user.subTeam === '' ? null : user.subTeam,
            phone: user.phone === 'null' || user.phone === '' ? null : user.phone,
            birthday: user.birthday === 'null' || user.birthday === '' ? undefined : user.birthday,
            linkedin: user.linkedin === 'null' || user.linkedin === '' ? null : user.linkedin,
            github: user.github === 'null' || user.github === '' ? null : user.github,
          })) as User[];
          setUsers(parsedUsers);
          toast({
            title: 'CSV Loaded',
            description: `${parsedUsers.length} users loaded into the table. Click 'Seed Database' to save.`,
          });
        },
        error: (error) => {
          toast({
            variant: 'destructive',
            title: 'CSV Parsing Error',
            description: error.message,
          });
        }
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="glass">
      <CardContent className="pt-6">
        <div className="flex justify-end gap-2 mb-4">
          <Button variant="outline" onClick={handleDownloadCsv} disabled={isPending}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
          <Button variant="outline" onClick={handleUploadClick} disabled={isPending}>
            <Upload className="mr-2 h-4 w-4" />
            Upload CSV
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept=".csv"
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isPending}>
                {isPending ? 'Seeding...' : 'Seed Database'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all existing user data and replace it with the data currently in the table. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSeedDatabase}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Avatar URL</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Sub-Team</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Birthday</TableHead>
                <TableHead>LinkedIn</TableHead>
                <TableHead>GitHub</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Input
                      value={user.name}
                      onChange={e => handleInputChange(user.id, 'name', e.target.value)}
                      className="w-40"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={user.username}
                      onChange={e => handleInputChange(user.id, 'username', e.target.value)}
                      className="w-40"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="email"
                      value={user.email}
                      onChange={e => handleInputChange(user.id, 'email', e.target.value)}
                      className="w-48"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={user.password || ''}
                      onChange={e => handleInputChange(user.id, 'password', e.target.value)}
                      className="w-40"
                      placeholder="New Password"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={user.avatar || ''}
                      onChange={e => handleInputChange(user.id, 'avatar', e.target.value)}
                      className="w-48"
                      placeholder="Avatar Image URL"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value: UserRole) => handleInputChange(user.id, 'role', value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.team || NONE_VALUE}
                      onValueChange={(value: string) => handleInputChange(user.id, 'team', value === NONE_VALUE ? null : value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team || 'null'} value={team || NONE_VALUE}>
                            {team || 'None'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.subTeam || NONE_VALUE}
                      onValueChange={(value: string) => handleInputChange(user.id, 'subTeam', value === NONE_VALUE ? null : value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select sub-team" />
                      </SelectTrigger>
                      <SelectContent>
                        {subTeams.map(subTeam => (
                          <SelectItem key={subTeam || 'null'} value={subTeam || NONE_VALUE}>
                            {subTeam || 'None'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={user.phone || ''}
                      onChange={e => handleInputChange(user.id, 'phone', e.target.value)}
                      className="w-36"
                      placeholder="e.g. +1-..."
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={user.birthday || ''}
                      onChange={e => handleInputChange(user.id, 'birthday', e.target.value)}
                      className="w-32"
                      placeholder="YYYY-MM-DD"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={user.linkedin || ''}
                      onChange={e => handleInputChange(user.id, 'linkedin', e.target.value)}
                      className="w-48"
                      placeholder="LinkedIn URL"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={user.github || ''}
                      onChange={e => handleInputChange(user.id, 'github', e.target.value)}
                      className="w-48"
                      placeholder="GitHub URL"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button onClick={() => handleSaveChanges(user.id)} disabled={isPending}>
                      {isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}