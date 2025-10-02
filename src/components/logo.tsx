import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 md:gap-4", className)}>
      <Image 
        src="/logo.png" 
        alt="CloudX Logo" 
        width={40} 
        height={40}
        className="h-8 w-auto md:h-10"
      />
      <h1 className="font-headline text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent md:text-3xl whitespace-nowrap">
        CloudX Central
      </h1>
    </div>
  );
}
