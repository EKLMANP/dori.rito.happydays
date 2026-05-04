import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

function isAllowed(email) {
    if (!email) return false;
    if (!allowedEmails.length) return false;
    return allowedEmails.includes(email.toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    session: { strategy: 'jwt' },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async signIn({ profile }) {
            return isAllowed(profile?.email);
        },
        async jwt({ token, profile }) {
            if (profile?.email) token.email = profile.email;
            // Re-validate on every JWT refresh — if the allowlist shrinks,
            // existing tokens stop working.
            if (!isAllowed(token.email)) return null;
            return token;
        },
        async session({ session, token }) {
            if (token?.email) session.user = { ...(session.user || {}), email: token.email };
            return session;
        },
    },
    pages: {
        signIn: '/admin/login',
        error: '/admin/login',
    },
});
