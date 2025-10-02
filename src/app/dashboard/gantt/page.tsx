import { getAllTasks } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import GanttChartClient from './gantt-client';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export default async function GanttPage() {
    const currentUser = await getCurrentUser();
    if (!currentUser) return null;

    const allTasks = await getAllTasks();

    return (
        <div className="space-y-6">
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Project Timeline</CardTitle>
                    <CardDescription>
                        A Gantt chart visualizing project schedules, task dependencies, and deadlines over time.
                    </CardDescription>
                </CardHeader>
            </Card>
            <GanttChartClient tasks={allTasks} />
        </div>
    )
}