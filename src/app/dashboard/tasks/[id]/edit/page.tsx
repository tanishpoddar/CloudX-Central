import { getTaskById, getAllUsers } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import TaskForm from "../../task-form";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EditTaskPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  // If you need searchParams, you can await them similarly:
  // const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const [task, users, currentUser] = await Promise.all([
    getTaskById(resolvedParams.id),
    getAllUsers(),
    getCurrentUser(),
  ]);

  if (!task || !currentUser) {
    notFound();
  }

  const isAssigner = currentUser.id === task.assignedById;
  const isPresidium = currentUser.role === "Co-founder" || currentUser.role === "Secretary";

  if (!isAssigner && !isPresidium) {
    redirect("/dashboard/tasks");
  }

  return (
    <TaskForm
      formType="edit"
      task={task}
      allUsers={users}
      currentUser={currentUser}
    />
  );
}