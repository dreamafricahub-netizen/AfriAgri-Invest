'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BetRow {
    id: string;
    stake: number;
    odds: number;
    potentialWin: number;
    cashbackRate: number;
    status: 'OPEN' | 'WON' | 'LOST' | 'VOID';
    placedAt: string;
    settledAt: string | null;
    excluded: string[];
    fixture: {
        competition: string;
        homeTeam: string;
        awayTeam: string;
        kickoffAt: string;
        status: string;
        homeGoals: number | null;
        awayGoals: number | null;
    };
}

const BADGE: Record<BetRow['status'], { label: string; className: string }> = {
    OPEN: { label: 'En cours', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-500' },
    WON: { label: 'Gagné', className: 'bg-agri-green/15 text-agri-green' },
    LOST: { label: 'Perdu', className: 'bg-red-500/15 text-red-500' },
    VOID: { label: 'Annulé', className: 'bg-zinc-500/15 text-zinc-500' },
};

export default function MesParisPage() {
    const [bets, setBets] = useState<BetRow[] | null>(null);

    useEffect(() => {
        fetch('/api/bets')
            .then((r) => r.json())
            .then((d) => setBets(d.bets ?? []))
            .catch(() => setBets([]));
    }, []);

    if (!bets) {
        return (
            <div className="flex items-center justify-center py-24 text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin" />
            </div>
        );
    }

    return (
        <div className="pb-28 px-4 max-w-2xl mx-auto">
            <header className="pt-6 pb-4">
                <h1 className="text-2xl font-bold tracking-tight">Mes paris</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Réglés automatiquement à la fin du match.
                </p>
            </header>

            {bets.length === 0 && (
                <p className="text-sm text-zinc-500 py-12 text-center">
                    Aucun pari pour le moment.
                </p>
            )}

            <div className="space-y-2">
                {bets.map((b) => {
                    const badge = BADGE[b.status];
                    const settled = b.fixture.homeGoals !== null && b.fixture.awayGoals !== null;
                    const cashback = Math.floor((b.stake * b.cashbackRate) / 100);

                    return (
                        <div
                            key={b.id}
                            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3"
                        >
                            <div className="flex justify-between items-start gap-3">
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm truncate">
                                        {b.fixture.homeTeam} — {b.fixture.awayTeam}
                                    </p>
                                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 mt-0.5">
                                        {b.fixture.competition}
                                        {settled && ` · score final ${b.fixture.homeGoals}-${b.fixture.awayGoals}`}
                                    </p>
                                </div>
                                <span className={cn('text-[10px] uppercase tracking-wider px-2 py-1 rounded-md shrink-0', badge.className)}>
                                    {badge.label}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-1 mt-2">
                                {b.excluded.map((s) => {
                                    const hit = settled && s === `${b.fixture.homeGoals}-${b.fixture.awayGoals}`;
                                    return (
                                        <span
                                            key={s}
                                            className={cn(
                                                'text-[11px] tabular-nums px-1.5 py-0.5 rounded border',
                                                hit
                                                    ? 'bg-red-500/15 text-red-500 border-red-500/40 font-bold'
                                                    : 'text-zinc-500 border-zinc-200 dark:border-zinc-700',
                                            )}
                                        >
                                            {s}
                                        </span>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between items-baseline mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs tabular-nums">
                                <span className="text-zinc-500">
                                    {b.stake.toLocaleString('fr-FR')} F · cote {b.odds.toFixed(2)}
                                </span>
                                <span
                                    className={cn(
                                        'font-bold',
                                        b.status === 'WON' && 'text-agri-green',
                                        b.status === 'LOST' && cashback > 0 && 'text-amber-600 dark:text-amber-500',
                                        b.status === 'LOST' && cashback === 0 && 'text-red-500',
                                    )}
                                >
                                    {b.status === 'WON' && `+${b.potentialWin.toLocaleString('fr-FR')} F`}
                                    {b.status === 'LOST' && cashback > 0 && `remboursé +${cashback.toLocaleString('fr-FR')} F`}
                                    {b.status === 'LOST' && cashback === 0 && `−${b.stake.toLocaleString('fr-FR')} F`}
                                    {b.status === 'VOID' && `mise rendue`}
                                    {b.status === 'OPEN' && `gain possible ${b.potentialWin.toLocaleString('fr-FR')} F`}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
