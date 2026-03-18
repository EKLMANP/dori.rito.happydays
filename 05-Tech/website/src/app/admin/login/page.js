'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get('from') || '/admin';

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.push(from);
            } else {
                const data = await res.json();
                setError(data.error || '登入失敗');
            }
        } catch {
            setError('網路錯誤，請稍後再試');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                管理員密碼
            </label>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="輸入密碼"
                autoFocus
                required
            />
            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? '登入中...' : '登入'}
            </button>
        </form>
    );
}

export default function AdminLoginPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <h1 className="text-xl font-bold text-gray-900 text-center mb-6">
                        Dori & Rito Admin
                    </h1>
                    <Suspense fallback={<div className="h-32" />}>
                        <LoginForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
