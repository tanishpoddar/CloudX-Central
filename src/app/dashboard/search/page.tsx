import { Suspense } from 'react';
import { 
    searchUsers, 
    searchTasks, 
    searchAnnouncements,
    getAllUsers, 
} from '@/lib/data';
import SearchClient from './search-client';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function SearchLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export default async function SearchPage({ searchParams }: any) {
  const query = searchParams?.q || '';

  if (!query) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle>Global Search</CardTitle>
          <CardDescription>
            Please enter a search term in the header to find users, tasks, and announcements.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const [userResults, taskResults, announcementResults, allUsers] = await Promise.all([
    searchUsers(query),
    searchTasks(query),
    searchAnnouncements(query),
    getAllUsers(),
  ]);

  return (
    <div>
      <Card className="glass mb-8">
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
          <CardDescription>
            Found {userResults.length + taskResults.length + announcementResults.length} results for &quot;{query}&quot;
          </CardDescription>
        </CardHeader>
      </Card>
      <Suspense fallback={<SearchLoading />}>
        <SearchClient 
          users={userResults}
          tasks={taskResults}
          announcements={announcementResults}
          allUsers={allUsers}
        />
      </Suspense>
    </div>
  );
}