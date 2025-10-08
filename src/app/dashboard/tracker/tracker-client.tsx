
'use client';

import { useState, useMemo } from 'react';
import type { User, Team } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle, Users, FileDiff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

type TrackingStatus = 'submitted' | 'not_submitted';
type TrackingResult = {
  user: User;
  status: TrackingStatus;
};

const TEAMS: Team[] = ['Technology', 'Corporate', 'Creatives'];


function SubmissionTracker({ allUsers }: { allUsers: User[] }) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Team | 'All'>('All');
  const { toast } = useToast();

  const handleTrackSubmissions = async () => {
    if (!sheetUrl.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please provide a Google Sheet CSV URL.',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setTrackingData(null);

    try {
      const response = await fetch(sheetUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch the CSV data. Please check the URL and sharing settings.');
      }
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const sheetData = results.data as any[];

          if (sheetData.length === 0) {
            throw new Error("CSV is empty or could not be parsed correctly.");
          }

          const headerMap: { [key: string]: string } = {};
          const headers = Object.keys(sheetData[0]);
          const possibleEmailHeaders = ['email', 'email address'];
          const possibleNameHeaders = ['name', 'full name'];
          const possiblePhoneHeaders = ['phone', 'phone number'];
          const possibleRegNoHeaders = ['regno', 'reg no', 'registration no', 'registration number'];

          headerMap.email = headers.find(h => possibleEmailHeaders.includes(h.toLowerCase())) || '';
          headerMap.name = headers.find(h => possibleNameHeaders.includes(h.toLowerCase())) || '';
          headerMap.phone = headers.find(h => possiblePhoneHeaders.includes(h.toLowerCase())) || '';
          headerMap.regNo = headers.find(h => possibleRegNoHeaders.includes(h.toLowerCase())) || '';

          const submittedIdentifiers = new Set<string>();

          sheetData.forEach(row => {
            if (headerMap.email && row[headerMap.email]) submittedIdentifiers.add(String(row[headerMap.email]).trim().toLowerCase());
            if (headerMap.name && row[headerMap.name]) submittedIdentifiers.add(String(row[headerMap.name]).trim().toLowerCase());
            if (headerMap.phone && row[headerMap.phone]) submittedIdentifiers.add(String(row[headerMap.phone]).trim().replace(/\s/g, ''));
            if (headerMap.regNo && row[headerMap.regNo]) submittedIdentifiers.add(String(row[headerMap.regNo]).trim().toLowerCase());
          });
          
          if (submittedIdentifiers.size === 0) {
            throw new Error("No identifying data (Email, Name, Phone, RegNo) found in the sheet. Please check your column headers.");
          }

          const data = allUsers
            .filter(user => user.role !== 'Co-founder' && user.role !== 'Secretary')
            .map(user => {
              const isSubmitted = 
                submittedIdentifiers.has(user.email.toLowerCase()) ||
                submittedIdentifiers.has(user.name.toLowerCase()) ||
                (user.phone && submittedIdentifiers.has(user.phone.replace(/\s/g, ''))) ||
                (user.regNo && submittedIdentifiers.has(user.regNo.toLowerCase()));

              const status: TrackingStatus = isSubmitted ? 'submitted' : 'not_submitted';
              return { user, status };
            });
          
          setTrackingData(data);
          toast({
            title: 'Tracking Complete',
            description: `Found ${submittedIdentifiers.size} unique entries in the sheet.`,
          });
        },
        error: (err: any) => {
          throw new Error(`CSV Parsing Error: ${err.message}`);
        }
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Tracking Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!trackingData) return { submitted: [], not_submitted: [] };

    const filtered = activeFilter === 'All'
      ? trackingData
      : trackingData.filter(item => item.user.team === activeFilter);
    
    return {
      submitted: filtered.filter(item => item.status === 'submitted'),
      not_submitted: filtered.filter(item => item.status === 'not_submitted'),
    };
  }, [trackingData, activeFilter]);

  const renderUserList = (users: TrackingResult[]) => (
     <ScrollArea className="h-96">
      <div className="space-y-4 pr-4">
        {users.map(({ user }) => (
          <div key={user.id} className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
              <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {user.team && <p className="text-sm text-muted-foreground">{user.team}</p>}
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <label htmlFor="sheet-url" className="text-sm font-medium">
              Google Sheet Publish URL (CSV)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="sheet-url"
                placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                disabled={isLoading}
              />
              <Button onClick={handleTrackSubmissions} disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? 'Tracking...' : 'Track Submissions'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              In Google Sheets, go to File &gt; Share &gt; Publish to web. Publish as a CSV file and paste the link here.
            </p>
          </div>
          {error && (
             <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {trackingData && (
        <>
          <div className="flex items-center justify-center">
            <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as Team | 'All')}>
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                <TabsTrigger value="All">All</TabsTrigger>
                {TEAMS.map(team => (
                  <TabsTrigger key={team} value={team}>{team}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
             <Card className="glass">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                            <CardTitle>Submitted ({filteredData.submitted.length})</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredData.submitted.length > 0 ? (
                        renderUserList(filteredData.submitted)
                    ) : (
                        <div className="flex items-center justify-center h-40 text-muted-foreground">
                           <p>No submitted users in this filter.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card className="glass">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <XCircle className="h-6 w-6 text-destructive" />
                            <CardTitle>Not Submitted ({filteredData.not_submitted.length})</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredData.not_submitted.length > 0 ? (
                        renderUserList(filteredData.not_submitted)
                    ) : (
                        <div className="flex items-center justify-center h-40 text-muted-foreground">
                           <p>All users in this filter have submitted!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function SheetComparator() {
  const [sheetAUrl, setSheetAUrl] = useState('');
  const [sheetBUrl, setSheetBUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingEntries, setMissingEntries] = useState<any[] | null>(null);
  const { toast } = useToast();

  const parseSheet = async (url: string): Promise<any[]> => {
    if (!url.trim()) throw new Error('URL is empty.');
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch from ${url}`);
    const csvText = await response.text();
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (err: any) => reject(new Error(`CSV Parsing Error: ${err.message}`)),
      });
    });
  };

  const getIdentifiers = (row: any, headerMap: Record<string, string>): Set<string> => {
    const identifiers = new Set<string>();
    if (headerMap.email && row[headerMap.email]) identifiers.add(String(row[headerMap.email]).trim().toLowerCase());
    if (headerMap.name && row[headerMap.name]) identifiers.add(String(row[headerMap.name]).trim().toLowerCase());
    if (headerMap.phone && row[headerMap.phone]) identifiers.add(String(row[headerMap.phone]).trim().replace(/\s/g, ''));
    if (headerMap.regNo && row[headerMap.regNo]) identifiers.add(String(row[headerMap.regNo]).trim().toLowerCase());
    return identifiers;
  };

  const handleCompare = async () => {
    if (!sheetAUrl.trim() || !sheetBUrl.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please provide both sheet URLs.' });
      return;
    }
    setIsLoading(true);
    setError(null);
    setMissingEntries(null);

    try {
      const [dataA, dataB] = await Promise.all([parseSheet(sheetAUrl), parseSheet(sheetBUrl)]);

      if (dataA.length === 0 || dataB.length === 0) {
        throw new Error("One or both sheets are empty or could not be parsed.");
      }

      const headersA = Object.keys(dataA[0]);
      const headersB = Object.keys(dataB[0]);

      const possibleEmailHeaders = ['email', 'email address'];
      const possibleNameHeaders = ['name', 'full name'];
      const possiblePhoneHeaders = ['phone', 'phone number'];
      const possibleRegNoHeaders = ['regno', 'reg no', 'registration no', 'registration number'];

      const headerMapA = {
        email: headersA.find(h => possibleEmailHeaders.includes(h.toLowerCase())) || '',
        name: headersA.find(h => possibleNameHeaders.includes(h.toLowerCase())) || '',
        phone: headersA.find(h => possiblePhoneHeaders.includes(h.toLowerCase())) || '',
        regNo: headersA.find(h => possibleRegNoHeaders.includes(h.toLowerCase())) || '',
      };

      const headerMapB = {
        email: headersB.find(h => possibleEmailHeaders.includes(h.toLowerCase())) || '',
        name: headersB.find(h => possibleNameHeaders.includes(h.toLowerCase())) || '',
        phone: headersB.find(h => possiblePhoneHeaders.includes(h.toLowerCase())) || '',
        regNo: headersB.find(h => possibleRegNoHeaders.includes(h.toLowerCase())) || '',
      };
      
      const identifiersB = new Set<string>();
      dataB.forEach(row => {
        getIdentifiers(row, headerMapB).forEach(id => identifiersB.add(id));
      });

      if (identifiersB.size === 0) {
        throw new Error("Could not find any identifying columns (email, name, etc.) in the Reference Sheet (Sheet B).");
      }

      const missing = dataA.filter(rowA => {
        const idsA = getIdentifiers(rowA, headerMapA);
        if (idsA.size === 0) return false; // Don't include rows from A with no identifiers
        return ![...idsA].some(id => identifiersB.has(id));
      });

      setMissingEntries(missing);
      toast({
        title: 'Comparison Complete',
        description: `Found ${missing.length} entries in Sheet A that are not in Sheet B.`,
      });

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Comparison Failed', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <div className="space-y-6">
      <Card className="glass">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="sheet-a-url" className="text-sm font-medium">Main Sheet URL (Sheet A)</label>
            <Input id="sheet-a-url" placeholder="URL for the primary sheet..." value={sheetAUrl} onChange={(e) => setSheetAUrl(e.target.value)} disabled={isLoading} />
             <p className="text-xs text-muted-foreground">The sheet to check entries from.</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="sheet-b-url" className="text-sm font-medium">Reference Sheet URL (Sheet B)</label>
            <Input id="sheet-b-url" placeholder="URL for the sheet to compare against..." value={sheetBUrl} onChange={(e) => setSheetBUrl(e.target.value)} disabled={isLoading} />
             <p className="text-xs text-muted-foreground">The sheet containing entries to check for existence.</p>
          </div>
          <Button onClick={handleCompare} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? 'Comparing...' : 'Compare Sheets'}
          </Button>
          {error && (
             <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      {missingEntries && (
         <Card className="glass">
            <CardHeader>
                <CardTitle>Missing Entries ({missingEntries.length})</CardTitle>
                <CardDescription>Entries found in the Main Sheet but not in the Reference Sheet.</CardDescription>
            </CardHeader>
            <CardContent>
              {missingEntries.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="space-y-2 pr-4">
                      {missingEntries.map((entry, index) => (
                          <div key={index} className="flex items-center gap-4 rounded-md border p-2 text-xs sm:text-sm overflow-x-auto">
                              {Object.values(entry).map((val, i) => (
                                <p key={i} className="truncate" title={String(val)}>{String(val)}</p>
                              ))}
                          </div>
                      ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center h-20 text-muted-foreground">
                  <p>No missing entries found. All items in Sheet A are in Sheet B.</p>
                </div>
              )}
            </CardContent>
         </Card>
      )}
    </div>
  );
}


export default function TrackerClient({ allUsers }: { allUsers: User[] }) {
  return (
    <Tabs defaultValue="tracker" className="w-full">
      <div className="flex justify-center">
        <TabsList className="grid w-full grid-cols-1 sm:w-auto sm:grid-cols-2">
          <TabsTrigger value="tracker"><Users className="mr-2" />Submission Tracker</TabsTrigger>
          <TabsTrigger value="comparator"><FileDiff className="mr-2" />Sheet Comparator</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="tracker" className="mt-6">
        <SubmissionTracker allUsers={allUsers} />
      </TabsContent>
      <TabsContent value="comparator" className="mt-6">
        <SheetComparator />
      </TabsContent>
    </Tabs>
  );
}
