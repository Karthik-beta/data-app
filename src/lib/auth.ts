import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'karnataka-companies-secret-key-2024'
);

const COOKIE_NAME = 'auth-token';

// Parse predefined users from environment variable
// Format: username1:password1,username2:password2
function getUsers(): Map<string, { password: string; name: string }> {
    const usersEnv = process.env.USERS || 'admin:admin123';
    const users = new Map<string, { password: string; name: string }>();

    usersEnv.split(',').forEach((userPair) => {
        const [username, password] = userPair.trim().split(':');
        if (username && password) {
            users.set(username.toLowerCase(), {
                password,
                name: username.charAt(0).toUpperCase() + username.slice(1)
            });
        }
    });

    return users;
}

export function validateCredentials(usernameOrEmail: string, password: string): { valid: boolean; username: string; name: string } | null {
    const users = getUsers();

    // Extract username from email if email format is provided
    let username = usernameOrEmail.toLowerCase();
    if (username.includes('@')) {
        username = username.split('@')[0];
    }

    const user = users.get(username);

    if (user && user.password === password) {
        return { valid: true, username, name: user.name };
    }

    return null;
}

export async function createToken(username: string, name: string): Promise<string> {
    return new SignJWT({ username, name })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ username: string; name: string } | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as { username: string; name: string };
    } catch {
        return null;
    }
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    return verifyToken(token);
}

export async function setSession(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });
}

export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}
