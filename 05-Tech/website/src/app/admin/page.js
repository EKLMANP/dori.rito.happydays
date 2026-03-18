import ProfitDashboard from '@/components/admin/ProfitDashboard';

export const metadata = {
    title: '營運分析 | Dori & Rito 管理後台',
};

export default function AdminDashboardPage() {
    return (
        <div>
            <h1 className="text-xl font-bold text-gray-900 mb-4">營運分析</h1>
            <ProfitDashboard />
        </div>
    );
}
