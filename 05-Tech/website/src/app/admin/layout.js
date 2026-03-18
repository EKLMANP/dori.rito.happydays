import AdminAuthGate from '@/components/admin/AdminAuthGate';
import AdminNav from '@/components/admin/AdminNav';

export const metadata = {
    title: '管理後台 | Dori & Rito',
    robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
    return (
        <AdminAuthGate>
            <div className="min-h-screen bg-gray-50 pb-16">
                <AdminNav />
                <main className="px-4 py-6 max-w-4xl mx-auto">
                    {children}
                </main>
            </div>
        </AdminAuthGate>
    );
}
