'use client';

import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

const formatTWD = (value) => {
    if (value >= 10000) return `$${(value / 10000).toFixed(1)}萬`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
    return `$${value}`;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
            <p className="font-semibold text-gray-900 mb-1">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} style={{ color: entry.color }}>
                    {entry.name}: ${entry.value?.toLocaleString()} 元
                </p>
            ))}
        </div>
    );
};

export default function MonthlyChart({ data }) {
    if (!data?.length) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
                尚無數據
            </div>
        );
    }

    const chartData = data.map(d => ({
        month: d.month.replace(/^\d{4}-/, ''),
        營收: d.revenue,
        成本: d.totalCosts,
        淨利: d.netProfit,
    }));

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">月趨勢</h3>
            <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={formatTWD} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="營收" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="成本" fill="#f97316" radius={[4, 4, 0, 0]} />
                    <Line
                        type="monotone"
                        dataKey="淨利"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
