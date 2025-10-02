import { getAllUsers } from '@/lib/data';
import UsersClient from './users-client';

export default async function UsersPage() {
  const users = await getAllUsers();

  return <UsersClient users={users} />;
}
