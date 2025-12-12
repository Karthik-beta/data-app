import { neon, NeonQueryFunction } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

// Create the SQL client
// Remove channel_binding parameter if present as it can cause issues
const cleanUrl = DATABASE_URL.replace(/&channel_binding=require/g, '');

// Use fullResults: false for better performance with large datasets
export const sql: NeonQueryFunction<false, false> = neon(cleanUrl, {
    fullResults: false,
});

export interface Company {
    id: number;
    cin: string;
    company_name: string;
    company_roc_code: string;
    company_category: string;
    company_sub_category: string;
    company_class: string;
    authorized_capital: number | null;
    paidup_capital: number | null;
    company_registration_date: string | null;
    registered_office_address: string;
    listing_status: string;
    company_status: string;
    company_state_code: string;
    company_indian_foreign: string;
    nic_code: string;
    company_industrial_classification: string;
}
