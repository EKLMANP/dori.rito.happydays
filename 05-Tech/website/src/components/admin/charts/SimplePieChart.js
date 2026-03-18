'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DEFAULT_COLORS = ['#F75000', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

/**
 * Reusable pie chart wrapper around Recharts.
 *
 * @param {object}   props
 * @param {Array}    props.data      - Array of data objects
 * @param {string}   props.nameKey   - Key for label
 * @param {string}   props.valueKey  - Key for numeric value
 * @param {string[]} [props.colors]  - Custom colour palette
 * @param {number}   [props.height]  - Chart height in px
 * @param {boolean}  [props.loading]
 */
export default function SimplePieChart({
    data = [],
    nameKey,
    valueKey,
    colors = DEFAULT_COLORS,
    height = 250,
    loading = false,
}) {
    if (loading) {
        return (
            <div className="animate-pulse bg-gray-100 rounded-lg" style={{ height }} />
        );
    }

    if (!data.length) {
        return (
            <div
                className="flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg"
                style={{ height }}
            >
                暫無數據
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey={valueKey}
                    nameKey={nameKey}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: '#D1D5DB' }}
                >
                    {data.map((_, idx) => (
                        <Cell key={idx} fill={colors[idx % colors.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        fontSize: '13px',
                    }}
                    formatter={(value) => [value.toLocaleString(), '']}
                />
                <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px', color: '#6B7280' }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
