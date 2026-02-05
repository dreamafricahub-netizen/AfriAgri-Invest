'use client';

import { useState } from "react";
import { Calendar, TrendingUp, Info, Zap, Loader2 } from "lucide-react";
import { PACKS } from "@/utils/packs";
import { motion } from "framer-motion";
import Link from "next/link";
import { useUserData } from "@/hooks/useUserData";

export default function GainsPage() {
    const { userData, loading } = useUserData();
    const investedCapital = userData?.investedCapital || 0;
    const investments = userData?.investments || [];
    const [days, setDays] = useState(30);
    const [selectedBase, setSelectedBase] = useState<number | null>(null);

    const bases = [3000, 10000, 25000, 50000, 100000];
    const initialCapital = selectedBase || (investedCapital > 0 ? investedCapital : 3000);
    const finalCapital = Math.floor(initialCapital * Math.pow(1.035, days));
    const profit = finalCapital - initialCapital;
    const roi = ((profit / initialCapital) * 100).toFixed(0);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDays(parseInt(e.target.value));
    };

    return (
        <div className="p-4 space-y-6 pb-8">
            {/* Main Simulator Card */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm text-center">
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">Simulateur de Gains</h2>
                <motion.div
                    key={profit}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-black text-agri-gold mb-1"
                >
                    +{profit.toLocaleString()} F
                </motion.div>
                <p className="text-zinc-400 text-sm mb-3">Profit estime apres {days} jours</p>
                <div className="flex justify-center gap-3 text-xs">
                    <span className="bg-green-50 dark:bg-green-900/20 text-green-600 px-3 py-1 rounded-full font-bold">ROI: {roi}%</span>
                    <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-3 py-1 rounded-full font-bold">Capital: {finalCapital.toLocaleString()} F</span>
                </div>
            </div>

            {/* Quick Capital Selector */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase mb-3">Simuler avec un montant</p>
                <div className="flex gap-2 flex-wrap">
                    {bases.map(base => (
                        <button
                            key={base}
                            onClick={() => setSelectedBase(base === selectedBase ? null : base)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                selectedBase === base
                                    ? 'bg-green-600 text-white shadow-md'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                        >
                            {base.toLocaleString()} F
                        </button>
                    ))}
                </div>
                {!selectedBase && investedCapital > 0 && (
                    <p className="text-[10px] text-zinc-400 mt-2">Base actuelle: {investedCapital.toLocaleString()} F (ton capital investi)</p>
                )}
            </div>

            {/* Duration Slider */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between mb-4">
                    <span className="font-bold flex items-center gap-2"><Calendar className="w-4 h-4" /> Duree</span>
                    <span className="text-agri-green font-bold">{days} Jours</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="90"
                    value={days}
                    onChange={handleSliderChange}
                    className="w-full accent-agri-green h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-zinc-400 mt-2">
                    <span>1 Jour</span>
                    <span>30 Jours</span>
                    <span>60 Jours</span>
                    <span>90 Jours</span>
                </div>
            </div>

            {/* Milestones */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" /> Paliers de croissance
                </h3>
                <div className="grid grid-cols-3 gap-3">
                    {[7, 30, 60].map(d => {
                        const val = Math.floor(initialCapital * Math.pow(1.035, d));
                        const gain = val - initialCapital;
                        return (
                            <div key={d} className={`p-3 rounded-xl text-center ${d === days ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-zinc-50 dark:bg-zinc-800'}`}>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase">{d}j</p>
                                <p className="text-sm font-black text-green-600">+{gain.toLocaleString()}</p>
                                <p className="text-[10px] text-zinc-500">{val.toLocaleString()} F</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Daily Breakdown Table */}
            <div className="space-y-3">
                <h3 className="font-bold text-lg">Detail par jour (Base: {initialCapital.toLocaleString()} F)</h3>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                            <tr>
                                <th className="py-3 px-4 text-left">Jour</th>
                                <th className="py-3 px-4 text-right">Capital</th>
                                <th className="py-3 px-4 text-right text-green-600">Gain</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {Array.from({ length: Math.min(days, 10) }, (_, i) => i + 1).map((d) => {
                                const cap = Math.floor(initialCapital * Math.pow(1.035, d));
                                const prevCap = Math.floor(initialCapital * Math.pow(1.035, d - 1));
                                return (
                                    <tr key={d} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50">
                                        <td className="py-3 px-4 font-medium">Jour {d}</td>
                                        <td className="py-3 px-4 text-right">{cap.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right text-green-600 font-bold">+{(cap - prevCap).toLocaleString()}</td>
                                    </tr>
                                );
                            })}
                            {days > 10 && (
                                <tr>
                                    <td colSpan={3} className="py-3 px-4 text-center text-zinc-400 text-xs italic">...suite jusqu'au jour {days}</td>
                                </tr>
                            )}
                            <tr className="bg-green-50 dark:bg-green-900/10 font-bold">
                                <td className="py-3 px-4">Jour {days}</td>
                                <td className="py-3 px-4 text-right">{finalCapital.toLocaleString()}</td>
                                <td className="py-3 px-4 text-right text-green-600">+{profit.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pack Comparison */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <h3 className="font-bold text-lg mb-1">Comparer les packs</h3>
                <p className="text-xs text-zinc-500 mb-4">Rendement sur 30 jours pour chaque pack</p>
                <div className="space-y-3">
                    {PACKS.slice(0, 5).map(pack => {
                        const packProfit = pack.profit30Days;
                        const barWidth = (packProfit / PACKS[4].profit30Days) * 100;
                        const isOwned = investments.some(f => f.packId === pack.id);
                        return (
                            <div key={pack.id} className="flex items-center gap-3">
                                <div className="w-24 text-xs font-medium truncate shrink-0">{pack.name}</div>
                                <div className="flex-1 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${barWidth}%` }}
                                        viewport={{ once: true }}
                                        className={`h-full rounded-full ${isOwned ? 'bg-green-500' : 'bg-agri-gold'}`}
                                    />
                                </div>
                                <span className="text-xs font-bold w-20 text-right text-green-600">+{packProfit.toLocaleString()}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Compound Explanation */}
            <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                <div className="flex gap-3 items-start">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">Comment fonctionne l'interet compose ?</h4>
                        <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                            Chaque jour, votre gain de 3.5% est calcule sur le capital total (initial + gains precedents).
                            Ainsi, vos gains augmentent chaque jour : c'est l'effet boule de neige. Plus vous investissez tot, plus vos rendements sont importants.
                        </p>
                    </div>
                </div>
            </div>

            {/* Referral CTA */}
            <div className="p-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl text-white text-center shadow-lg relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                <h3 className="font-bold text-xl mb-1">Programme de Parrainage</h3>
                <p className="text-sm opacity-90 mb-4">Invite tes amis et gagne 10% de leurs investissements en bonus permanent !</p>
                <button className="bg-white text-purple-600 px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform">
                    Partager mon lien
                </button>
            </div>

            {/* Invest CTA */}
            {investments.length === 0 && (
                <Link href="/investir" className="block w-full bg-green-600 hover:bg-green-700 text-white text-center font-bold py-4 rounded-xl shadow-lg shadow-green-500/30 transition-all active:scale-95">
                    Investir maintenant
                </Link>
            )}
        </div>
    );
}
