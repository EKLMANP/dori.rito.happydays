import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export default async function ProtectedAdminLayout({ children }) {
    const session = await auth();
    const email = session?.user?.email?.toLowerCase();
    if (!email || !allowedEmails.includes(email)) {
        redirect('/admin/login');
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar userEmail={email} />
            <main className="flex-1 p-4 pt-14 md:p-8 min-w-0">{children}</main>
        </div>
    );
}
