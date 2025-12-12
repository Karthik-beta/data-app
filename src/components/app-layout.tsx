'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Menu, X } from 'lucide-react';

interface AppLayoutProps {
    children: React.ReactNode;
    user: { name: string; username: string } | null;
}

export function AppLayout({ children, user }: AppLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/companies', label: 'Companies' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 h-14 border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm z-50">
                <div className="h-full max-w-[1920px] mx-auto px-3 sm:px-4 flex items-center justify-between">
                    {/* Logo & Nav */}
                    <div className="flex items-center gap-2 sm:gap-6">
                        <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h1 className="text-base sm:text-lg font-bold text-white whitespace-nowrap hidden sm:block">
                                Indian Companies
                            </h1>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link key={link.href} href={link.href}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={pathname === link.href
                                            ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }
                                    >
                                        {link.label}
                                    </Button>
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Desktop User Section */}
                    <div className="hidden md:flex items-center gap-4">
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

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-14 left-0 right-0 bg-slate-900 border-b border-slate-700 shadow-xl">
                        <div className="p-3 space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <div
                                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname === link.href
                                                ? 'text-blue-400 bg-blue-500/10'
                                                : 'text-slate-300 hover:text-white hover:bg-slate-800'
                                            }`}
                                    >
                                        {link.label}
                                    </div>
                                </Link>
                            ))}

                            <div className="border-t border-slate-700 my-2 pt-2">
                                <div className="px-4 py-2 text-sm text-slate-400">
                                    Signed in as <span className="text-white font-medium">{user.name}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        handleLogout();
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content with padding for fixed header */}
            <main className="pt-14">
                {children}
            </main>

            {/* Mobile menu backdrop */}
            {mobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ top: '56px' }}
                />
            )}
        </div>
    );
}
