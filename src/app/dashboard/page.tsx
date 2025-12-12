'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AppLayout } from '@/components/app-layout';

interface Analytics {
    total: number;
    byStatus: { status: string; count: number }[];
    byClass: { class: string; count: number }[];
    topIndustries: { industry: string; count: number }[];
    capital: {
        avgAuthorized: number;
        maxAuthorized: number;
        totalAuthorized: number;
        avgPaidup: number;
        maxPaidup: number;
        totalPaidup: number;
    } | null;
    registrationTrends: { year: number; count: number }[];
    byListing: { status: string; count: number }[];
}

export default function DashboardPage() {
    const router = useRouter();
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ name: string; username: string } | null>(null);

    useEffect(() => {
        fetch('/api/auth/me')
            .then((res) => res.json())
            .then((data) => {
                if (!data.user) {
                    router.push('/login');
                } else {
                    setUser(data.user);
                }
            })
            .catch(() => router.push('/login'));
    }, [router]);

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        fetch('/api/analytics')
            .then((res) => res.json())
            .then((data) => {
                if (!data.error) {
                    setAnalytics(data);
                }
            })
            .catch((error) => {
                console.error('Error fetching analytics:', error);
                toast.error('Failed to load analytics');
            })
            .finally(() => setLoading(false));
    }, [user]);

    const formatCurrency = (value: number) => {
        if (value >= 1e12) return `₹${(value / 1e12).toFixed(2)}T`;
        if (value >= 1e9) return `₹${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)}Cr`;
        if (value >= 1e5) return `₹${(value / 1e5).toFixed(2)}L`;
        return `₹${value.toLocaleString('en-IN')}`;
    };

    const getStatusColor = (status: string) => {
        if (status === 'Active') return 'bg-emerald-600';
        if (status === 'Strike Off') return 'bg-red-600';
        return 'bg-yellow-600';
    };

    return (
        <AppLayout user={user}>
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-slate-400">Loading analytics...</div>
                    </div>
                ) : analytics ? (
                    <>
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="border-slate-700 bg-gradient-to-br from-blue-600/20 to-blue-800/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-blue-300">Total Companies</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-white">{analytics.total.toLocaleString()}</div>
                                    <p className="text-xs text-blue-300/70 mt-1">Registered in Karnataka</p>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-700 bg-gradient-to-br from-emerald-600/20 to-emerald-800/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-emerald-300">Active Companies</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-white">
                                        {analytics.byStatus.find(s => s.status === 'Active')?.count.toLocaleString() || 0}
                                    </div>
                                    <p className="text-xs text-emerald-300/70 mt-1">
                                        {((analytics.byStatus.find(s => s.status === 'Active')?.count || 0) / analytics.total * 100).toFixed(1)}% of total
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-700 bg-gradient-to-br from-purple-600/20 to-purple-800/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-purple-300">Total Authorized Capital</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-white">
                                        {analytics.capital ? formatCurrency(analytics.capital.totalAuthorized) : '-'}
                                    </div>
                                    <p className="text-xs text-purple-300/70 mt-1">Combined capital</p>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-700 bg-gradient-to-br from-cyan-600/20 to-cyan-800/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-cyan-300">Listed Companies</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-white">
                                        {analytics.byListing.find(l => l.status === 'Listed')?.count.toLocaleString() || 0}
                                    </div>
                                    <p className="text-xs text-cyan-300/70 mt-1">Publicly traded</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Company Status Distribution */}
                            <Card className="border-slate-700 bg-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-white">Company Status Distribution</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {analytics.byStatus.slice(0, 6).map((item) => (
                                            <div key={item.status} className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${getStatusColor(item.status)}`}>
                                                            {item.status}
                                                        </span>
                                                        <span className="text-sm text-slate-400">{item.count.toLocaleString()}</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${getStatusColor(item.status)}`}
                                                            style={{ width: `${(item.count / analytics.total) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Company Class Distribution */}
                            <Card className="border-slate-700 bg-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-white">Company Class Distribution</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {analytics.byClass.map((item) => {
                                            const percentage = (item.count / analytics.total) * 100;
                                            return (
                                                <div key={item.class} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-slate-300">{item.class}</span>
                                                        <span className="text-sm text-slate-400">
                                                            {item.count.toLocaleString()} ({percentage.toFixed(1)}%)
                                                        </span>
                                                    </div>
                                                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${item.class === 'Private' ? 'bg-blue-500' :
                                                                    item.class === 'Public' ? 'bg-green-500' : 'bg-purple-500'
                                                                }`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Registration Trends */}
                        <Card className="border-slate-700 bg-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white">Registration Trends (Last 10 Years)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end gap-2 h-48">
                                    {analytics.registrationTrends.map((item) => {
                                        const maxCount = Math.max(...analytics.registrationTrends.map(t => t.count));
                                        const height = (item.count / maxCount) * 100;
                                        return (
                                            <div key={item.year} className="flex-1 flex flex-col items-center gap-2">
                                                <div
                                                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:from-blue-500 hover:to-blue-300 transition-colors cursor-default"
                                                    style={{ height: `${height}%` }}
                                                    title={`${item.year}: ${item.count.toLocaleString()} companies`}
                                                />
                                                <span className="text-xs text-slate-500 -rotate-45 origin-top-left translate-x-2">
                                                    {item.year}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Industries */}
                        <Card className="border-slate-700 bg-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white">Top 10 Industries</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {analytics.topIndustries.map((item, index) => (
                                        <div key={item.industry} className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-white truncate">{item.industry}</div>
                                                <div className="text-xs text-slate-400">{item.count.toLocaleString()} companies</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Capital Statistics */}
                        {analytics.capital && (
                            <Card className="border-slate-700 bg-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-white">Capital Statistics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        <div>
                                            <div className="text-sm text-slate-400 mb-1">Average Authorized Capital</div>
                                            <div className="text-xl font-bold text-white">{formatCurrency(analytics.capital.avgAuthorized)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-400 mb-1">Maximum Authorized Capital</div>
                                            <div className="text-xl font-bold text-white">{formatCurrency(analytics.capital.maxAuthorized)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-400 mb-1">Total Authorized Capital</div>
                                            <div className="text-xl font-bold text-white">{formatCurrency(analytics.capital.totalAuthorized)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-400 mb-1">Average Paid-up Capital</div>
                                            <div className="text-xl font-bold text-white">{formatCurrency(analytics.capital.avgPaidup)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-400 mb-1">Maximum Paid-up Capital</div>
                                            <div className="text-xl font-bold text-white">{formatCurrency(analytics.capital.maxPaidup)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-400 mb-1">Total Paid-up Capital</div>
                                            <div className="text-xl font-bold text-white">{formatCurrency(analytics.capital.totalPaidup)}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* CTA */}
                        <div className="flex justify-center">
                            <Link href="/companies">
                                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8">
                                    Browse All Companies →
                                </Button>
                            </Link>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-slate-400">Failed to load analytics</div>
                )}
            </div>
        </AppLayout>
    );
}
