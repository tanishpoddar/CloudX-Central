import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import LoginPageClient from './login-page-client';
import { Logo } from '@/components/logo';
import { Card, CardContent } from '@/components/ui/card';

export default async function LoginPage() {
    const user = await getCurrentUser();

    if (user) {
        redirect('/dashboard');
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 gap-8">
            <Card className="glass">
              <CardContent className="flex items-center justify-center p-6">
                <Logo />
              </CardContent>
            </Card>
            <LoginPageClient />
        </main>
    );
}
