'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateTasksFromNotes } from '@/ai/flows/generate-tasks-from-notes-flow';
import { addTask } from '../tasks/actions';
import { Bot, Check, Copy, Sparkles, User, Calendar, FileText } from 'lucide-react';
import type { User as CurrentUserType } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

type GeneratedTask = {
  title: string;
  description: string;
  assigneeName: string;
  assigneeId: string;
  dueDate: string;
};

export default function GenerateTasksPage() {
  const [notes, setNotes] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [isGenerating, startGenerating] = useTransition();
  const [isCreating, startCreating] = useTransition();
  const [createdTaskIndexes, setCreatedTaskIndexes] = useState<number[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUserType | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    async function fetchUser() {
        const user = await getCurrentUser();
        setCurrentUser(user);
    }
    fetchUser();
  }, [])


  const handleGenerateTasks = () => {
    if (!notes.trim() || !currentUser) return;
    setGeneratedTasks([]);
    setCreatedTaskIndexes([]);

    startGenerating(async () => {
      try {
        const result = await generateTasksFromNotes({
            notes,
            currentUser: { id: currentUser.id, name: currentUser.name },
        });
        setGeneratedTasks(result.tasks as GeneratedTask[]);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        });
      }
    });
  };

  const handleCreateTask = (task: GeneratedTask, index: number) => {
    startCreating(async () => {
        try {
            const formData = new FormData();
            formData.append('title', task.title);
            formData.append('description', task.description);
            formData.append('assignedToIds[]', task.assigneeId);
            formData.append('dueDate', new Date(task.dueDate).toISOString());

            await addTask(formData);
            
            toast({
                title: 'Task Created',
                description: `"${task.title}" has been added to the task list.`,
            });
            setCreatedTaskIndexes(prev => [...prev, index]);

        } catch (error) {
             if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
                // This is expected after successful creation
                setCreatedTaskIndexes(prev => [...prev, index]);
                return;
            }
            toast({
                variant: "destructive",
                title: "Error Creating Task",
                description: error instanceof Error ? error.message : 'An unknown error occurred.',
            });
        }
    });
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText />
            Meeting Notes Input
          </CardTitle>
          <CardDescription>
            Paste your meeting minutes or any unstructured text below. The AI will identify action items and suggest tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your notes here..."
            rows={20}
            className="text-base"
          />
          <Button onClick={handleGenerateTasks} disabled={isGenerating || !notes.trim()}>
            <Sparkles className="mr-2 h-4 w-4" />
            {isGenerating ? 'Analyzing Notes...' : 'Generate Tasks'}
          </Button>
        </CardContent>
      </Card>
      
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot />
            Suggested Tasks
          </CardTitle>
          <CardDescription>
            Review the tasks identified by the AI. Click "Create Task" to add them to your project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isGenerating ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : generatedTasks.length > 0 ? (
            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
            {generatedTasks.map((task, index) => (
              <Card key={index} className="bg-background/50">
                <CardHeader>
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{task.assigneeName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(parseISO(task.dueDate), 'PPP')}</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    {createdTaskIndexes.includes(index) ? (
                        <Badge variant="secondary" className="flex items-center gap-2">
                            <Check className="h-4 w-4" /> Created
                        </Badge>
                    ) : (
                        <Button size="sm" onClick={() => handleCreateTask(task, index)} disabled={isCreating}>
                           {isCreating ? 'Creating...' : 'Create Task'}
                        </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 rounded-lg border border-dashed text-center">
              <p className="text-muted-foreground">
                Your suggested tasks will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
