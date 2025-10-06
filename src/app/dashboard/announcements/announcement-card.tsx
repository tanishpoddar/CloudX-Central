
'use client';

import type { User, Announcement, AnnouncementComment, AnnouncementReaction, PollVote } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link as LinkIcon, MessageCircle } from 'lucide-react';
import Link from "next/link";
import { PollDisplay } from "./poll-display";
import { ReactionButtons } from "./reaction-buttons";
import { CommentSection } from "./comment-section";

type EnrichedAnnouncement = Announcement & {
    author: User | undefined;
    comments: AnnouncementComment[];
    reactions: AnnouncementReaction[];
    pollVotes: PollVote[];
};

interface AnnouncementCardProps {
    announcement: EnrichedAnnouncement;
    currentUser: User;
    userMap: Map<string, User>;
}

export function AnnouncementCard({ announcement, currentUser, userMap }: AnnouncementCardProps) {
    
    return (
        <Card id={announcement.id} className="glass">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src={announcement.author?.avatar ?? undefined} alt={announcement.author?.name} />
                            <AvatarFallback>{announcement.author?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle>{announcement.title}</CardTitle>
                            <CardDescription>
                                Posted by {announcement.author?.name} - {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap">{announcement.content}</p>

                {announcement.links && announcement.links.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Related Links</h4>
                        <div className="flex flex-col gap-2">
                        {announcement.links.map((link, index) => (
                            <a key={index} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                                <LinkIcon className="h-4 w-4" />
                                <span className="truncate">{link}</span>
                            </a>
                        ))}
                        </div>
                    </div>
                )}
                
                {announcement.poll && (
                    <PollDisplay 
                        announcementId={announcement.id}
                        poll={announcement.poll}
                        votes={announcement.pollVotes}
                        currentUser={currentUser}
                    />
                )}
                
            </CardContent>
             <CardFooter className="flex flex-col items-start gap-4">
                <ReactionButtons 
                    announcementId={announcement.id}
                    reactions={announcement.reactions}
                    currentUser={currentUser}
                />
                <Separator className="w-full" />
                <CommentSection 
                    announcementId={announcement.id}
                    comments={announcement.comments}
                    currentUser={currentUser}
                    userMap={userMap}
                />
            </CardFooter>
        </Card>
    )
}
