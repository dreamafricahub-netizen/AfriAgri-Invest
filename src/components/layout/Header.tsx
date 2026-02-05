'use client';

import { Bell } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import Link from 'next/link';

export function Header() {
    const { userData, loading } = useUserData();

    const balance = userData?.balance || 0;
    const investedCapital = userData?.investedCapital || 0;
    const totalValue = balance + investedCapital;

    return (
        <header className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 z-40 px-4 py-3">
            <div className="flex justify-between items-center max-w-5xl mx-auto">
                <div className="flex flex-col">
                    <h1 className="text-lg font-bold text-agri-green tracking-tight">AfriAgri Invest</h1>
                    <span className="text-xs text-zinc-500 font-medium">
                        {loading ? '...' : `${userData?.investments?.length || 0} ferme(s) active(s)`}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-agri-green/10 rounded-full border border-agri-green/20">
                        <span className="font-bold text-agri-green text-sm">
                            {loading ? '...' : `${totalValue.toLocaleString('fr-FR')} FCFA`}
                        </span>
                    </div>
                    <Link href="/notifications" className="relative p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </Link>
                </div>
            </div>
        </header>
    );
}
