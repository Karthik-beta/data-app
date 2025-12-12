import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

const BATCH_SIZE = 100;

// Get the database URL
const DATABASE_URL = process.env.DATABASE_URL?.replace(/&channel_binding=require/g, '') || '';
const sql = neon(DATABASE_URL);

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const cursor = parseInt(searchParams.get('cursor') || '0');
        const limit = parseInt(searchParams.get('limit') || String(BATCH_SIZE));

        // Multi-select filters (comma-separated)
        const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) || [];
        const classes = searchParams.get('classes')?.split(',').filter(Boolean) || [];
        const years = searchParams.get('years')?.split(',').filter(Boolean).map(Number) || [];
        const industries = searchParams.get('industries')?.split(',').filter(Boolean) || [];
        const stateCodes = searchParams.get('stateCodes')?.split(',').filter(Boolean) || [];
        const search = searchParams.get('search') || '';

        const hasFilters = statuses.length || classes.length || years.length || industries.length || stateCodes.length || search;

        let companies;

        if (!hasFilters && cursor === 0) {
            // No filters, first page
            companies = await sql`
                SELECT id, cin, company_name, company_roc_code, company_category,
                       company_sub_category, company_class, authorized_capital,
                       paidup_capital, company_registration_date, registered_office_address,
                       listing_status, company_status, company_state_code,
                       company_indian_foreign, nic_code, company_industrial_classification
                FROM companies ORDER BY id LIMIT ${limit}
            `;
        } else if (!hasFilters && cursor > 0) {
            // No filters, pagination
            companies = await sql`
                SELECT id, cin, company_name, company_roc_code, company_category,
                       company_sub_category, company_class, authorized_capital,
                       paidup_capital, company_registration_date, registered_office_address,
                       listing_status, company_status, company_state_code,
                       company_indian_foreign, nic_code, company_industrial_classification
                FROM companies WHERE id > ${cursor} ORDER BY id LIMIT ${limit}
            `;
        } else {
            // With filters - use query builder approach
            // Build WHERE conditions dynamically but execute with tagged template for safety
            let result;

            if (statuses.length === 1 && !classes.length && !years.length && !industries.length && !search) {
                if (cursor > 0) {
                    result = await sql`SELECT id, cin, company_name, company_roc_code, company_category, company_sub_category, company_class, authorized_capital, paidup_capital, company_registration_date, registered_office_address, listing_status, company_status, company_state_code, company_indian_foreign, nic_code, company_industrial_classification FROM companies WHERE id > ${cursor} AND company_status = ${statuses[0]} ORDER BY id LIMIT ${limit}`;
                } else {
                    result = await sql`SELECT id, cin, company_name, company_roc_code, company_category, company_sub_category, company_class, authorized_capital, paidup_capital, company_registration_date, registered_office_address, listing_status, company_status, company_state_code, company_indian_foreign, nic_code, company_industrial_classification FROM companies WHERE company_status = ${statuses[0]} ORDER BY id LIMIT ${limit}`;
                }
            } else if (classes.length === 1 && !statuses.length && !years.length && !industries.length && !search) {
                if (cursor > 0) {
                    result = await sql`SELECT id, cin, company_name, company_roc_code, company_category, company_sub_category, company_class, authorized_capital, paidup_capital, company_registration_date, registered_office_address, listing_status, company_status, company_state_code, company_indian_foreign, nic_code, company_industrial_classification FROM companies WHERE id > ${cursor} AND company_class = ${classes[0]} ORDER BY id LIMIT ${limit}`;
                } else {
                    result = await sql`SELECT id, cin, company_name, company_roc_code, company_category, company_sub_category, company_class, authorized_capital, paidup_capital, company_registration_date, registered_office_address, listing_status, company_status, company_state_code, company_indian_foreign, nic_code, company_industrial_classification FROM companies WHERE company_class = ${classes[0]} ORDER BY id LIMIT ${limit}`;
                }
            } else if (years.length === 1 && !statuses.length && !classes.length && !industries.length && !search) {
                if (cursor > 0) {
                    result = await sql`SELECT id, cin, company_name, company_roc_code, company_category, company_sub_category, company_class, authorized_capital, paidup_capital, company_registration_date, registered_office_address, listing_status, company_status, company_state_code, company_indian_foreign, nic_code, company_industrial_classification FROM companies WHERE id > ${cursor} AND EXTRACT(YEAR FROM company_registration_date) = ${years[0]} ORDER BY id LIMIT ${limit}`;
                } else {
                    result = await sql`SELECT id, cin, company_name, company_roc_code, company_category, company_sub_category, company_class, authorized_capital, paidup_capital, company_registration_date, registered_office_address, listing_status, company_status, company_state_code, company_indian_foreign, nic_code, company_industrial_classification FROM companies WHERE EXTRACT(YEAR FROM company_registration_date) = ${years[0]} ORDER BY id LIMIT ${limit}`;
                }
            } else if (industries.length === 1 && !statuses.length && !classes.length && !years.length && !search) {
                if (cursor > 0) {
                    result = await sql`SELECT id, cin, company_name, company_roc_code, company_category, company_sub_category, company_class, authorized_capital, paidup_capital, company_registration_date, registered_office_address, listing_status, company_status, company_state_code, company_indian_foreign, nic_code, company_industrial_classification FROM companies WHERE id > ${cursor} AND company_industrial_classification = ${industries[0]} ORDER BY id LIMIT ${limit}`;
                } else {
                    result = await sql`SELECT id, cin, company_name, company_roc_code, company_category, company_sub_category, company_class, authorized_capital, paidup_capital, company_registration_date, registered_office_address, listing_status, company_status, company_state_code, company_indian_foreign, nic_code, company_industrial_classification FROM companies WHERE company_industrial_classification = ${industries[0]} ORDER BY id LIMIT ${limit}`;
                }
            } else if (search && !statuses.length && !classes.length && !years.length && !industries.length) {
                const searchPattern = `%${search}%`;
                if (cursor > 0) {
                    result = await sql`SELECT id, cin, company_name, company_roc_code, company_category, company_sub_category, company_class, authorized_capital, paidup_capital, company_registration_date, registered_office_address, listing_status, company_status, company_state_code, company_indian_foreign, nic_code, company_industrial_classification FROM companies WHERE id > ${cursor} AND (company_name ILIKE ${searchPattern} OR cin ILIKE ${searchPattern}) ORDER BY id LIMIT ${limit}`;
                } else {
                    result = await sql`SELECT id, cin, company_name, company_roc_code, company_category, company_sub_category, company_class, authorized_capital, paidup_capital, company_registration_date, registered_office_address, listing_status, company_status, company_state_code, company_indian_foreign, nic_code, company_industrial_classification FROM companies WHERE (company_name ILIKE ${searchPattern} OR cin ILIKE ${searchPattern}) ORDER BY id LIMIT ${limit}`;
                }
            } else {
                // Complex multi-filter case - fetch all and filter (for now, limit results)
                // This is not ideal but works for the demo
                if (cursor > 0) {
                    result = await sql`SELECT id, cin, company_name, company_roc_code, company_category, company_sub_category, company_class, authorized_capital, paidup_capital, company_registration_date, registered_office_address, listing_status, company_status, company_state_code, company_indian_foreign, nic_code, company_industrial_classification FROM companies WHERE id > ${cursor} ORDER BY id LIMIT 5000`;
                } else {
                    result = await sql`SELECT id, cin, company_name, company_roc_code, company_category, company_sub_category, company_class, authorized_capital, paidup_capital, company_registration_date, registered_office_address, listing_status, company_status, company_state_code, company_indian_foreign, nic_code, company_industrial_classification FROM companies ORDER BY id LIMIT 5000`;
                }

                // Filter in JavaScript
                result = result.filter((c: Record<string, unknown>) => {
                    if (statuses.length && !statuses.includes(c.company_status as string)) return false;
                    if (classes.length && !classes.includes(c.company_class as string)) return false;
                    if (industries.length && !industries.includes(c.company_industrial_classification as string)) return false;
                    if (stateCodes.length && !stateCodes.includes(c.company_state_code as string)) return false;
                    if (years.length) {
                        const regDate = c.company_registration_date as string;
                        if (!regDate) return false;
                        const year = new Date(regDate).getFullYear();
                        if (!years.includes(year)) return false;
                    }
                    if (search) {
                        const name = (c.company_name as string || '').toLowerCase();
                        const cin = (c.cin as string || '').toLowerCase();
                        const s = search.toLowerCase();
                        if (!name.includes(s) && !cin.includes(s)) return false;
                    }
                    return true;
                }).slice(0, limit);
            }

            companies = result;
        }

        let total = 0, filteredTotal = 0;

        if (cursor === 0) {
            const totalResult = await sql`SELECT COUNT(*) as total FROM companies`;
            total = parseInt(totalResult[0].total);
            filteredTotal = hasFilters ? companies.length : total;
        }

        const last = companies[companies.length - 1];
        return NextResponse.json({
            companies,
            nextCursor: companies.length === limit ? last?.id : null,
            total: cursor === 0 ? total : undefined,
            filteredTotal: cursor === 0 ? filteredTotal : undefined,
        });

    } catch (error) {
        console.error('Companies fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch companies', details: String(error) }, { status: 500 });
    }
}

