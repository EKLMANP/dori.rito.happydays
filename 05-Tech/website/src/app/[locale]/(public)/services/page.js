import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';

export default async function ServicesPage({ params }) {
    const { locale } = await params;
    setRequestLocale(locale);
    redirect('/#session-section');
}
