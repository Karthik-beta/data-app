import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        // Check authentication
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch analytics data
        const [
            totalCount,
            statusCounts,
            classCounts,
            industryTop10,
            capitalStats,
            registrationTrends,
            listingCounts,
        ] = await Promise.all([
            // Total companies
            sql`SELECT COUNT(*) as total FROM companies`,

            // Count by status
            sql`
        SELECT company_status, COUNT(*) as count 
        FROM companies 
        GROUP BY company_status 
        ORDER BY count DESC 
        LIMIT 10
      `,

            // Count by class
            sql`
        SELECT company_class, COUNT(*) as count 
        FROM companies 
        GROUP BY company_class 
        ORDER BY count DESC
      `,

            // Top 10 industries
            sql`
        SELECT company_industrial_classification, COUNT(*) as count 
        FROM companies 
        GROUP BY company_industrial_classification 
        ORDER BY count DESC 
        LIMIT 10
      `,

            // Capital statistics
            sql`
        SELECT 
          ROUND(AVG(authorized_capital)::numeric, 2) as avg_authorized,
          ROUND(MAX(authorized_capital)::numeric, 2) as max_authorized,
          ROUND(SUM(authorized_capital)::numeric, 2) as total_authorized,
          ROUND(AVG(paidup_capital)::numeric, 2) as avg_paidup,
          ROUND(MAX(paidup_capital)::numeric, 2) as max_paidup,
          ROUND(SUM(paidup_capital)::numeric, 2) as total_paidup
        FROM companies
        WHERE authorized_capital IS NOT NULL
      `,

            // Registration trends by year (last 10 years)
            sql`
        SELECT 
          EXTRACT(YEAR FROM company_registration_date) as year,
          COUNT(*) as count
        FROM companies
        WHERE company_registration_date IS NOT NULL
          AND company_registration_date >= CURRENT_DATE - INTERVAL '10 years'
        GROUP BY EXTRACT(YEAR FROM company_registration_date)
        ORDER BY year
      `,

            // Listing status
            sql`
        SELECT listing_status, COUNT(*) as count 
        FROM companies 
        GROUP BY listing_status
      `,
        ]);

        return NextResponse.json({
            total: parseInt(totalCount[0].total),
            byStatus: statusCounts.map((r: Record<string, unknown>) => ({
                status: r.company_status,
                count: parseInt(r.count as string)
            })),
            byClass: classCounts.map((r: Record<string, unknown>) => ({
                class: r.company_class,
                count: parseInt(r.count as string)
            })),
            topIndustries: industryTop10.map((r: Record<string, unknown>) => ({
                industry: r.company_industrial_classification,
                count: parseInt(r.count as string)
            })),
            capital: capitalStats[0] ? {
                avgAuthorized: parseFloat(capitalStats[0].avg_authorized) || 0,
                maxAuthorized: parseFloat(capitalStats[0].max_authorized) || 0,
                totalAuthorized: parseFloat(capitalStats[0].total_authorized) || 0,
                avgPaidup: parseFloat(capitalStats[0].avg_paidup) || 0,
                maxPaidup: parseFloat(capitalStats[0].max_paidup) || 0,
                totalPaidup: parseFloat(capitalStats[0].total_paidup) || 0,
            } : null,
            registrationTrends: registrationTrends.map((r: Record<string, unknown>) => ({
                year: parseInt(r.year as string),
                count: parseInt(r.count as string)
            })),
            byListing: listingCounts.map((r: Record<string, unknown>) => ({
                status: r.listing_status,
                count: parseInt(r.count as string)
            })),
        });

    } catch (error) {
        console.error('Analytics fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
