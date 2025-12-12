'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
    useReactTable,
    getCoreRowModel,
    ColumnDef,
    flexRender,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Company } from '@/lib/db';
import { AppLayout } from '@/components/app-layout';
import { MultiSelect } from '@/components/multi-select';

interface ExtendedCompany extends Company {
    state: string;
    registration_year: number | null;
}

interface Filters {
    statuses: string[];
    classes: string[];
    years: string[];
    industries: string[];
    stateCodes: string[];
    search: string;
}

interface CompaniesResponse {
    companies: Company[];
    nextCursor: number | null;
    total?: number;
    filteredTotal?: number;
}

interface FilterOptions {
    statuses: string[];
    classes: string[];
    years: number[];
    industries: string[];
    stateCodes: { value: string; label: string }[];
}

export default function CompaniesPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string; username: string } | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [filteredTotal, setFilteredTotal] = useState(0);
    const [filters, setFilters] = useState<Filters>({
        statuses: [],
        classes: [],
        years: [],
        industries: [],
        stateCodes: [],
        search: '',
    });
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const fetchTriggeredRef = useRef(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(filters.search), 300);
        return () => clearTimeout(timer);
    }, [filters.search]);

    // Auth
    useEffect(() => {
        fetch('/api/auth/me')
            .then((res) => res.json())
            .then((data) => {
                if (!data.user) router.push('/login');
                else setUser(data.user);
            })
            .catch(() => router.push('/login'));
    }, [router]);

    // Single query for all filter options
    const { data: filterOptions } = useQuery<FilterOptions>({
        queryKey: ['filter-options'],
        queryFn: async () => {
            const res = await fetch('/api/companies', { method: 'POST' });
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
        enabled: !!user,
        staleTime: Infinity,
        gcTime: Infinity,
    });

    const queryParams = useMemo(() => ({
        statuses: filters.statuses,
        classes: filters.classes,
        years: filters.years,
        industries: filters.industries,
        stateCodes: filters.stateCodes,
        search: debouncedSearch,
    }), [filters.statuses, filters.classes, filters.years, filters.industries, filters.stateCodes, debouncedSearch]);

    const fetchCompanies = useCallback(async ({ pageParam = 0 }): Promise<CompaniesResponse> => {
        const params = new URLSearchParams();
        params.set('cursor', String(pageParam));
        params.set('limit', '100');

        if (queryParams.statuses.length) params.set('statuses', queryParams.statuses.join(','));
        if (queryParams.classes.length) params.set('classes', queryParams.classes.join(','));
        if (queryParams.years.length) params.set('years', queryParams.years.join(','));
        if (queryParams.industries.length) params.set('industries', queryParams.industries.join(','));
        if (queryParams.stateCodes.length) params.set('stateCodes', queryParams.stateCodes.join(','));
        if (queryParams.search) params.set('search', queryParams.search);

        const res = await fetch(`/api/companies?${params.toString()}`);
        if (!res.ok) throw new Error('Failed');
        return res.json();
    }, [queryParams]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch,
    } = useInfiniteQuery({
        queryKey: ['companies', queryParams],
        queryFn: fetchCompanies,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: 0,
        enabled: !!user,
        staleTime: 60 * 1000,
    });

    useEffect(() => {
        if (data?.pages[0]) {
            if (data.pages[0].total !== undefined) setTotalCount(data.pages[0].total);
            if (data.pages[0].filteredTotal !== undefined) setFilteredTotal(data.pages[0].filteredTotal);
        }
    }, [data]);

    const allCompanies = useMemo<ExtendedCompany[]>(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap((page) =>
            (page.companies || []).map((c) => ({
                ...c,
                state: 'Karnataka',
                registration_year: c.company_registration_date
                    ? new Date(c.company_registration_date).getFullYear()
                    : null,
            }))
        );
    }, [data]);

    const formatCurrency = (v: number | null) => v === null ? '-' : `₹${v.toLocaleString('en-IN')}`;

    const columns = useMemo<ColumnDef<ExtendedCompany>[]>(() => [
        { accessorKey: 'cin', header: 'CIN', size: 200, cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span> },
        { accessorKey: 'company_name', header: 'Company Name', size: 280, cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
        { accessorKey: 'state', header: 'State', size: 90 },
        {
            accessorKey: 'company_class', header: 'Class', size: 90, cell: ({ getValue }) => {
                const v = getValue() as string;
                const c = v === 'Private' ? 'bg-blue-600' : v === 'Public' ? 'bg-green-600' : 'bg-purple-600';
                return <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${c}`}>{v}</span>;
            }
        },
        {
            accessorKey: 'company_status', header: 'Status', size: 110, cell: ({ getValue }) => {
                const v = getValue() as string;
                const c = v === 'Active' ? 'bg-emerald-600' : v === 'Strike Off' ? 'bg-red-600' : 'bg-yellow-600';
                return <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${c}`}>{v}</span>;
            }
        },
        { accessorKey: 'authorized_capital', header: 'Capital', size: 120, cell: ({ getValue }) => formatCurrency(getValue() as number) },
        { accessorKey: 'registration_year', header: 'Year', size: 60, cell: ({ getValue }) => getValue() ?? '-' },
        { accessorKey: 'company_industrial_classification', header: 'Industry', size: 180 },
        {
            accessorKey: 'listing_status', header: 'Listed', size: 70, cell: ({ getValue }) => {
                const v = getValue() as string;
                return <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${v === 'Listed' ? 'bg-cyan-600' : 'bg-slate-600'}`}>{v}</span>;
            }
        },
    ], []);

    const table = useReactTable({
        data: allCompanies,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const { rows } = table.getRowModel();

    const rowVirtualizer = useVirtualizer({
        count: hasNextPage ? rows.length + 1 : rows.length,
        estimateSize: useCallback(() => 44, []),
        getScrollElement: useCallback(() => tableContainerRef.current, []),
        overscan: 50,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();
    const totalSize = rowVirtualizer.getTotalSize();

    // Handle scroll-based prefetching with debounce
    const handleScroll = useCallback(() => {
        if (!hasNextPage || isFetchingNextPage || fetchTriggeredRef.current) return;

        const container = tableContainerRef.current;
        if (!container) return;

        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;

        // Trigger fetch when 70% scrolled
        if (scrollTop + clientHeight >= scrollHeight * 0.7) {
            fetchTriggeredRef.current = true;
            setTimeout(() => {
                fetchNextPage().finally(() => {
                    fetchTriggeredRef.current = false;
                });
            }, 0);
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Attach scroll listener
    useEffect(() => {
        const container = tableContainerRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const paddingTop = virtualRows[0]?.start || 0;
    const paddingBottom = totalSize - (virtualRows[virtualRows.length - 1]?.end || 0);

    const exportToExcel = useCallback(() => {
        if (!allCompanies.length) { toast.error('No data'); return; }
        toast.info('Preparing...');
        setTimeout(() => {
            const ws = XLSX.utils.json_to_sheet(allCompanies.map(c => ({
                CIN: c.cin, 'Company Name': c.company_name, State: c.state, Class: c.company_class,
                Status: c.company_status, 'Auth Capital': c.authorized_capital, Year: c.registration_year,
                Industry: c.company_industrial_classification, Listing: c.listing_status,
            })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Companies');
            XLSX.writeFile(wb, `companies_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success(`Exported ${allCompanies.length.toLocaleString()}`);
        }, 50);
    }, [allCompanies]);

    const clearFilters = useCallback(() => setFilters({ statuses: [], classes: [], years: [], industries: [], stateCodes: [], search: '' }), []);

    const hasFilters = filters.statuses.length || filters.classes.length || filters.years.length || filters.industries.length || filters.stateCodes.length || debouncedSearch;
    const activeFilterCount = filters.statuses.length + filters.classes.length + filters.years.length + filters.industries.length + filters.stateCodes.length + (debouncedSearch ? 1 : 0);

    if (isError) {
        return (
            <AppLayout user={user}>
                <div className="flex flex-col items-center justify-center h-96 gap-4">
                    <div className="text-red-400">Failed to load</div>
                    <Button onClick={() => refetch()} variant="outline">Retry</Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout user={user}>
            <div className="max-w-[1920px] mx-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                {/* Header - Stack on mobile */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-bold text-white">Companies</h2>
                        <div className="px-2 sm:px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 text-xs sm:text-sm font-medium">
                            {hasFilters ? `${filteredTotal.toLocaleString()} of ` : ''}{totalCount.toLocaleString()}
                        </div>
                        {activeFilterCount > 0 && (
                            <div className="px-2 py-1 rounded bg-purple-600/20 text-purple-400 text-xs">
                                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {hasFilters && <Button onClick={clearFilters} size="sm" variant="ghost" className="text-slate-400">Clear</Button>}
                        <Button onClick={exportToExcel} size="sm" className="bg-emerald-600 hover:bg-emerald-700">Export</Button>
                    </div>
                </div>

                {/* Filters Card */}
                <Card className="border-slate-700 bg-slate-800/50">
                    <CardHeader className="py-2 sm:py-3 px-3 sm:px-6">
                        <CardTitle className="text-white text-sm sm:text-base">Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-3">
                            <Input
                                placeholder="Search..."
                                value={filters.search}
                                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-9"
                            />

                            <MultiSelect
                                options={filterOptions?.statuses || []}
                                selected={filters.statuses}
                                onChange={(v) => setFilters(f => ({ ...f, statuses: v }))}
                                placeholder="Status"
                            />

                            <MultiSelect
                                options={filterOptions?.classes || []}
                                selected={filters.classes}
                                onChange={(v) => setFilters(f => ({ ...f, classes: v }))}
                                placeholder="Class"
                            />

                            <MultiSelect
                                options={(filterOptions?.years || []).map(String)}
                                selected={filters.years}
                                onChange={(v) => setFilters(f => ({ ...f, years: v }))}
                                placeholder="Year"
                            />

                            <MultiSelect
                                options={filterOptions?.stateCodes || []}
                                selected={filters.stateCodes}
                                onChange={(v) => setFilters(f => ({ ...f, stateCodes: v }))}
                                placeholder="State"
                            />

                            <MultiSelect
                                options={filterOptions?.industries || []}
                                selected={filters.industries}
                                onChange={(v) => setFilters(f => ({ ...f, industries: v }))}
                                placeholder="Industry"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                    {isLoading && !allCompanies.length ? (
                        <div className="flex items-center justify-center h-96">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : !allCompanies.length ? (
                        <div className="flex flex-col items-center justify-center h-96 gap-3 text-slate-400">
                            <div>No companies found</div>
                            {hasFilters && <Button onClick={clearFilters} variant="outline" size="sm">Clear</Button>}
                        </div>
                    ) : (
                        <div ref={tableContainerRef} className="h-[calc(100vh-380px)] sm:h-[calc(100vh-320px)] overflow-auto" style={{ contain: 'strict' }}>
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-900">
                                        {table.getHeaderGroups()[0]?.headers.map(h => (
                                            <th key={h.id} className="text-left p-3 font-medium text-slate-300 border-b border-slate-700 whitespace-nowrap sticky top-0 bg-slate-900 z-10" style={{ width: h.getSize() }}>
                                                {flexRender(h.column.columnDef.header, h.getContext())}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paddingTop > 0 && <tr><td style={{ height: paddingTop }} colSpan={columns.length} /></tr>}
                                    {virtualRows.map(vr => {
                                        if (vr.index >= rows.length) {
                                            return hasNextPage ? (
                                                <tr key="loader"><td colSpan={columns.length} className="p-2 text-center">
                                                    <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                </td></tr>
                                            ) : null;
                                        }
                                        const row = rows[vr.index];
                                        return (
                                            <tr key={row.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                                {row.getVisibleCells().map(cell => (
                                                    <td key={cell.id} className="p-3 text-slate-300" style={{ width: cell.column.getSize() }}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                    {paddingBottom > 0 && <tr><td style={{ height: paddingBottom }} colSpan={columns.length} /></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
