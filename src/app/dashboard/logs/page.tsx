
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';
import { getAllUsers, getAllLogs } from '@/lib/data';
import LogsClient from './logs-client';


export default async function LogsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const users = await getAllUsers();
  const allLogs = await getAllLogs();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Logs</CardTitle>
        <CardDescription>
          A history of relevant actions and updates based on your role.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LogsClient currentUser={currentUser} allUsers={users} allLogs={allLogs} />
      </CardContent>
    </Card>
  );
}
