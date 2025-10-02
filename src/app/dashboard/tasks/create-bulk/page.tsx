

"use client";

import { useState, useEffect } from 'react';
import type { User } from "@/types";
import { getAllUsers } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import TaskForm from '../task-form';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function CreateBulkTaskPage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [user, users] = await Promise.all([getCurrentUser(), getAllUsers()]);
                setCurrentUser(user);
                setAllUsers(users);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>Loading...</CardTitle>
                    <CardDescription>
                        Fetching user data, please wait.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!currentUser) {
        return (
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>Permission Denied</CardTitle>
                    <CardDescription>
                        You must be logged in to create a task.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
    return (
        <TaskForm 
            formType="create-bulk"
            allUsers={allUsers}
            currentUser={currentUser}
        />
    );
}

