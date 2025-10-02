import { getCurrentUser } from "@/lib/auth";
import { getAllUsers } from "@/lib/data";
import { redirect } from "next/navigation";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import AdminClient from "./admin-client";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const authorizedRoles: (string | undefined)[] = ['Co-founder', 'Secretary', 'Chair of Directors'];
  if (!authorizedRoles.includes(currentUser.role)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You do not have permission to view this page.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>
            Manage user data and application settings.
          </CardDescription>
        </CardHeader>
      </Card>
      <AdminClient users={users} />
    </div>
  );
}
