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

interface PollDisplayProps {
    announcementId: string;
    poll: Poll;
    votes: PollVote[];
    currentUser: User;
}

export function PollDisplay({ announcementId, poll, votes, currentUser }: PollDisplayProps) {
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
                    {poll.options.map(option => {
                        const optionVotes = votes.filter(v => v.optionId === option.id).length;
                        const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
                        const isUserChoice = userVote.optionId === option.id;

                        return (
                            <div key={option.id}>
                                <div className="flex justify-between text-sm mb-1">
                                    <p className={cn("font-medium", isUserChoice && "text-primary")}>{option.text}</p>
                                    <p className="text-muted-foreground">{Math.round(percentage)}% ({optionVotes})</p>
                                </div>
                                <Progress value={percentage} />
                            </div>
                        )
                    })}
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
