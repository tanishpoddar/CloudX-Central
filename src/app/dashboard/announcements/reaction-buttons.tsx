'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmilePlus } from 'lucide-react';
import { addAnnouncementReaction } from '../actions';
import type { AnnouncementReaction, User } from '@/types';
import { cn } from '@/lib/utils';

const availableEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface ReactionButtonsProps {
    announcementId: string;
    reactions: AnnouncementReaction[];
    currentUser: User;
}

export function ReactionButtons({ announcementId, reactions, currentUser }: ReactionButtonsProps) {
    const [, startTransition] = useTransition();

    const handleReaction = (emoji: string) => {
        startTransition(async () => {
            await addAnnouncementReaction(announcementId, emoji);
        });
    }

    const groupedReactions = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction.userId);
        return acc;
    }, {} as Record<string, string[]>);

    return (
        <div className="flex items-center gap-2">
            {Object.entries(groupedReactions).map(([emoji, userIds]) => {
                const userHasReacted = userIds.includes(currentUser.id);
                return (
                     <Button 
                        key={emoji} 
                        variant={userHasReacted ? 'secondary' : 'outline'}
                        size="sm"
                        className={cn("px-3 h-8", userHasReacted && "border-primary")}
                        onClick={() => handleReaction(emoji)}
                    >
                        <span className="text-lg mr-2">{emoji}</span> {userIds.length}
                    </Button>
                )
            })}

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <SmilePlus className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto">
                    <div className="flex gap-1">
                        {availableEmojis.map(emoji => (
                             <Button 
                                key={emoji} 
                                variant="ghost" 
                                size="icon" 
                                className="text-xl"
                                onClick={() => handleReaction(emoji)}
                            >
                                {emoji}
                            </Button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
