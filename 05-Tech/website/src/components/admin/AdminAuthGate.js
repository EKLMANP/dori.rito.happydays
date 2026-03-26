'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const AuthContext = createContext(null);

export function useAdminAuth() {
    return useContext(AuthContext);
}

export default function AdminAuthGate({ children }) {
    const [pin, setPin] = useState('');
    const [inputPin, setInputPin] = useState('');
    const [status, setStatus] = useState('checking'); // checking | needs_auth | authenticated | error

    useEffect(() => {
        const saved = sessionStorage.getItem('admin_pin');
        if (saved) {
            setPin(saved);
            setStatus('authenticated');
        } else {
            setStatus('needs_auth');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputPin.trim()) return;
        setStatus('checking');

        try {
            const res = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: inputPin.trim() }),
            });
            const data = await res.json();
            if (data.valid) {
                sessionStorage.setItem('admin_pin', inputPin.trim());
                setPin(inputPin.trim());
                setStatus('authenticated');
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    const logout = useCallback(() => {
        sessionStorage.removeItem('admin_pin');
        setPin('');
        setInputPin('');
        setStatus('needs_auth');
    }, []);

    const adminFetch = useCallback(async (url, options = {}) => {
        const headers = { ...options.headers, 'x-admin-pin': pin };
        const res = await fetch(url, { ...options, headers });
        if (res.status === 401) {
            logout();
            throw new Error('認證已過期，請重新輸入 PIN');
        }
        return res;
    }, [pin, logout]);

    if (status === 'checking') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">載入中...</p>
            </div>
        );
    }

    if (status === 'needs_auth' || status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Dori & Rito</h1>
                        <p className="text-gray-500 mt-1">管理後台</p>
                    </div>
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <div>
                            <label htmlFor="admin-pin" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                請輸入 PIN 碼
                            </label>
                            <input
                                id="admin-pin"
                                type="password"
                                inputMode="numeric"
                                autoComplete="off"
                                value={inputPin}
                                onChange={(e) => { setInputPin(e.target.value); if (status === 'error') setStatus('needs_auth'); }}
                                placeholder="PIN"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-center text-lg tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                                autoFocus
                            />
                        </div>
                        {status === 'error' && (
                            <p className="text-center text-red-500 text-sm">PIN 碼錯誤，請重試</p>
                        )}
                        <button
                            type="submit"
                            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base transition"
                        >
                            進入後台
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ pin, adminFetch, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
