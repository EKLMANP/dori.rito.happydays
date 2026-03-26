'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AdminPinContext = createContext(null);

export function useAdminPin() {
    const ctx = useContext(AdminPinContext);
    // Return safe defaults during SSR/prerender when no Provider exists
    if (!ctx) {
        return { pin: '', adminFetch: fetch, logout: () => {} };
    }
    return ctx;
}

export default function AdminPinGate({ children }) {
    const [pin, setPin] = useState('');
    const [status, setStatus] = useState('checking'); // checking | needs_auth | authenticated | error
    const [inputPin, setInputPin] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const saved = sessionStorage.getItem('admin_pin');
        if (saved) {
            verifyPin(saved);
        } else {
            setStatus('needs_auth');
        }
    }, []);

    async function verifyPin(p) {
        try {
            const res = await fetch('/api/admin/pin-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: p }),
            });
            if (res.ok) {
                setPin(p);
                sessionStorage.setItem('admin_pin', p);
                setStatus('authenticated');
                setErrorMsg('');
            } else {
                sessionStorage.removeItem('admin_pin');
                setErrorMsg('密碼錯誤');
                setStatus('needs_auth');
            }
        } catch {
            setStatus('error');
        }
    }

    const adminFetch = useCallback((url, opts = {}) => {
        return fetch(url, {
            ...opts,
            headers: { ...opts.headers, 'x-admin-pin': pin },
        });
    }, [pin]);

    function logout() {
        sessionStorage.removeItem('admin_pin');
        setPin('');
        setInputPin('');
        setErrorMsg('');
        setStatus('needs_auth');
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!inputPin.trim()) return;
        verifyPin(inputPin.trim());
    }

    if (status === 'checking') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-400">驗證中...</p>
            </div>
        );
    }

    if (status === 'needs_auth' || status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                    <img
                        src="https://iili.io/qf6QsVe.png"
                        alt="Dori & Rito"
                        className="h-16 mx-auto mb-6"
                    />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">管理員後台</h1>
                    <p className="text-gray-500 mb-6">請輸入管理密碼</p>

                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">
                            {errorMsg}
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">
                            連線失敗，請稍後再試
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <input
                            type="password"
                            value={inputPin}
                            onChange={e => setInputPin(e.target.value)}
                            placeholder="輸入密碼"
                            autoFocus
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-lg tracking-widest focus:outline-none focus:border-brand-orange transition-colors mb-4"
                        />
                        <button
                            type="submit"
                            disabled={!inputPin.trim()}
                            className="w-full py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            登入
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <AdminPinContext.Provider value={{ pin, adminFetch, logout }}>
            {children}
        </AdminPinContext.Provider>
    );
}
