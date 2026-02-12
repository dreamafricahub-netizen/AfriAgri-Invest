import { redirect } from 'next/navigation';

export default function ReferralRedirectPage({ params }: { params: { code: string } }) {
    redirect(`/auth/register?ref=${params.code}`);
}
