
import { getCurrentUser } from "@/lib/auth";
import { getAllUsers } from "@/lib/data";
import { redirect } from "next/navigation";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import TrackerClient from "./tracker-client";

export default async function TrackerPage() {
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

  const allUsers = await getAllUsers();

  return (
    <div className="space-y-6">
       <Card className="glass">
        <CardHeader>
          <CardTitle>Submission Tracker</CardTitle>
          <CardDescription>
            Track form submissions by providing a public Google Sheet CSV link.
          </CardDescription>
        </CardHeader>
      </Card>
      <TrackerClient allUsers={allUsers} />
    </div>
  );
}
