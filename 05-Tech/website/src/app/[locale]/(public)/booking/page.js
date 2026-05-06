import { setRequestLocale } from 'next-intl/server';
import BookingPageClient from './_BookingPageClient';

export default async function BookingPage({ params }) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <BookingPageClient />;
}
