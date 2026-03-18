'use client';

import LessonCostForm from '@/components/admin/LessonCostForm';

export default function LessonCostPage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">記錄成本</h1>
                <p className="text-sm text-gray-400 mt-1">課堂結束後記錄停車、交通、通勤成本</p>
            </div>
            <LessonCostForm />
        </div>
    );
}
