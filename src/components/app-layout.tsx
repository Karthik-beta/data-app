'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AppLayoutProps {
    children: React.ReactNode;
    user: { name: string; username: string } | null;
}

export function AppLayout({ children, user }: AppLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch {
            toast.error('Failed to logout');
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-slate-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 h-14 border-b border-slate-700 bg-slate-900 z-50">
                <div className="h-full max-w-[1920px] mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h1 className="text-lg font-bold text-white whitespace-nowrap">Indian Companies Dataset</h1>
                        </div>
                        <nav className="flex items-center gap-1">
                            <Link href="/dashboard">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={pathname === '/dashboard'
                                        ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }
                                >
                                    Dashboard
                                </Button>
                            </Link>
                            <Link href="/companies">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={pathname === '/companies'
                                        ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }
                                >
                                    Companies
                                </Button>
                            </Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400">Welcome, {user.name}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content with padding for fixed header */}
            <main className="pt-14">
                {children}
            </main>
        </div>
    );
}
