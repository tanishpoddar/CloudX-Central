"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { summarizeTask } from "@/ai/flows/summarize-task-flow";
import type { SummarizeTaskOutput } from "@/ai/flows/summarize-task-flow";
import { Skeleton } from "@/components/ui/skeleton";

export default function SummarizeTaskDialog({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState<SummarizeTaskOutput | null>(null);
  const { toast } = useToast();

  const handleSummarize = () => {
    setSummary(null); // Reset summary on new request
    startTransition(async () => {
      try {
        const result = await summarizeTask({ taskId });
        setSummary(result);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Summarization Failed",
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
        });
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleSummarize}>
          <Sparkles className="mr-2 h-4 w-4" />
          Summarize
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot /> AI Summary
          </DialogTitle>
          <DialogDescription>
            A concise overview of the task's history and key points.
          </DialogDescription>
        </DialogHeader>
        {isPending ? (
          <div className="space-y-6 py-4">
             <div>
                <Skeleton className="h-6 w-1/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
             </div>
             <div>
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
             </div>
             <div>
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-full" />
             </div>
          </div>
        ) : summary ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <h4>Summary</h4>
            <p>{summary.summary}</p>
            
            {summary.keyDecisions?.length > 0 && (
                <>
                    <h4>Key Decisions</h4>
                    <ul>
                        {summary.keyDecisions.map((decision, i) => <li key={`d-${i}`}>{decision}</li>)}
                    </ul>
                </>
            )}

            {summary.actionItems?.length > 0 && (
                <>
                    <h4>Action Items</h4>
                    <ul>
                        {summary.actionItems.map((item, i) => <li key={`a-${i}`}>{item}</li>)}
                    </ul>
                </>
            )}
          </div>
        ) : (
           <p className="py-8 text-center text-muted-foreground">Click "Summarize" to generate an AI summary.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
