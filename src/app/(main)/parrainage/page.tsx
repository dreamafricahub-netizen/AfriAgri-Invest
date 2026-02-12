'use client';

import { useState } from 'react';
import { ArrowLeft, Copy, Check, Share2, Users, TrendingUp, Gift, ChevronRight, Crown, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useReferralData } from '@/hooks/useUserData';

export default function ParrainagePage() {
    const { referralData, loading } = useReferralData();
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending'>('all');

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
                <p className="text-zinc-500">Chargement des parrainages...</p>
            </div>
        );
    }

    const referralCode = referralData?.referralCode || 'INVITE00';
    const referralLink = `https://afriagriinvest.vercel.app/r/${referralCode}`;
    const filleuls = referralData?.filleuls || [];
    const stats = referralData?.stats || {
        totalFilleuls: 0,
        activeFilleuls: 0,
        totalBonus: 0,
        totalInvestedByFilleuls: 0,
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            const textArea = document.createElement('textarea');
            textArea.value = referralLink;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Rejoins AfriAgri Invest !',
                    text: 'Investis dans l\'agriculture africaine et gagne 3.5% par jour. Utilise mon lien pour t\'inscrire et recevoir un bonus !',
                    url: referralLink,
                });
            } catch (err) {
                handleCopyLink();
            }
        } else {
            handleCopyLink();
        }
    };

    // Filtered filleuls
    const pendingFilleuls = filleuls.filter(f => f.status === 'pending').length;
    const filteredFilleuls = activeTab === 'all'
        ? filleuls
        : filleuls.filter(f => f.status === activeTab);

    // Rank based on number of filleuls
    const totalFilleuls = stats.totalFilleuls;
    let rank = 'Debutant';
    let rankColor = 'text-zinc-500';
    let rankBg = 'bg-zinc-100 dark:bg-zinc-800';
    let nextRank = 'Bronze';
    let filleulsToNext = 2 - totalFilleuls;

    if (totalFilleuls >= 2) { rank = 'Bronze'; rankColor = 'text-amber-700'; rankBg = 'bg-amber-100 dark:bg-amber-900/20'; nextRank = 'Argent'; filleulsToNext = 10 - totalFilleuls; }
    if (totalFilleuls >= 10) { rank = 'Argent'; rankColor = 'text-zinc-500'; rankBg = 'bg-zinc-200 dark:bg-zinc-700'; nextRank = 'Or'; filleulsToNext = 25 - totalFilleuls; }
    if (totalFilleuls >= 25) { rank = 'Or'; rankColor = 'text-yellow-600'; rankBg = 'bg-yellow-100 dark:bg-yellow-900/20'; nextRank = 'Platine'; filleulsToNext = 50 - totalFilleuls; }
    if (totalFilleuls >= 50) { rank = 'Platine'; rankColor = 'text-blue-600'; rankBg = 'bg-blue-100 dark:bg-blue-900/20'; nextRank = 'Diamant'; filleulsToNext = 100 - totalFilleuls; }
    if (totalFilleuls >= 100) { rank = 'Diamant'; rankColor = 'text-purple-600'; rankBg = 'bg-purple-100 dark:bg-purple-900/20'; nextRank = ''; filleulsToNext = 0; }

    return (
        <div className="p-4 space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center gap-3 pt-2">
                <Link href="/profil" className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-black">Mon Parrainage</h1>
                    <p className="text-xs text-zinc-500">Gagne 10% sur chaque investissement</p>
                </div>
            </div>

            {/* Referral Link Card */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-5 rounded-2xl text-white relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Share2 className="w-5 h-5" />
                        <h3 className="font-bold">Ton lien de parrainage</h3>
                    </div>

                    {/* Link display */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mb-4">
                        <p className="text-xs text-green-100 mb-1">Ton code : <span className="font-black text-white">{referralCode}</span></p>
                        <p className="text-sm font-mono break-all">{referralLink}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleCopyLink}
                            className="flex-1 bg-white text-green-600 py-3 rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                        >
                            {copied ? <><Check className="w-4 h-4" /> Copie !</> : <><Copy className="w-4 h-4" /> Copier</>}
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex-1 bg-white/20 text-white py-3 rounded-xl font-bold text-sm hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
                        >
                            <Share2 className="w-4 h-4" /> Partager
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800"
                >
                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-2">
                        <Users className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-2xl font-black">{stats.totalFilleuls}</p>
                    <p className="text-[10px] text-zinc-500">Filleuls {stats.activeFilleuls > 0 && `(${stats.activeFilleuls} actifs)`}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800"
                >
                    <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-2">
                        <Gift className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-black text-green-600">{stats.totalBonus > 0 ? `+${stats.totalBonus.toLocaleString()}` : '0'} F</p>
                    <p className="text-[10px] text-zinc-500">Bonus total gagne</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800"
                >
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-black">{stats.totalInvestedByFilleuls.toLocaleString()} F</p>
                    <p className="text-[10px] text-zinc-500">Investi par tes filleuls</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800"
                >
                    <div className={`w-10 h-10 ${rankBg} rounded-full flex items-center justify-center mb-2`}>
                        <Crown className={`w-5 h-5 ${rankColor}`} />
                    </div>
                    <p className={`text-2xl font-black ${rankColor}`}>{rank}</p>
                    <p className="text-[10px] text-zinc-500">Ton rang parrain</p>
                </motion.div>
            </div>

            {/* Rank Progress */}
            {nextRank && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold">Progression vers {nextRank}</span>
                        <span className="text-xs text-zinc-500">{filleulsToNext > 0 ? `${filleulsToNext} filleuls restants` : 'Objectif atteint !'}</span>
                    </div>
                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, (totalFilleuls / (totalFilleuls + filleulsToNext)) * 100))}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-2">
                        {rank === 'Debutant'
                            ? 'Parraine 2 personnes pour atteindre le rang Bronze'
                            : `Rang ${nextRank} = bonus exclusifs + badge special sur ton profil`
                        }
                    </p>
                </div>
            )}

            {/* How it works */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" /> Comment ca marche ?
                </h3>
                <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                        <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">1</div>
                        <div>
                            <p className="font-bold text-sm">Partage ton lien</p>
                            <p className="text-xs text-zinc-500">Envoie ton lien a tes amis, famille ou sur les reseaux sociaux</p>
                        </div>
                    </div>
                    <div className="flex gap-3 items-start">
                        <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">2</div>
                        <div>
                            <p className="font-bold text-sm">Ils s'inscrivent</p>
                            <p className="text-xs text-zinc-500">Tes filleuls creent un compte avec ton lien de parrainage</p>
                        </div>
                    </div>
                    <div className="flex gap-3 items-start">
                        <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">3</div>
                        <div>
                            <p className="font-bold text-sm">Tu gagnes 10% a vie</p>
                            <p className="text-xs text-zinc-500">Sur CHAQUE investissement de tes filleuls, sans limite de temps</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filleuls List */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">Mes Filleuls</h3>
                    {filleuls.length > 0 && (
                        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${activeTab === 'all' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}
                            >
                                Tous ({filleuls.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${activeTab === 'active' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}
                            >
                                Actifs ({stats.activeFilleuls})
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${activeTab === 'pending' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}
                            >
                                En attente ({pendingFilleuls})
                            </button>
                        </div>
                    )}
                </div>

                {filleuls.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <div className="text-4xl mb-3">👥</div>
                        <p className="text-zinc-500 text-sm font-medium">Tu n'as pas encore de filleuls</p>
                        <p className="text-zinc-400 text-xs mt-1 max-w-xs mx-auto">Partage ton lien de parrainage pour inviter tes amis et commencer a gagner 10% sur leurs investissements</p>
                        <button
                            onClick={handleCopyLink}
                            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-bold text-sm transition-colors"
                        >
                            {copied ? 'Lien copie !' : 'Copier mon lien'}
                        </button>
                    </div>
                ) : filteredFilleuls.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <div className="text-4xl mb-3">📭</div>
                        <p className="text-zinc-500 text-sm font-medium">Aucun filleul dans cette categorie</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredFilleuls.map((filleul, index) => (
                            <motion.div
                                key={filleul.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 ${filleul.status === 'active' ? 'bg-green-500' : 'bg-zinc-400'} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                                        {filleul.initials}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-sm">{filleul.name}</p>
                                            {filleul.status === 'active' && (
                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-zinc-500">
                                            {filleul.city} • Inscrit le {filleul.joinedDate}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {filleul.status === 'active' ? (
                                        <>
                                            <p className="font-black text-green-600">+{filleul.myBonus.toLocaleString()} F</p>
                                            <p className="text-[10px] text-zinc-400">sur {filleul.totalInvested.toLocaleString()} F</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-bold text-zinc-400 text-sm">En attente</p>
                                            <p className="text-[10px] text-zinc-400">Pas encore investi</p>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bonus History - only show if there are bonuses */}
            {stats.totalBonus > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-sm">Historique des bonus</h3>
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="space-y-2">
                        {filleuls.filter(f => f.myBonus > 0).map((f, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-50 dark:border-zinc-800 last:border-0">
                                <div className="flex items-center gap-2">
                                    <Gift className="w-4 h-4 text-green-500" />
                                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Bonus de {f.name}</span>
                                </div>
                                <span className="text-xs font-bold text-green-600">+{f.myBonus.toLocaleString()} F</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tips */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Conseils pour parrainer</p>
                <ul className="space-y-2 text-xs text-zinc-500">
                    <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">&#10003;</span>
                        Partage ton lien sur WhatsApp, Facebook, Instagram
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">&#10003;</span>
                        Explique les avantages : 3 000 F de bonus + 3.5%/jour
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">&#10003;</span>
                        Montre tes propres gains pour convaincre
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">&#10003;</span>
                        Aide tes filleuls a demarrer pour qu'ils investissent vite
                    </li>
                </ul>
            </div>
        </div>
    );
}
