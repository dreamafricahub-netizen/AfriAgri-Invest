'use client';

import { motion } from "framer-motion";
import { TrendingUp, Leaf, ArrowRight, Shield, Users, Banknote, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useSession } from 'next-auth/react';
import { useUserData } from '@/hooks/useUserData';

export default function Home() {
  const { data: session } = useSession();
  const { userData, loading } = useUserData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
        <p className="text-zinc-500">Chargement de ta ferme...</p>
      </div>
    );
  }

  const balance = userData?.balance || 0;
  const investedCapital = userData?.investedCapital || 0;
  const investments = userData?.investments || [];
  const transactions = userData?.transactions || [];

  const highestPack = investments.length > 0 ? Math.max(...investments.map(f => f.packId)) : 0;
  let farmIcon = "🌱";
  let farmLabel = "Petite Pousse";

  if (highestPack >= 3) { farmIcon = "🌳"; farmLabel = "Verger Florissant"; }
  if (highestPack >= 5) { farmIcon = "🚜"; farmLabel = "Exploitation Agricole"; }
  if (highestPack >= 7) { farmIcon = "🏭"; farmLabel = "Domaine Industriel"; }
  if (highestPack >= 8) { farmIcon = "🏰"; farmLabel = "Empire Agri-Tech"; }

  const chartData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    value: Math.floor((investedCapital || 10000) * Math.pow(1.035, i))
  }));

  const todayGain = transactions.find(t => t.type === 'GAIN')?.amount || 0;

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 max-w-5xl mx-auto w-full">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/10 p-4 rounded-2xl border border-green-100 dark:border-green-900"
      >
        <div>
          <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wider">
            {investments.length} ferme{investments.length > 1 ? 's' : ''} active{investments.length > 1 ? 's' : ''}
          </p>
          <h2 className="text-xl font-bold text-green-900 dark:text-green-100">
            Bienvenue{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''} !
          </h2>
        </div>
        <div className="text-center">
          <div className="text-3xl animate-bounce">{farmIcon}</div>
        </div>
      </motion.div>

      {/* Trust Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex flex-col items-center p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <Users className="w-5 h-5 text-blue-500 mb-1" />
          <p className="text-lg font-black text-zinc-800 dark:text-zinc-100">12,847</p>
          <p className="text-[10px] text-zinc-400 text-center leading-tight">Investisseurs actifs</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex flex-col items-center p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <Banknote className="w-5 h-5 text-green-500 mb-1" />
          <p className="text-lg font-black text-zinc-800 dark:text-zinc-100">2.4 Mrd</p>
          <p className="text-[10px] text-zinc-400 text-center leading-tight">FCFA investis</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex flex-col items-center p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-amber-500 mb-1" />
          <p className="text-lg font-black text-zinc-800 dark:text-zinc-100">98.7%</p>
          <p className="text-[10px] text-zinc-400 text-center leading-tight">Taux de satisfaction</p>
        </motion.div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <p className="text-zinc-500 text-xs mb-1">Gain Aujourd'hui</p>
          <p className="text-xl font-bold text-agri-gold">+{todayGain.toLocaleString()} F</p>
        </div>
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <p className="text-zinc-500 text-xs mb-1">Capital Investi</p>
          <p className="text-xl font-bold text-agri-blue">{investedCapital.toLocaleString()} F</p>
        </div>
        <div className="hidden md:block p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <p className="text-zinc-500 text-xs mb-1">Fermes Actives</p>
          <p className="text-xl font-bold text-zinc-700 dark:text-zinc-300">{investments.length}</p>
        </div>
        <div className="hidden md:block p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <p className="text-zinc-500 text-xs mb-1">Solde Disponible</p>
          <p className="text-xl font-bold text-green-500">{balance.toLocaleString()} F</p>
        </div>
      </div>

      {/* Farm Visual */}
      <motion.div
        layout
        className="bg-green-500 text-white p-6 rounded-3xl relative overflow-hidden min-h-[180px] flex flex-col justify-center items-center shadow-lg shadow-green-500/20"
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="text-6xl mb-2 z-10"
        >
          {farmIcon}
        </motion.div>
        <h3 className="text-2xl font-bold z-10">{highestPack === 0 ? "Aucune Ferme" : farmLabel}</h3>
        <p className="text-green-100 z-10 text-sm">
          {highestPack === 0 ? "Commence a investir pour planter !" : "Tes recoltes poussent bien."}
        </p>

        {highestPack === 0 && (
          <Link href="/investir" className="mt-4 bg-white text-green-600 px-6 py-2 rounded-full font-bold shadow-md hover:scale-105 transition-transform z-10 flex items-center gap-2">
            Planter <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </motion.div>

      {/* Chart */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Croissance Estimee</h3>
          <span className="text-xs text-green-500 font-bold bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">+3.5% / Jour</span>
        </div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`${value.toLocaleString()} F`, 'Capital']}
                labelFormatter={(label) => `Jour ${label}`}
              />
              <Area type="monotone" dataKey="value" stroke="#4CAF50" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weather & News */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-sky-400 to-blue-500 p-4 rounded-2xl text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-blue-100 text-xs font-bold uppercase">Meteo Agricole</p>
                <h3 className="text-2xl font-bold">Grand Soleil</h3>
              </div>
              <div className="text-4xl">☀️</div>
            </div>
            <div className="flex gap-4 text-sm font-medium">
              <div className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">🌡️ 28°C</div>
              <div className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">💧 65% Hum.</div>
            </div>
            <p className="mt-4 text-xs text-blue-100">Conditions ideales pour une croissance rapide de vos cultures aujourd'hui.</p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-9xl opacity-10">🌤️</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 p-1 rounded-md text-xs font-black">LIVE</span>
            Actualites
          </h3>
          <div className="space-y-3">
            <div className="flex gap-3 items-start border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 shrink-0"></div>
              <div>
                <p className="text-sm font-medium leading-tight">Le cacao en hausse de 4% sur les marches mondiaux.</p>
                <span className="text-[10px] text-zinc-400">Il y a 2h</span>
              </div>
            </div>
            <div className="flex gap-3 items-start border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-agri-gold shrink-0"></div>
              <div>
                <p className="text-sm font-medium leading-tight">Nouveaux equipements disponibles pour les Fermes Familiales.</p>
                <span className="text-[10px] text-zinc-400">Il y a 5h</span>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0"></div>
              <div>
                <p className="text-sm font-medium leading-tight">Partenariat signe avec 3 cooperatives en Cote d'Ivoire.</p>
                <span className="text-[10px] text-zinc-400">Il y a 8h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <h3 className="font-bold text-lg mb-4">Ce que disent nos investisseurs</h3>
        <div className="space-y-4">
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-lg shrink-0">👨🏿</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm">Kouame A.</span>
                <span className="text-[10px] text-zinc-400">Abidjan</span>
                <span className="text-yellow-500 text-xs">★★★★★</span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">"J'ai commence avec 10 000 FCFA et en 2 mois j'ai pu retirer plus de 50 000 F. C'est serieux, les paiements arrivent toujours a temps."</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-lg shrink-0">👩🏾</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm">Fatou D.</span>
                <span className="text-[10px] text-zinc-400">Dakar</span>
                <span className="text-yellow-500 text-xs">★★★★★</span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">"L'application est simple et claire. Je recommande a toutes mes amies. Mes gains augmentent chaque jour."</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-lg shrink-0">👨🏾</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm">Ibrahim T.</span>
                <span className="text-[10px] text-zinc-400">Douala</span>
                <span className="text-yellow-500 text-xs">★★★★★</span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">"Pack Domaine Agricole achete en janvier. Deja 3x mon investissement. L'equipe repond vite sur WhatsApp."</p>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-6">
        <h3 className="font-bold text-lg">Comment ca marche ?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center text-xl font-bold">1</div>
            <h4 className="font-bold">Investissez</h4>
            <p className="text-sm text-zinc-500">Choisissez un pack de ferme adapte a votre budget via Mobile Money.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center text-xl font-bold">2</div>
            <h4 className="font-bold">Cultivez</h4>
            <p className="text-sm text-zinc-500">Nos experts gerent les plantations. Suivez la meteo et la croissance en direct.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center text-xl font-bold">3</div>
            <h4 className="font-bold">Recoltez</h4>
            <p className="text-sm text-zinc-500">Recevez vos gains composes chaque jour et retirez quand vous voulez.</p>
          </div>
        </div>
      </div>

      {/* Revenue Model */}
      <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/20">
        <h3 className="font-bold text-lg text-amber-900 dark:text-amber-100 mb-2">D'ou viennent les gains ?</h3>
        <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
          Vos investissements financent directement l'achat de semences, d'engrais et d'equipements pour des cooperatives agricoles partenaires.
          La vente des recoltes sur les marches locaux et internationaux genere des benefices reels, que nous partageons avec vous sous forme de rendements journaliers.
        </p>
      </div>

      {/* Security & Trust */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-green-600" />
          <h3 className="font-bold text-lg">Securite & Garanties</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-sm">Fonds securises</p>
              <p className="text-xs text-zinc-500">Vos investissements sont proteges par des contrats avec nos cooperatives partenaires.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-sm">Retrait a tout moment</p>
              <p className="text-xs text-zinc-500">Retirez vos gains vers Mobile Money (MTN, Orange, Moov) en moins de 24h.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-sm">Support WhatsApp 24/7</p>
              <p className="text-xs text-zinc-500">Notre equipe est disponible a tout moment pour repondre a vos questions.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-sm">+12 000 utilisateurs</p>
              <p className="text-xs text-zinc-500">Rejoignez une communaute d'investisseurs dans toute l'Afrique de l'Ouest.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Partners */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm text-center">
        <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-4">Nos partenaires de confiance</p>
        <div className="flex justify-center items-center gap-6 flex-wrap opacity-60">
          <span className="text-sm font-black text-zinc-400">MTN MoMo</span>
          <span className="text-zinc-300">|</span>
          <span className="text-sm font-black text-zinc-400">Orange Money</span>
          <span className="text-zinc-300">|</span>
          <span className="text-sm font-black text-zinc-400">Moov Money</span>
          <span className="text-zinc-300">|</span>
          <span className="text-sm font-black text-zinc-400">Wave</span>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pb-8">
        <Link href="/investir" className="block w-full bg-agri-gold hover:bg-yellow-400 text-black font-bold py-4 rounded-xl shadow-lg shadow-yellow-500/20 transition-all active:scale-95">
          Commencer a Investir
        </Link>
      </div>
    </div>
  );
}
