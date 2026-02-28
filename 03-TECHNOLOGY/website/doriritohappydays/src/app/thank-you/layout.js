import { BRAND } from '@/lib/constants';

export const metadata = {
    title: '訂閱確認',
    description: `${BRAND.nameShort} 電子報訂閱確認頁面`,
    robots: { index: false, follow: false },
};

export default function ThankYouLayout({ children }) {
    return children;
}
