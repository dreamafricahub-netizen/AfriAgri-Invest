'use client';

import { ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, Shield, Clock, CreditCard, Smartphone, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useUserData } from '@/hooks/useUserData';
import { PACKS } from '@/utils/packs';

export default function PortfolioPage() {
    const { userData, loading, withdraw } = useUserData();
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [withdrawError, setWithdrawError] = useState('');

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
                <p className="text-zinc-500">Chargement du portefeuille...</p>
            </div>
        );
    }

    const balance = userData?.balance || 0;
    const investedCapital = userData?.investedCapital || 0;
    const investments = userData?.investments || [];
    const transactions = userData?.transactions || [];

    const totalValue = balance + investedCapital;
    const totalGains = transactions.filter(t => t.type === 'GAIN' || t.type === 'REFERRAL_BONUS').reduce((sum, t) => sum + t.amount, 0);
    const totalInvested = transactions.filter(t => t.type === 'INVESTMENT').reduce((sum, t) => sum + t.amount, 0);

    const hasInvested = investments.length > 0;

    const handleWithdraw = async () => {
        setWithdrawError('');

        if (!hasInvested) {
            setWithdrawError("Vous devez d'abord investir dans un pack agricole avant de pouvoir effectuer un retrait.");
            return;
        }
        if (balance <= 0) {
            setWithdrawError("Solde insuffisant pour effectuer un retrait.");
            return;
        }

        setIsWithdrawing(true);
        const result = await withdraw(balance, 'MOMO');
        setIsWithdrawing(false);

        if (!result.success) {
            setWithdrawError(result.message);
        }
    };

    return (
        <div className="p-4 space-y-6 pb-8">
            {/* Balance Card */}
            <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="relative z-10">
                    <p className="text-zinc-400 text-sm mb-1">Solde Total Estime</p>
                    <motion.h2
                        key={totalValue}
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="text-4xl font-bold mb-2"
                    >
                        {totalValue.toLocaleString()} <span className="text-lg text-zinc-400">FCFA</span>
                    </motion.h2>
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 text-xs font-bold">+3.5% aujourd'hui</span>
                    </div>

                    {withdrawError && (
                        <p className="text-red-400 text-xs text-center mb-3 bg-red-900/20 p-2 rounded-lg">
                            {withdrawError}
                        </p>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleWithdraw}
                            disabled={isWithdrawing}
                            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 ${hasInvested ? 'bg-agri-green hover:bg-green-600 text-white' : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'}`}
                        >
                            {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />} Retirer
                        </button>
                        <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors active:scale-95">
                            <ArrowDownLeft className="w-4 h-4" /> Depot
                        </button>
                    </div>
                    {!hasInvested && (
                        <p className="text-amber-400 text-xs text-center mt-3 flex items-center justify-center gap-1">
                            <span>&#9888;</span> Investis dans un pack pour debloquer le retrait
                        </p>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mb-2">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <p className="text-zinc-500 text-xs">Capital Investi</p>
                    <p className="font-bold text-lg">{investedCapital.toLocaleString()} F</p>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mb-2">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <p className="text-zinc-500 text-xs">Solde Disponible</p>
                    <p className="font-bold text-lg text-green-600">{balance.toLocaleString()} F</p>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-full flex items-center justify-center mb-2">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <p className="text-zinc-500 text-xs">Total Investi</p>
                    <p className="font-bold text-lg">{totalInvested.toLocaleString()} F</p>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-full flex items-center justify-center mb-2">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <p className="text-zinc-500 text-xs">Total Gains</p>
                    <p className="font-bold text-lg text-green-600">+{totalGains.toLocaleString()} F</p>
                </div>
            </div>

            {/* Active Farms Summary */}
            {investments.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                        <span className="text-lg">🌾</span> Mes Fermes Actives
                    </h3>
                    <div className="space-y-2">
                        {investments.map((investment, i) => {
                            const pack = PACKS.find(p => p.id === investment.packId);
                            const icons = ['🌱', '🌱', '🌳', '🌳', '🏡', '🏡', '🌾', '🏰'];
                            return (
                                <div key={investment.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{icons[investment.packId - 1] || '🌱'}</span>
                                        <div>
                                            <p className="font-bold text-sm">{pack?.name || `Pack ${investment.packId}`}</p>
                                            <p className="text-[10px] text-zinc-500">Active - {investment.amount.toLocaleString()} F</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">+3.5%/j</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Payment Methods */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-zinc-500" /> Methodes de paiement
                </h3>
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-900/20">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-xs font-black text-black">MTN</div>
                            <div>
                                <p className="font-bold text-sm">MTN Mobile Money</p>
                                <p className="text-[10px] text-zinc-500">Depot et retrait instantane</p>
                            </div>
                        </div>
                        <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full">Disponible</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/20">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-xs font-black text-white">OM</div>
                            <div>
                                <p className="font-bold text-sm">Orange Money</p>
                                <p className="text-[10px] text-zinc-500">Depot et retrait instantane</p>
                            </div>
                        </div>
                        <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full">Disponible</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-xs font-black text-white">W</div>
                            <div>
                                <p className="font-bold text-sm">Wave</p>
                                <p className="text-[10px] text-zinc-500">Depot et retrait instantane</p>
                            </div>
                        </div>
                        <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full">Disponible</span>
                    </div>
                </div>
            </div>

            {/* Transactions */}
            <div>
                <h3 className="font-bold text-lg mb-4">Historique Recent</h3>
                <div className="space-y-3">
                    {transactions.length === 0 ? (
                        <div className="text-center py-10 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <div className="text-4xl mb-3">📊</div>
                            <p className="text-zinc-500 text-sm font-medium">Aucune transaction pour le moment.</p>
                            <p className="text-zinc-400 text-xs mt-1">Investis dans une ferme pour commencer a generer des gains !</p>
                        </div>
                    ) : (
                        transactions.slice(0, 15).map((t) => (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-50 dark:border-zinc-800"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        t.type === 'INVESTMENT' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' :
                                        t.type === 'GAIN' || t.type === 'REFERRAL_BONUS' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' :
                                        t.type === 'BONUS' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600' :
                                        'bg-red-100 dark:bg-red-900/20 text-red-600'
                                    }`}>
                                        {t.type === 'INVESTMENT' ? '🌱' :
                                         t.type === 'GAIN' ? '📈' :
                                         t.type === 'REFERRAL_BONUS' ? '👥' :
                                         t.type === 'BONUS' ? '🎁' : '💸'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">
                                            {t.description || (
                                                t.type === 'INVESTMENT' ? 'Investissement' :
                                                t.type === 'GAIN' ? 'Gain journalier' :
                                                t.type === 'REFERRAL_BONUS' ? 'Bonus parrainage' :
                                                t.type === 'BONUS' ? 'Bonus' : 'Retrait'
                                            )}
                                        </p>
                                        <p className="text-zinc-400 text-xs">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                                <span className={`font-bold ${
                                    t.type === 'GAIN' || t.type === 'REFERRAL_BONUS' || t.type === 'BONUS' ? 'text-green-600' :
                                    t.type === 'INVESTMENT' ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                    {t.type === 'GAIN' || t.type === 'REFERRAL_BONUS' || t.type === 'BONUS' ? '+' : '-'}{t.amount.toLocaleString()} F
                                </span>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Security Note */}
            <div className="flex gap-3 items-start p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/20">
                <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold text-sm text-green-900 dark:text-green-100">Vos fonds sont securises</p>
                    <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                        Tous les retraits sont traites sous 24h via Mobile Money. Votre capital est protege par nos partenaires financiers agrees.
                    </p>
                </div>
            </div>
        </div>
    );
}
