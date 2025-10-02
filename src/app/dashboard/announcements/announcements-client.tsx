
'use client';

import type { User, Announcement, AnnouncementComment, AnnouncementReaction, PollVote, Team } from "@/types";
import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AnnouncementCard } from "./announcement-card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface AnnouncementsClientProps {
    currentUser: User;
    initialAnnouncements: Announcement[];
    users: User[];
    initialComments: AnnouncementComment[];
    initialReactions: AnnouncementReaction[];
    initialPollVotes: PollVote[];
}

export default function AnnouncementsClient({ 
    currentUser,
    initialAnnouncements,
    users,
    initialComments,
    initialReactions,
    initialPollVotes
}: AnnouncementsClientProps) {

    const canPost = ['Co-founder', 'Secretary', 'Chair of Directors'].includes(currentUser.role);
    const userMap = new Map(users.map(u => [u.id, u]));

    const visibleAnnouncements = initialAnnouncements.filter(announcement => {
        // Org-wide announcements are always visible
        if (!announcement.targetDomains || announcement.targetDomains.length === 0) {
            return true;
        }
        // If targeted, check if the user's team is in the list
        return currentUser.team && announcement.targetDomains.includes(currentUser.team);
    });

    const enrichedAnnouncements = visibleAnnouncements.map(announcement => {
        const author = userMap.get(announcement.authorId);
        const comments = initialComments.filter(c => c.announcementId === announcement.id);
        const reactions = initialReactions.filter(r => r.announcementId === announcement.id);
        const pollVotes = initialPollVotes.filter(v => v.announcementId === announcement.id);
        
        return {
            ...announcement,
            author,
            comments,
            reactions,
            pollVotes,
        }
    })

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
             <Card className="glass">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Announcements</CardTitle>
                            <CardDescription>
                                Stay up-to-date with the latest news and updates from the organization.
                            </CardDescription>
                        </div>
                        {canPost && (
                            <Button asChild>
                                <Link href="/dashboard/announcements/create">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Announcement
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardHeader>
            </Card>
            
            <div className="space-y-6">
                {enrichedAnnouncements.map(item => (
                    <AnnouncementCard 
                        key={item.id}
                        announcement={item}
                        currentUser={currentUser}
                        userMap={userMap}
                    />
                ))}
            </div>

             {enrichedAnnouncements.length === 0 && (
                <Card className="glass">
                    <CardHeader>
                        <p className="text-center text-muted-foreground">No announcements yet.</p>
                    </CardHeader>
                </Card>
            )}
        </div>
    )
}
