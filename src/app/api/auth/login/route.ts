import { NextResponse } from 'next/server';
import { validateCredentials, createToken, setSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username/email and password are required' },
                { status: 400 }
            );
        }

        // Validate credentials against predefined users
        const result = validateCredentials(username, password);

        if (!result) {
            return NextResponse.json(
                { error: 'Invalid username or password' },
                { status: 401 }
            );
        }

        // Create and set session
        const token = await createToken(result.username, result.name);
        await setSession(token);

        return NextResponse.json({
            success: true,
            user: { username: result.username, name: result.name }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