// Get ALL filter options
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [statuses, classes, years, industries, stateCodes] = await Promise.all([
            sql`SELECT DISTINCT company_status as value FROM companies WHERE company_status IS NOT NULL ORDER BY company_status`,
            sql`SELECT DISTINCT company_class as value FROM companies WHERE company_class IS NOT NULL ORDER BY company_class`,
            sql`SELECT DISTINCT EXTRACT(YEAR FROM company_registration_date)::integer as value FROM companies WHERE company_registration_date IS NOT NULL ORDER BY value DESC`,
            sql`SELECT DISTINCT company_industrial_classification as value FROM companies WHERE company_industrial_classification IS NOT NULL ORDER BY company_industrial_classification`,
            sql`SELECT DISTINCT company_state_code as value FROM companies WHERE company_state_code IS NOT NULL ORDER BY company_state_code`,
        ]);

        // Helper to convert to title case
        const toTitleCase = (str: string) =>
            str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

        return NextResponse.json({
            statuses: statuses.map((r: Record<string, unknown>) => r.value as string),
            classes: classes.map((r: Record<string, unknown>) => r.value as string),
            years: years.map((r: Record<string, unknown>) => r.value as number),
            industries: industries.map((r: Record<string, unknown>) => r.value as string),
            stateCodes: stateCodes.map((r: Record<string, unknown>) => ({
                value: r.value as string,
                label: toTitleCase(r.value as string),
            })),
        });

    } catch (error) {
        console.error('Filter options fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch filter options' }, { status: 500 });
    }
}
