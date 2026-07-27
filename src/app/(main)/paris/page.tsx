'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Info, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Fixture {
    id: string;
    kind: 'REAL' | 'VIRTUAL';
    competition: string;
    homeTeam: string;
    awayTeam: string;
    kickoffAt: string;
    /** Probabilites en points de base, [buts domicile][buts exterieur]. */
    grid: number[][];
    resultCommitment: string | null;
}

interface FixturesResponse {
    marginPercent: number;
    cashbackPercent: number;
    cashbackMinSelections: number;
    stakeMin: number;
    stakeMax: number;
    gridMax: number;
    fixtures: Fixture[];
}

const STAKE_PRESETS = [500, 1000, 2000, 5000, 10000];

export default function ParisPage() {
    const [data, setData] = useState<FixturesResponse | null>(null);
    const [kind, setKind] = useState<'VIRTUAL' | 'REAL'>('VIRTUAL');
    const [fixtureId, setFixtureId] = useState<string | null>(null);
    const [excluded, setExcluded] = useState<string[]>([]);
    const [stake, setStake] = useState(1000);
    const [placing, setPlacing] = useState(false);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    useEffect(() => {
        fetch('/api/fixtures')
            .then((r) => r.json())
            .then((d) => {
                // L'API renvoie { message } en cas d'erreur : la forme attendue
                // n'est pas garantie par le simple fait d'avoir une reponse.
                if (!d || !Array.isArray(d.fixtures)) {
                    setMessage({ ok: false, text: 'Matchs indisponibles pour le moment' });
                    return;
                }
                setData(d);
            })
            .catch(() => setMessage({ ok: false, text: 'Chargement impossible' }));
    }, []);

    const fixtures = useMemo(
        () => data?.fixtures?.filter((f) => f.kind === kind) ?? [],
        [data, kind],
    );

    const fixture = useMemo(
        () => fixtures.find((f) => f.id === fixtureId) ?? fixtures[0] ?? null,
        [fixtures, fixtureId],
    );

    // Reinitialise la selection des qu'on change de match : une grille de
    // probabilites differente rend les cases precedentes sans objet.
    useEffect(() => {
        setExcluded([]);
        setMessage(null);
    }, [fixture?.id]);

    /**
     * Cote indicative, calculee avec exactement la meme formule que le serveur.
     * Elle sert a l'affichage pendant que le joueur coche : celle qui engage
     * la plateforme est recalculee au placement.
     */
    const quote = useMemo(() => {
        if (!fixture || !data || excluded.length === 0) return null;

        let riskBp = 0;
        for (const key of excluded) {
            const [h, a] = key.split('-').map(Number);
            riskBp += fixture.grid[h][a];
        }

        const pLose = riskBp / 10_000;
        const pWin = 1 - pLose;
        if (pWin <= 0.01) return { impossible: true } as const;

        const cashbackBp =
            excluded.length >= data.cashbackMinSelections ? data.cashbackPercent * 100 : 0;

        const netMargin = data.marginPercent / 100 + (cashbackBp / 10_000) * pLose;
        const odds = (1 / pWin) * (1 - netMargin);

        if (odds <= 1.01) return { impossible: true } as const;

        return {
            impossible: false as const,
            odds,
            riskPercent: pLose * 100,
            win: Math.floor((stake * Math.floor(odds * 1000)) / 1000),
            cashback: Math.floor((stake * cashbackBp) / 10_000),
        };
    }, [fixture, data, excluded, stake]);

    function toggle(h: number, a: number) {
        const key = `${h}-${a}`;
        setExcluded((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
        );
        setMessage(null);
    }

    async function placeBet() {
        if (!fixture || !quote || quote.impossible) return;
        setPlacing(true);
        setMessage(null);

        try {
            const res = await fetch('/api/bets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fixtureId: fixture.id,
                    stake,
                    selections: excluded.map((k) => {
                        const [homeGoals, awayGoals] = k.split('-').map(Number);
                        return { homeGoals, awayGoals };
                    }),
                }),
            });
            const json = await res.json();

            if (!res.ok) {
                setMessage({ ok: false, text: json.message ?? 'Pari refuse' });
            } else {
                setMessage({
                    ok: true,
                    text: `Pari place — cote ${json.bet.odds.toFixed(2)}, gain ${json.bet.potentialWin.toLocaleString('fr-FR')} F`,
                });
                setExcluded([]);
            }
        } catch {
            setMessage({ ok: false, text: 'Reseau indisponible' });
        } finally {
            setPlacing(false);
        }
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center py-24 text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin" />
            </div>
        );
    }

    const gridRange = Array.from({ length: data.gridMax + 1 }, (_, i) => i);

    return (
        <div className="pb-28 px-4 max-w-2xl mx-auto">
            <header className="pt-6 pb-4">
                <h1 className="text-2xl font-bold tracking-tight">Pari inversé</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Écartez les scores qui n&apos;arriveront pas. Plus vous en écartez, plus la cote monte.
                </p>
            </header>

            {/* La marge affichee est l'argument produit : elle se verifie. */}
            <div className="flex items-center gap-2 text-xs bg-zinc-100 dark:bg-zinc-800/60 rounded-xl px-3 py-2 mb-4">
                <Info className="w-3.5 h-3.5 shrink-0 text-agri-green" />
                <span className="text-zinc-600 dark:text-zinc-300">
                    Notre marge est de <b>{data.marginPercent.toFixed(1)} %</b>, affichée sur chaque pari.
                    Comparez-la.
                </span>
            </div>

            <div className="flex gap-2 mb-4">
                {(['VIRTUAL', 'REAL'] as const).map((k) => (
                    <button
                        key={k}
                        onClick={() => { setKind(k); setFixtureId(null); }}
                        className={cn(
                            'flex-1 py-2 rounded-xl text-sm font-semibold transition-colors',
                            kind === k
                                ? 'bg-agri-green text-white'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
                        )}
                    >
                        {k === 'VIRTUAL' ? 'Virtuel' : 'Matchs réels'}
                    </button>
                ))}
            </div>

            {fixtures.length === 0 && (
                <p className="text-sm text-zinc-500 py-10 text-center">
                    Aucun match ouvert pour le moment.
                </p>
            )}

            {fixtures.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
                    {fixtures.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFixtureId(f.id)}
                            className={cn(
                                'shrink-0 text-left px-3 py-2 rounded-xl border text-xs min-w-[150px]',
                                fixture?.id === f.id
                                    ? 'border-agri-green bg-agri-green/5'
                                    : 'border-zinc-200 dark:border-zinc-800',
                            )}
                        >
                            <span className="block text-[10px] uppercase tracking-wider text-zinc-400">
                                {new Date(f.kickoffAt).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit', minute: '2-digit',
                                })}
                            </span>
                            <span className="block font-semibold mt-0.5">{f.homeTeam}</span>
                            <span className="block font-semibold">{f.awayTeam}</span>
                        </button>
                    ))}
                </div>
            )}

            {fixture && (
                <>
                    <div className="overflow-x-auto -mx-4 px-4">
                        <table className="mx-auto border-separate border-spacing-1">
                            <thead>
                                <tr>
                                    <th className="text-[9px] text-zinc-400 font-normal leading-tight">
                                        DOM ↓<br />EXT →
                                    </th>
                                    {gridRange.map((a) => (
                                        <th key={a} className="text-[10px] text-zinc-400 font-normal w-12">
                                            {a}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {gridRange.map((h) => (
                                    <tr key={h}>
                                        <th className="text-[10px] text-zinc-400 font-normal pr-1">{h}</th>
                                        {gridRange.map((a) => {
                                            const key = `${h}-${a}`;
                                            const on = excluded.includes(key);
                                            const bp = fixture.grid[h][a];
                                            return (
                                                <td key={a}>
                                                    <button
                                                        onClick={() => toggle(h, a)}
                                                        aria-pressed={on}
                                                        className={cn(
                                                            'w-12 h-11 rounded-lg border flex flex-col items-center justify-center transition-colors',
                                                            on
                                                                ? 'border-red-500 bg-red-500/10 text-red-500'
                                                                : 'border-zinc-200 dark:border-zinc-800 text-zinc-500',
                                                        )}
                                                    >
                                                        <span className={cn('text-xs font-semibold tabular-nums', on && 'line-through')}>
                                                            {h}-{a}
                                                        </span>
                                                        <span className="text-[9px] tabular-nums opacity-60">
                                                            {(bp / 100).toFixed(1)}%
                                                        </span>
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex gap-2 mt-5 overflow-x-auto pb-1">
                        {STAKE_PRESETS.filter((s) => s >= data.stakeMin && s <= data.stakeMax).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStake(s)}
                                className={cn(
                                    'shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold tabular-nums border',
                                    stake === s
                                        ? 'border-agri-green bg-agri-green/10 text-agri-green'
                                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500',
                                )}
                            >
                                {s.toLocaleString('fr-FR')} F
                            </button>
                        ))}
                    </div>

                    <motion.div
                        layout
                        className="mt-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
                    >
                        {excluded.length === 0 && (
                            <p className="text-sm text-zinc-400 text-center py-3">
                                Touchez les scores qui n&apos;arriveront pas.
                            </p>
                        )}

                        {quote?.impossible && (
                            <p className="text-sm text-amber-600 dark:text-amber-500 text-center py-3">
                                Trop de scores écartés — il ne reste presque aucune chance de gagner.
                            </p>
                        )}

                        {quote && !quote.impossible && (
                            <>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {excluded.map((k) => (
                                        <span
                                            key={k}
                                            className="text-xs tabular-nums px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 border border-red-500/30"
                                        >
                                            {k}
                                        </span>
                                    ))}
                                </div>

                                <Row label="Risque cumulé" value={`${quote.riskPercent.toFixed(1)} %`} />
                                <Row label="Mise" value={`${stake.toLocaleString('fr-FR')} F`} />
                                <Row label="Cote" value={quote.odds.toFixed(2)} strong />
                                <Row
                                    label="Gain si aucun ne tombe"
                                    value={`${quote.win.toLocaleString('fr-FR')} F`}
                                    strong
                                />
                                {quote.cashback > 0 && (
                                    <Row
                                        label="Remboursé si perdu"
                                        value={`${quote.cashback.toLocaleString('fr-FR')} F`}
                                    />
                                )}

                                <button
                                    onClick={placeBet}
                                    disabled={placing}
                                    className="w-full mt-4 py-3 rounded-xl bg-agri-green text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {placing && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Placer {stake.toLocaleString('fr-FR')} F
                                </button>
                            </>
                        )}

                        {message && (
                            <p
                                className={cn(
                                    'text-xs text-center mt-3 flex items-center justify-center gap-1.5',
                                    message.ok ? 'text-agri-green' : 'text-red-500',
                                )}
                            >
                                {message.ok && <Check className="w-3.5 h-3.5" />}
                                {message.text}
                            </p>
                        )}
                    </motion.div>

                    {fixture.kind === 'VIRTUAL' && fixture.resultCommitment && (
                        <div className="mt-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 p-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-agri-green" />
                                Résultat scellé avant les paris
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                Le score est déjà tiré. Notez cette empreinte : après le match, la graine
                                sera révélée et vous pourrez vérifier qu&apos;elle n&apos;a pas changé.
                            </p>
                            <code className="block mt-1.5 text-[10px] break-all text-zinc-400">
                                {fixture.resultCommitment}
                            </code>
                            <a
                                href={`/api/fixtures/${fixture.id}/verify`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block mt-1.5 text-[11px] text-agri-green font-medium"
                            >
                                Vérifier ce tirage →
                            </a>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className="flex justify-between items-baseline py-1.5 border-t border-zinc-100 dark:border-zinc-800 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400 text-xs">{label}</span>
            <span className={cn('tabular-nums', strong ? 'font-bold text-agri-green text-base' : 'font-semibold')}>
                {value}
            </span>
        </div>
    );
}
