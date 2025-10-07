'use client';

import React, { useMemo, useState, useEffect } from 'react';
import type { User, Log } from '@/types';
import { getSubordinates } from '@/lib/hierarchy';
import { useSearchParams } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface LogsClientProps {
  currentUser: User;
  allUsers: User[];
  allLogs: Log[];
}

export default function LogsClient({ currentUser, allUsers, allLogs }: LogsClientProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const enrichedLogs = useMemo(() => {
    const getVisibleLogs = (currentUser: User, logs: Log[], allUsers: User[]): Promise<Log[]> => {
      const { role, id } = currentUser;

      if (role === 'Co-founder' || role === 'Secretary') {
        return Promise.resolve(logs);
      }
      
      return getSubordinates(id, allUsers).then(subordinateIds => {
        const visibleUserIds = new Set([id, ...subordinateIds]);
        return logs.filter(log => visibleUserIds.has(log.userId));
      });
    };

    return getVisibleLogs(currentUser, allLogs, allUsers).then(visibleLogs => {
      let filteredLogs = visibleLogs;

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filteredLogs = visibleLogs.filter(log =>
          log.message.toLowerCase().includes(searchLower) ||
          allUsers.find(u => u.id === log.userId)?.name.toLowerCase().includes(searchLower)
        );
      }
      
      return filteredLogs
        .map(log => {
          const user = allUsers.find(u => u.id === log.userId);
          return {
            ...log,
            userName: user?.name || 'System',
            userAvatar: user?.avatar,
          };
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
  }, [currentUser, allLogs, allUsers, searchQuery]);

  const [logs, setLogs] = useState<Awaited<typeof enrichedLogs>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    enrichedLogs.then(resolvedLogs => {
      setLogs(resolvedLogs);
      setLoading(false);
    });
  }, [enrichedLogs]);

  if (loading) {
    return <p>Loading logs...</p>;
  }

  return (
    <ScrollArea className="h-[60vh]">
      <div className="space-y-4">
        {logs.map((log, index) => (
          <div key={log.id}>
            <div className="flex items-start gap-4 p-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={log.userAvatar ?? undefined} alt={log.userName} />
                <AvatarFallback>
                  {log.userName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{log.userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: log.message }} />
              </div>
            </div>
            {index < logs.length - 1 && <Separator />}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            No logs to display.
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
