
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import EditProfileForm from './edit-profile-form';

export default async function EditProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    notFound();
  }

  return (
    <Card className="max-w-2xl mx-auto glass">
      <CardHeader>
        <CardTitle>Edit Your Profile</CardTitle>
        <CardDescription>
          Update your personal and professional information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EditProfileForm user={currentUser} />
      </CardContent>
    </Card>
  );
}
