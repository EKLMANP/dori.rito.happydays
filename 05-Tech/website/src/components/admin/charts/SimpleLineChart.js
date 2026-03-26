'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

const DEFAULT_COLORS = ['#F75000', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];

/**
 * Reusable line chart wrapper around Recharts.
 *
 * @param {Array}    props.data    - Array of data objects
 * @param {string}   props.xKey   - Key for X axis labels
 * @param {Array}    props.lines  - Array of { key, label, color? } for each line
 * @param {number}   [props.height] - Chart height in px
 * @param {string}   [props.yLabel] - Y axis label suffix
 * @param {boolean}  [props.loading]
 */
export default function SimpleLineChart({
    data = [],
    xKey,
    lines = [],
    height = 250,
    yLabel = '',
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
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey={xKey}
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v.toLocaleString()}${yLabel}`}
                />
                <Tooltip
                    contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        fontSize: '13px',
                    }}
                    formatter={(value, name) => [`${value.toLocaleString()}${yLabel}`, name]}
                />
                {lines.length > 1 && (
                    <Legend
                        verticalAlign="top"
                        iconType="line"
                        iconSize={12}
                        wrapperStyle={{ fontSize: '12px', color: '#6B7280', paddingBottom: '8px' }}
                    />
                )}
                {lines.map((line, idx) => (
                    <Line
                        key={line.key}
                        type="monotone"
                        dataKey={line.key}
                        name={line.label}
                        stroke={line.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
