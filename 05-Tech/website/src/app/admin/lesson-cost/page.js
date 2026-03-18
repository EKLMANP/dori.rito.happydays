import LessonCostForm from '@/components/admin/LessonCostForm';

export const metadata = {
    title: '記錄課堂成本 | Dori & Rito 管理後台',
};

export default function LessonCostPage() {
    return (
        <div>
            <h1 className="text-xl font-bold text-gray-900 mb-4">記錄課堂成本</h1>
            <LessonCostForm />
        </div>
    );
}
