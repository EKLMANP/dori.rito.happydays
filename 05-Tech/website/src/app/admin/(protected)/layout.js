'use client';

import AdminPinGate, { useAdminPin } from '@/components/admin/AdminPinGate';
import AdminSidebar from '@/components/admin/AdminSidebar';

function AdminLayoutInner({ children }) {
    const { logout } = useAdminPin();

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar onLogout={logout} />
            <main className="flex-1 p-8">{children}</main>
        </div>
    );
}

export default function ProtectedAdminLayout({ children }) {
    return (
        <AdminPinGate>
            <AdminLayoutInner>{children}</AdminLayoutInner>
        </AdminPinGate>
    );
}
