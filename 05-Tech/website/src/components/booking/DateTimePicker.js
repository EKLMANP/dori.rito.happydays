'use client';

import { useState, useEffect, useCallback } from 'react';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function DateTimePicker({ serviceId, onSelect, onBack }) {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [slots, setSlots] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);

    const fetchSlots = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/booking/slots?service_id=${serviceId}&month=${currentMonth}`);
            const data = await res.json();
            setSlots(data.slots || {});
        } catch (err) {
            console.error('Failed to fetch slots:', err);
            setSlots({});
        }
        setLoading(false);
    }, [serviceId, currentMonth]);

    useEffect(() => { fetchSlots(); }, [fetchSlots]);

    // Calendar generation
    const [year, month] = currentMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    function prevMonth() {
        const d = new Date(year, month - 2, 1);
        setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        setSelectedDate(null);
        setSelectedTime(null);
    }

    function nextMonth() {
        const d = new Date(year, month, 1);
        setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        setSelectedDate(null);
        setSelectedTime(null);
    }

    function handleDateClick(dateStr) {
        setSelectedDate(dateStr);
        setSelectedTime(null);
    }

    function handleTimeSelect(time, start, end) {
        setSelectedTime(time);
        onSelect({ date: selectedDate, time, start, end });
    }

    const today = new Date().toISOString().slice(0, 10);

    return (
        <div>
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={prevMonth}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                >
                    ← 上個月
                </button>
                <h3 className="text-lg font-bold text-gray-800">
                    {year} 年 {month} 月
                </h3>
                <button
                    onClick={nextMonth}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                >
                    下個月 →
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400">載入可用時段...</div>
            ) : (
                <>
                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1 mb-6">
                        {/* Weekday headers */}
                        {WEEKDAYS.map(d => (
                            <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">
                                {d}
                            </div>
                        ))}

                        {/* Empty cells before first day */}
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}

                        {/* Day cells */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
                            const hasSlots = slots[dateStr] && slots[dateStr].length > 0;
                            const isPast = dateStr < today;
                            const isSelected = dateStr === selectedDate;

                            return (
                                <button
                                    key={day}
                                    onClick={() => hasSlots && handleDateClick(dateStr)}
                                    disabled={!hasSlots || isPast}
                                    className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                                        isSelected
                                            ? 'bg-brand-orange text-white shadow-md'
                                            : hasSlots && !isPast
                                              ? 'bg-orange-50 text-brand-orange hover:bg-orange-100 cursor-pointer'
                                              : 'text-gray-300 cursor-default'
                                    }`}
                                >
                                    {day}
                                    {hasSlots && !isPast && (
                                        <div className={`w-1 h-1 rounded-full mx-auto mt-0.5 ${
                                            isSelected ? 'bg-white' : 'bg-brand-orange'
                                        }`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Time slots for selected date */}
                    {selectedDate && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                                {selectedDate} 可選時段
                            </h4>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {(slots[selectedDate] || []).map(slot => (
                                    <button
                                        key={slot.time}
                                        onClick={() => handleTimeSelect(slot.time, slot.start, slot.end)}
                                        className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                            selectedTime === slot.time
                                                ? 'bg-brand-orange text-white'
                                                : 'bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-brand-orange border border-gray-200'
                                        }`}
                                    >
                                        {slot.time}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
                <button
                    onClick={onBack}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                    ← 回到問卷
                </button>

                {selectedDate && selectedTime && (
                    <div className="text-sm text-brand-orange font-medium py-2.5">
                        已選：{selectedDate} {selectedTime} ✓
                    </div>
                )}
            </div>
        </div>
    );
}
