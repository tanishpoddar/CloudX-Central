'use server';
/**
 * @fileOverview A flow for generating structured tasks from unstructured meeting notes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAllUsers } from '@/lib/data';

const GenerateTasksInputSchema = z.object({
  notes: z.string().describe('The unstructured text from meeting notes or a document.'),
  currentUser: z.object({
    id: z.string(),
    name: z.string(),
  })
});
export type GenerateTasksInput = z.infer<typeof GenerateTasksInputSchema>;

const GeneratedTaskSchema = z.object({
  title: z.string().describe('A clear and concise title for the task.'),
  description: z.string().describe('A detailed description of what needs to be done.'),
  assigneeName: z.string().describe("The name of the person this task should be assigned to. This could be a name mentioned in the notes or 'CurrentUser' if the notes imply the person taking them is responsible. If no one is mentioned, assign to the CurrentUser."),
  dueDate: z.string().describe("The suggested due date for the task in 'YYYY-MM-DD' format. Infer this from the text (e.g., 'by next Friday', 'in two weeks'). If no date is mentioned, use a sensible default like one week from today."),
});

const GenerateTasksOutputSchema = z.object({
  tasks: z.array(GeneratedTaskSchema).describe('An array of tasks generated from the notes.'),
});
export type GenerateTasksOutput = z.infer<typeof GenerateTasksOutputSchema>;

export async function generateTasksFromNotes(input: GenerateTasksInput): Promise<GenerateTasksOutput> {
  return generateTasksFromNotesFlow(input);
}

const findUserByName = ai.defineTool(
  {
    name: 'findUserByName',
    description: 'Find a user by their name to get their ID.',
    inputSchema: z.object({ name: z.string() }),
    outputSchema: z.object({ id: z.string().optional() }),
  },
  async ({ name }) => {
    const users = await getAllUsers();
    // Simple name matching, can be improved with fuzzy search
    const foundUser = users.find(u => u.name.toLowerCase().includes(name.toLowerCase()));
    return { id: foundUser?.id };
  }
);


const prompt = ai.definePrompt({
  name: 'generateTasksFromNotesPrompt',
  tools: [findUserByName],
  input: { schema: GenerateTasksInputSchema },
  output: { schema: GenerateTasksOutputSchema },
  prompt: `You are an intelligent assistant that helps create structured tasks from unstructured meeting notes.
Today's date is ${new Date().toDateString()}.
The user providing the notes is named '{{currentUser.name}}'.

Analyze the following notes:
---
{{{notes}}}
---

Your task is to identify all distinct action items and convert them into a structured task list.
For each action item you identify:
1.  Create a clear, actionable 'title'.
2.  Write a 'description' that provides context from the notes.
3.  Determine the 'assigneeName'. If a person is mentioned, use their name. If it's unclear or says "I will do it", assign it to '{{currentUser.name}}'.
4.  Determine a 'dueDate' in 'YYYY-MM-DD' format. Infer it from phrases like "by tomorrow", "next week", etc. If no date is mentioned, set it for one week from today.

Do not create tasks for items that are already marked as done.
`,
});

const generateTasksFromNotesFlow = ai.defineFlow(
  {
    name: 'generateTasksFromNotesFlow',
    inputSchema: GenerateTasksInputSchema,
    outputSchema: GenerateTasksOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);

    if (!llmResponse.output) {
      throw new Error("LLM response output function is missing");
    }

    const generated = llmResponse.output!;

    if (!generated) {
      throw new Error("Generated output is empty or null");
    }

    // Resolve assignee names to IDs
    const resolvedTasks = await Promise.all(generated.tasks.map(async (task) => {
      let assigneeId = input.currentUser.id; // Default to current user
      if (task.assigneeName.toLowerCase() !== input.currentUser.name.toLowerCase()) {
        const user = await findUserByName({ name: task.assigneeName });
        if (user?.id) {
          assigneeId = user.id;
        }
      }
      return { ...task, assigneeId };
    }));

    return { tasks: resolvedTasks as any }; // Cast because we added assigneeId
  }
);