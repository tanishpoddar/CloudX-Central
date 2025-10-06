
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
import { seedUsers } from './actions';
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
import { Download, Upload, PlusCircle, Trash2 } from 'lucide-react';
import Papa from 'papaparse';

const roles: UserRole[] = ['Co-founder', 'Secretary', 'Chair of Directors', 'Lead', 'Member'];
const teams: (Team | null | string)[] = ['Presidium', 'Technology', 'Corporate', 'Creatives', null];
const subTeams: (SubTeam | null | string)[] = [
    'dev', 'ui-ux', 'aiml', 'cloud', 'iot',
    'events', 'ops', 'pr', 'sponsorship',
    'digital-design', 'media', null
];
const NONE_VALUE = "__NONE__";
const userTemplateKeys: (keyof User)[] = ['id', 'name', 'username', 'email', 'password', 'avatar', 'role', 'team', 'subTeam', 'phone', 'birthday', 'linkedin', 'github'];

export default function AdminClient({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getNextUserId = () => {
    const existingIds = users.map(u => {
        if (u.id && u.id.startsWith('user-')) {
            const num = parseInt(u.id.split('-')[1], 10);
            return isNaN(num) ? 0 : num;
        }
        return 0;
    });
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    return `user-${maxId + 1}`;
  };

  const handleInputChange = (userId: string, field: keyof User, value: string | null) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, [field]: value === NONE_VALUE ? null : value } : user
      )
    );
  };
  
  const handleAddNewUser = () => {
    const newUser: User = {
      id: getNextUserId(),
      name: '',
      username: '',
      email: '',
      password: '',
      avatar: '',
      role: 'Member',
      team: null,
      subTeam: null,
      phone: null,
      birthday: null,
      linkedin: null,
      github: null,
    };
    setUsers(prev => [newUser, ...prev]);
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  }

  const handleSeedDatabase = () => {
    startTransition(async () => {
      try {
        const usersJson = JSON.stringify(users);
        const newUsers = await seedUsers(usersJson);
        setUsers(newUsers);
        toast({
          title: 'Database Seeded',
          description: 'User data has been replaced with the data from the table.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error Seeding Database',
          description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
      }
    });
  };

  const handleDownloadCsv = (templateOnly: boolean) => {
    const data = templateOnly ? [] : users.map(user => {
      const userForCsv: Partial<User> = {};
      userTemplateKeys.forEach(key => {
        userForCsv[key] = user[key] ?? '';
      });
      return userForCsv;
    });

    const csv = Papa.unparse({
        fields: userTemplateKeys,
        data: data as any,
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', templateOnly ? 'users_template.csv' : 'users_export.csv');
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
            let nextIdNumber = users.reduce((max, u) => {
                if (u.id && u.id.startsWith('user-')) {
                    const num = parseInt(u.id.split('-')[1], 10);
                    return isNaN(num) ? max : Math.max(max, num);
                }
                return max;
            }, 0) + 1;

          const parsedUsers = results.data.map((user: any) => {
            const newUser: any = {};
            for (const key in user) {
                const value = user[key];
                newUser[key] = value === 'null' || value === '' ? null : value;
            }
            if (!newUser.id || !newUser.id.startsWith('user-')) {
                newUser.id = `user-${nextIdNumber++}`;
            }
            return newUser as User;
          });
          setUsers(prev => [...prev, ...parsedUsers]);
          toast({
            title: 'CSV Imported',
            description: `${parsedUsers.length} users loaded into the table. Review and click 'Seed Database' to save.`,
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
     if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="glass">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
           <Button variant="outline" onClick={handleAddNewUser} disabled={isPending}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>
          <Button variant="outline" onClick={() => handleDownloadCsv(true)} disabled={isPending}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
          <Button variant="outline" onClick={() => handleDownloadCsv(false)} disabled={isPending}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleUploadClick} disabled={isPending}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
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
                  This will **delete all existing user data** and replace it with the data currently in the table. This action cannot be undone.
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
                <TableHead>ID</TableHead>
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
                  <TableCell className="w-28 text-muted-foreground">{user.id}</TableCell>
                  <TableCell>
                    <Input
                      value={user.name || ''}
                      onChange={e => handleInputChange(user.id, 'name', e.target.value)}
                      className="w-40"
                      placeholder="Full Name"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={user.username || ''}
                      onChange={e => handleInputChange(user.id, 'username', e.target.value)}
                      className="w-40"
                       placeholder="Username"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="email"
                      value={user.email || ''}
                      onChange={e => handleInputChange(user.id, 'email', e.target.value)}
                      className="w-48"
                       placeholder="Email Address"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={user.password || ''}
                      onChange={e => handleInputChange(user.id, 'password', e.target.value)}
                      className="w-40"
                      placeholder="Required"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={user.avatar || ''}
                      onChange={e => handleInputChange(user.id, 'avatar', e.target.value)}
                      className="w-48"
                      placeholder="Avatar Image URL (Optional)"
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
                          <SelectItem key={team ?? 'null'} value={team || NONE_VALUE}>
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
                          <SelectItem key={subTeam ?? 'null-subteam'} value={subTeam || NONE_VALUE}>
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
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} disabled={isPending}>
                      <Trash2 className="h-4 w-4 text-destructive" />
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
