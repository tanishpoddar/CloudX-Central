
import AnnouncementForm from "../../announcement-form";
import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";


export default async function CreateAnnouncementPage() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect('/login');
    }

    const canPost = ['Co-founder', 'Secretary', 'Chair of Directors'].includes(currentUser.role);

    if (!canPost) {
        redirect('/dashboard/announcements');
    }
    
    return (
        <div className="max-w-3xl mx-auto">
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Create Announcement</CardTitle>
                    <CardDescription>
                        Share an update with the entire organization. Your post will be visible to everyone.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AnnouncementForm currentUser={currentUser} />
                </CardContent>
            </Card>
        </div>
    )
}
