
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { Poll, PollVote, User } from '@/types';
import { submitPollVote } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


interface PollDisplayProps {
    announcementId: string;
    poll: Poll;
    votes: PollVote[];
    currentUser: User;
    userMap: Map<string, User>;
}

export function PollDisplay({ announcementId, poll, votes, currentUser, userMap }: PollDisplayProps) {
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const userVote = votes.find(v => v.userId === currentUser.id);
    const totalVotes = votes.length;

    const handleVote = () => {
        if (!selectedOptionId) return;

        startTransition(async () => {
            try {
                await submitPollVote(announcementId, selectedOptionId);
                toast({ title: "Vote submitted!" });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error submitting vote.' });
            }
        });
    }

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <h4 className="font-semibold">{poll.question}</h4>
            
            {userVote ? (
                // Show results
                <div className="space-y-3">
                    <TooltipProvider>
                        {poll.options.map(option => {
                            const optionVotes = votes.filter(v => v.optionId === option.id);
                            const optionVoteCount = optionVotes.length;
                            const percentage = totalVotes > 0 ? (optionVoteCount / totalVotes) * 100 : 0;
                            const isUserChoice = userVote.optionId === option.id;

                            return (
                                <div key={option.id}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <p className={cn("font-medium", isUserChoice && "text-primary")}>{option.text}</p>
                                        <p className="text-muted-foreground">{Math.round(percentage)}% ({optionVoteCount})</p>
                                    </div>
                                    <Progress value={percentage} />
                                     <div className="flex flex-wrap items-center gap-2 mt-2">
                                        {optionVotes.map(vote => {
                                            const voter = userMap.get(vote.userId);
                                            if (!voter) return null;
                                            return (
                                                <Tooltip key={vote.userId}>
                                                    <TooltipTrigger>
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={voter.avatar ?? undefined} alt={voter.name} />
                                                            <AvatarFallback>{voter.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{voter.name}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </TooltipProvider>
                </div>
            ) : (
                // Show voting options
                <div className="space-y-4">
                     <RadioGroup onValueChange={setSelectedOptionId} value={selectedOptionId ?? undefined}>
                        {poll.options.map(option => (
                             <div key={option.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.id} id={`${announcementId}-${option.id}`} />
                                <Label htmlFor={`${announcementId}-${option.id}`}>{option.text}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                    <Button onClick={handleVote} disabled={isPending || !selectedOptionId}>
                        {isPending ? "Voting..." : "Submit Vote"}
                    </Button>
                </div>
            )}
        </div>
    );
}
