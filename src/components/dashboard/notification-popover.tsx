
'use client';

import { useEffect, useState, useTransition } from "react";
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { User, Notification } from '@/types';
import { getAllUsers, getNotificationsForUser } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from "../ui/skeleton";


const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'TASK_ASSIGNED':
            return <Bell className="h-5 w-5 text-blue-500" />;
        case 'STATUS_UPDATED':
            return <Bell className="h-5 w-5 text-green-500" />;
        case 'COMMENT_ADDED':
            return <Bell className="h-5 w-5 text-purple-500" />;
        case 'DEADLINE_APPROACHING':
            return <Bell className="h-5 w-5 text-yellow-500" />;
        default:
            return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
}

type EnrichedNotification = Notification & { actorName: string };

export function NotificationPopover({ user }: { user: User }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<EnrichedNotification[]>([]);
    const [isLoading, startLoading] = useTransition();

    const fetchNotifications = async () => {
        if (!user) return;
        startLoading(async () => {
            const [userNotifications, allUsers] = await Promise.all([
                getNotificationsForUser(user.id),
                getAllUsers(),
            ]);

            const enriched = userNotifications.map(notification => {
                const actor = allUsers.find(u => u.id === notification.actorId);
                return {
                    ...notification,
                    actorName: actor?.name || 'System',
                };
            }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setNotifications(enriched);
        });
    }

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, user.id]);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Toggle notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4">
                    <h4 className="text-sm font-medium leading-none">Notifications</h4>
                </div>
                <ScrollArea className="max-h-[24rem]">
                    {isLoading ? (
                        <div className="p-4 space-y-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="space-y-1">
                        {notifications.map((notification, index) => (
                             <div key={notification.id}>
                                <Link href={notification.link} className="hover:bg-muted/50 block" onClick={() => setIsOpen(false)}>
                                    <div className="flex items-start gap-3 p-4">
                                        {getNotificationIcon(notification.type)}
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm" dangerouslySetInnerHTML={{ __html: notification.message }} />
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                                {index < notifications.length - 1 && <Separator />}
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-24">
                            <p className="text-sm text-muted-foreground">No new notifications.</p>
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
