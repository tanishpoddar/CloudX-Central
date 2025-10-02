'use server';
/**
 * @fileOverview A flow for summarizing task activity.
 */

import { ai } from '@/ai/genkit';
import { getCommentsForTask, getLogsForTask, getTaskById, getAllUsers } from '@/lib/data';
import { z } from 'zod';
import { format } from 'date-fns';

const SummarizeTaskInputSchema = z.object({
  taskId: z.string(),
});
export type SummarizeTaskInput = z.infer<typeof SummarizeTaskInputSchema>;

const SummarizeTaskOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the task history and current status.'),
  keyDecisions: z.array(z.string()).describe('A list of key decisions made.'),
  actionItems: z.array(z.string()).describe('A list of outstanding action items.'),
});
export type SummarizeTaskOutput = z.infer<typeof SummarizeTaskOutputSchema>;

export async function summarizeTask(input: SummarizeTaskInput): Promise<SummarizeTaskOutput> {
  return summarizeTaskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTaskPrompt',
  input: { schema: z.string() },
  output: { schema: SummarizeTaskOutputSchema },
  prompt: `You are an expert project manager. Your goal is to provide a clear and concise summary of a task's history for someone who is new to the task.

Analyze the following task information and its history, which includes comments and activity logs.

{{{input}}}

Based on all the provided information, please generate the following:
1.  **Summary:** A brief overview of what the task is about, its progress, and its current state.
2.  **Key Decisions:** A bulleted list of the most important decisions that have been made.
3.  **Action Items:** A bulleted list of any outstanding actions that need to be taken.

Focus on clarity and conciseness. The output should be easy to understand for someone with no prior context.
`,
});

const summarizeTaskFlow = ai.defineFlow(
  {
    name: 'summarizeTaskFlow',
    inputSchema: SummarizeTaskInputSchema,
    outputSchema: SummarizeTaskOutputSchema,
  },
  async ({ taskId }) => {
    const [task, comments, logs, users] = await Promise.all([
      getTaskById(taskId),
      getCommentsForTask(taskId),
      getLogsForTask(taskId),
      getAllUsers(),
    ]);

    if (!task) {
      throw new Error('Task not found');
    }

    const userMap = new Map(users.map(u => [u.id, u.name]));

    const formattedComments = comments.map(c => `[${format(new Date(c.createdAt), 'yyyy-MM-dd HH:mm')}] Comment by ${userMap.get(c.userId) || 'Unknown'}: ${c.message}`);
    const formattedLogs = logs.map(l => `[${format(new Date(l.timestamp), 'yyyy-MM-dd HH:mm')}] Log: ${l.message}`);

    const history = [...formattedComments, ...formattedLogs]
      .sort((a, b) => new Date(a.substring(1, 17)).getTime() - new Date(b.substring(1, 17)).getTime())
      .join('\n');
      
    const fullPrompt = `
**Task Details:**
- Title: ${task.title}
- Description: ${task.description}
- Current Status: ${task.status}

**Task History (Comments and Logs):**
${history || 'No comments or logs for this task yet.'}
`;

    const { output } = await prompt(fullPrompt);

    return output!;
  }
);
