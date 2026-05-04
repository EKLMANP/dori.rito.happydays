'use client';

import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Suspense } from 'react';

function LoginInner() {
    const params = useSearchParams();
    const error = params.get('error');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                <img
                    src="https://iili.io/qf6QsVe.png"
                    alt="Dori & Rito"
                    className="h-16 mx-auto mb-6"
                />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">管理員後台</h1>
                <p className="text-gray-500 mb-6">僅授權員工可登入</p>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">
                        {error === 'AccessDenied'
                            ? '此 Google 帳號未獲授權，請聯絡管理員。'
                            : '登入失敗，請再試一次。'}
                    </div>
                )}

                <button
                    onClick={() => signIn('google', { callbackUrl: '/admin' })}
                    className="w-full py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
                >
                    使用 Google 登入
                </button>
            </div>
        </div>
    );
}

export default function AdminLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-400">載入中...</p></div>}>
            <LoginInner />
        </Suspense>
    );
}
