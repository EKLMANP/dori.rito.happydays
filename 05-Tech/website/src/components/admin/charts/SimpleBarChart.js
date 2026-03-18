'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

/**
 * Reusable bar chart wrapper around Recharts.
 *
 * @param {object}   props
 * @param {Array}    props.data    - Array of data objects
 * @param {string}   props.xKey   - Key for X axis labels
 * @param {string}   props.yKey   - Key for bar values
 * @param {string}   [props.color]  - Bar fill colour (default brand orange)
 * @param {number}   [props.height] - Chart height in px
 * @param {string}   [props.yLabel] - Y axis label suffix (e.g. "元")
 * @param {boolean}  [props.loading]
 */
export default function SimpleBarChart({
    data = [],
    xKey,
    yKey,
    color = '#F75000',
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
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
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
                    formatter={(value) => [`${value.toLocaleString()}${yLabel}`, '']}
                />
                <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
