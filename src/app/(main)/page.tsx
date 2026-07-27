'use client';

import { motion } from 'framer-motion';
import { Target, ShieldCheck, Percent, ArrowRight, Loader2, Ticket } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useUserData } from '@/hooks/useUserData';

interface FixtureSummary {
  id: string;
  kind: 'REAL' | 'VIRTUAL';
  competition: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
}

export default function Home() {
  const { userData, loading } = useUserData();
  const [mounted, setMounted] = useState(false);
  const [margin, setMargin] = useState<number | null>(null);
  const [next, setNext] = useState<FixtureSummary[]>([]);

  useEffect(() => {
    setMounted(true);
    fetch('/api/fixtures')
      .then((r) => r.json())
      .then((d) => {
        setMargin(d.marginPercent ?? null);
        setNext((d.fixtures ?? []).slice(0, 4));
      })
      .catch(() => {});
  }, []);

  if (!mounted || loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-agri-green mb-4" />
        <p className="text-zinc-500">Chargement…</p>
      </div>
    );
  }

  const balance = userData?.balance || 0;
  const openBets = userData?.bets || [];

  return (
    <div className="flex flex-col gap-5 p-4 pb-24 max-w-2xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 text-white rounded-3xl p-6 shadow-xl"
      >
        <p className="text-xs uppercase tracking-widest text-zinc-400">Solde disponible</p>
        <p className="text-4xl font-black tabular-nums mt-1">
          {balance.toLocaleString('fr-FR')} <span className="text-lg font-medium text-zinc-400">F</span>
        </p>

        <div className="flex gap-2 mt-5">
          <Link
            href="/paris"
            className="flex-1 bg-agri-green text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2"
          >
            <Target className="w-4 h-4" /> Parier
          </Link>
          <Link
            href="/portefeuille"
            className="flex-1 bg-zinc-800 text-white rounded-xl py-3 text-sm font-bold text-center"
          >
            Déposer
          </Link>
        </div>
      </motion.div>

      {/* Les deux arguments du produit, chacun verifiable. */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
          <Percent className="w-4 h-4 text-agri-green mb-2" />
          <p className="text-xs text-zinc-500">Notre marge</p>
          <p className="font-bold text-lg tabular-nums">
            {margin === null ? '—' : `${margin.toFixed(1)} %`}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
            Affichée sur chaque pari. Comparez-la.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
          <ShieldCheck className="w-4 h-4 text-agri-green mb-2" />
          <p className="text-xs text-zinc-500">Matchs virtuels</p>
          <p className="font-bold text-lg">Scellés</p>
          <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
            Résultat tiré avant les paris, vérifiable après.
          </p>
        </div>
      </div>

      {openBets.length > 0 && (
        <Link
          href="/mes-paris"
          className="flex items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Ticket className="w-4 h-4 text-agri-green" />
            {openBets.length} pari{openBets.length > 1 ? 's' : ''} en cours
          </span>
          <ArrowRight className="w-4 h-4 text-zinc-400" />
        </Link>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">Prochains matchs</h2>
          <Link href="/paris" className="text-xs text-agri-green font-semibold">
            Tout voir
          </Link>
        </div>

        {next.length === 0 ? (
          <p className="text-sm text-zinc-500 py-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            Aucun match ouvert pour le moment.
          </p>
        ) : (
          <div className="space-y-2">
            {next.map((f) => (
              <Link
                key={f.id}
                href="/paris"
                className="flex items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3"
              >
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                    {f.competition}
                  </p>
                  <p className="font-semibold text-sm truncate">
                    {f.homeTeam} — {f.awayTeam}
                  </p>
                </div>
                <span className="text-xs tabular-nums text-zinc-500 shrink-0 ml-3">
                  {new Date(f.kickoffAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-zinc-400 text-center leading-relaxed px-4">
        Les paris comportent un risque de perte. Jouez de manière responsable.
        Interdit aux personnes de moins de 18 ans.
      </p>
    </div>
  );
}
