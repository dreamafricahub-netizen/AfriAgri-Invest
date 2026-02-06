'use client';

import { ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, Shield, CreditCard, Loader2, X, CheckCircle, Clock, Upload, ExternalLink, AlertTriangle, Copy } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserData } from '@/hooks/useUserData';
import { PACKS } from '@/utils/packs';

interface DepositSettings {
    USDT_ADDRESS: string;
    MOMO_LINK: string;
    USDT_BONUS_PERCENT: string;
}

export default function PortfolioPage() {
    const { userData, loading, withdraw, deposit } = useUserData();
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [actionError, setActionError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    // Withdraw form
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMethod, setWithdrawMethod] = useState<'USDT' | 'MOMO'>('MOMO');
    const [withdrawAddress, setWithdrawAddress] = useState('');

    // Deposit form
    const [depositStep, setDepositStep] = useState(1);
    const [depositMethod, setDepositMethod] = useState<'USDT' | 'MOMO' | null>(null);
    const [selectedPack, setSelectedPack] = useState<number | null>(null);
    const [proofImage, setProofImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Settings
    const [settings, setSettings] = useState<DepositSettings>({
        USDT_ADDRESS: 'TYaoqvL3QqNfQXt59KtsKNehbS2u3HQTxb',
        MOMO_LINK: '',
        USDT_BONUS_PERCENT: '10'
    });

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => setSettings(data))
            .catch(() => {});
    }, []);

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
        setActionError('');
        const amount = parseFloat(withdrawAmount);

        if (!hasInvested) {
            setActionError("Vous devez d'abord investir dans un pack agricole avant de pouvoir effectuer un retrait.");
            return;
        }
        if (!amount || amount < 3000) {
            setActionError("Montant minimum de retrait : 3 000 F");
            return;
        }
        if (amount > balance) {
            setActionError("Solde insuffisant pour effectuer ce retrait.");
            return;
        }
        if (!withdrawAddress.trim()) {
            setActionError(withdrawMethod === 'USDT' ? "Veuillez entrer votre adresse USDT TRC20" : "Veuillez entrer votre numero Mobile Money");
            return;
        }

        setIsProcessing(true);
        const result = await withdraw(amount, withdrawMethod, withdrawAddress);
        setIsProcessing(false);

        if (result.success) {
            setActionSuccess("Demande de retrait enregistree! Traitement sous 24h.");
            setWithdrawAmount('');
            setWithdrawAddress('');
            setTimeout(() => {
                setShowWithdrawModal(false);
                setActionSuccess('');
            }, 2000);
        } else {
            setActionError(result.message);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setActionError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                setProofImage(data.url);
            } else {
                setActionError(data.message || 'Erreur lors de l\'upload');
            }
        } catch (error) {
            setActionError('Erreur lors de l\'upload du fichier');
        } finally {
            setUploading(false);
        }
    };

    const handleDeposit = async () => {
        if (!selectedPack || !proofImage || !depositMethod) {
            setActionError('Veuillez remplir tous les champs');
            return;
        }

        const pack = PACKS.find(p => p.id === selectedPack);
        if (!pack) return;

        setIsProcessing(true);
        setActionError('');

        const result = await deposit(pack.price, depositMethod, proofImage, selectedPack);
        setIsProcessing(false);

        if (result.success) {
            const bonusText = depositMethod === 'USDT'
                ? ` (+${settings.USDT_BONUS_PERCENT}% bonus!)`
                : '';
            setActionSuccess(`Demande de depot enregistree${bonusText} En attente de validation.`);
            resetDepositForm();
            setTimeout(() => {
                setShowDepositModal(false);
                setActionSuccess('');
            }, 3000);
        } else {
            setActionError(result.message);
        }
    };

    const resetDepositForm = () => {
        setDepositStep(1);
        setDepositMethod(null);
        setSelectedPack(null);
        setProofImage(null);
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(settings.USDT_ADDRESS);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const selectedPackData = selectedPack ? PACKS.find(p => p.id === selectedPack) : null;
    const bonusAmount = selectedPackData && depositMethod === 'USDT'
        ? Math.floor(selectedPackData.price * parseFloat(settings.USDT_BONUS_PERCENT) / 100)
        : 0;

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

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setActionError('');
                                setActionSuccess('');
                                setShowWithdrawModal(true);
                            }}
                            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 ${hasInvested ? 'bg-agri-green hover:bg-green-600 text-white' : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'}`}
                        >
                            <ArrowUpRight className="w-4 h-4" /> Retirer
                        </button>
                        <button
                            onClick={() => {
                                setActionError('');
                                setActionSuccess('');
                                resetDepositForm();
                                setShowDepositModal(true);
                            }}
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
                        >
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
                        {investments.map((investment) => {
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
                                        t.type === 'BONUS' || t.type === 'DEPOSIT' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600' :
                                        'bg-red-100 dark:bg-red-900/20 text-red-600'
                                    }`}>
                                        {t.type === 'INVESTMENT' ? '🌱' :
                                         t.type === 'GAIN' ? '📈' :
                                         t.type === 'REFERRAL_BONUS' ? '👥' :
                                         t.type === 'DEPOSIT' ? '💰' :
                                         t.type === 'BONUS' ? '🎁' : '💸'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">
                                            {t.description || (
                                                t.type === 'INVESTMENT' ? 'Investissement' :
                                                t.type === 'GAIN' ? 'Gain journalier' :
                                                t.type === 'REFERRAL_BONUS' ? 'Bonus parrainage' :
                                                t.type === 'DEPOSIT' ? 'Depot' :
                                                t.type === 'BONUS' ? 'Bonus' : 'Retrait'
                                            )}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-zinc-400 text-xs">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</p>
                                            {t.status === 'PENDING' && (
                                                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/20 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> En attente
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className={`font-bold ${
                                    t.type === 'GAIN' || t.type === 'REFERRAL_BONUS' || t.type === 'BONUS' || t.type === 'DEPOSIT' ? 'text-green-600' :
                                    t.type === 'INVESTMENT' ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                    {t.type === 'GAIN' || t.type === 'REFERRAL_BONUS' || t.type === 'BONUS' || t.type === 'DEPOSIT' ? '+' : '-'}{t.amount.toLocaleString()} F
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
                        Tous les retraits sont traites sous 24h. Deposez par USDT pour obtenir +{settings.USDT_BONUS_PERCENT}% de bonus!
                    </p>
                </div>
            </div>

            {/* Withdraw Modal */}
            <AnimatePresence>
                {showWithdrawModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
                        onClick={() => setShowWithdrawModal(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">Retirer des fonds</h3>
                                <button onClick={() => setShowWithdrawModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {actionSuccess ? (
                                <div className="text-center py-8">
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <p className="text-green-600 font-bold">{actionSuccess}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {actionError && (
                                        <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{actionError}</p>
                                    )}

                                    <div>
                                        <label className="text-sm text-zinc-500 mb-2 block">Solde disponible</label>
                                        <p className="text-2xl font-bold text-green-600">{balance.toLocaleString()} F</p>
                                    </div>

                                    <div>
                                        <label className="text-sm text-zinc-500 mb-2 block">Montant a retirer</label>
                                        <input
                                            type="number"
                                            value={withdrawAmount}
                                            onChange={e => setWithdrawAmount(e.target.value)}
                                            placeholder="Minimum 3 000 F"
                                            className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:border-green-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm text-zinc-500 mb-2 block">Methode de retrait</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => { setWithdrawMethod('MOMO'); setWithdrawAddress(''); }}
                                                className={`p-3 border-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                                                    withdrawMethod === 'MOMO'
                                                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                                                        : 'border-zinc-200 dark:border-zinc-700'
                                                }`}
                                            >
                                                <span>📱</span>
                                                <span className="font-bold text-sm">Mobile Money</span>
                                            </button>
                                            <button
                                                onClick={() => { setWithdrawMethod('USDT'); setWithdrawAddress(''); }}
                                                className={`p-3 border-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                                                    withdrawMethod === 'USDT'
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                        : 'border-zinc-200 dark:border-zinc-700'
                                                }`}
                                            >
                                                <span>💰</span>
                                                <span className="font-bold text-sm">USDT TRC20</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm text-zinc-500 mb-2 block">
                                            {withdrawMethod === 'USDT' ? 'Adresse USDT TRC20' : 'Numero Mobile Money'}
                                        </label>
                                        <input
                                            type="text"
                                            value={withdrawAddress}
                                            onChange={e => setWithdrawAddress(e.target.value)}
                                            placeholder={withdrawMethod === 'USDT' ? 'TYaoqvL3...' : '6XXXXXXXX'}
                                            className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:border-green-500 font-mono"
                                        />
                                        <p className="text-xs text-zinc-400 mt-1">
                                            {withdrawMethod === 'USDT'
                                                ? 'Assurez-vous que l\'adresse est sur le reseau TRON (TRC20)'
                                                : 'Numero au format international ou local'}
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleWithdraw}
                                        disabled={isProcessing || !hasInvested}
                                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
                                        Confirmer le retrait
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Deposit Modal */}
            <AnimatePresence>
                {showDepositModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
                        onClick={() => setShowDepositModal(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">Deposer des fonds</h3>
                                <button onClick={() => setShowDepositModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {actionSuccess ? (
                                <div className="text-center py-8">
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <p className="text-green-600 font-bold">{actionSuccess}</p>
                                </div>
                            ) : (
                                <>
                                    {/* Step 1: Choose method */}
                                    {depositStep === 1 && (
                                        <div className="space-y-4">
                                            <p className="text-zinc-500 text-sm">Choisissez votre methode de paiement</p>

                                            <button
                                                onClick={() => { setDepositMethod('USDT'); setDepositStep(2); }}
                                                className="w-full p-4 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl hover:border-green-500 transition-all flex items-center gap-4"
                                            >
                                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-2xl">
                                                    💰
                                                </div>
                                                <div className="text-left flex-1">
                                                    <p className="font-bold">USDT (TRC20)</p>
                                                    <p className="text-xs text-zinc-500">Reseau Tron - Depot crypto</p>
                                                </div>
                                                <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 text-xs font-bold rounded-full">
                                                    +{settings.USDT_BONUS_PERCENT}% Bonus
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    if (!settings.MOMO_LINK) {
                                                        setActionError('Le depot Mobile Money n\'est pas encore disponible');
                                                        return;
                                                    }
                                                    setDepositMethod('MOMO');
                                                    setDepositStep(2);
                                                }}
                                                className={`w-full p-4 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl transition-all flex items-center gap-4 ${!settings.MOMO_LINK ? 'opacity-50 cursor-not-allowed' : 'hover:border-yellow-500'}`}
                                            >
                                                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center text-2xl">
                                                    📱
                                                </div>
                                                <div className="text-left flex-1">
                                                    <p className="font-bold">Mobile Money</p>
                                                    <p className="text-xs text-zinc-500">MTN MoMo, Orange Money</p>
                                                </div>
                                                {!settings.MOMO_LINK && (
                                                    <span className="text-xs text-zinc-400">Bientot</span>
                                                )}
                                            </button>

                                            {actionError && (
                                                <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{actionError}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Step 2: Choose pack */}
                                    {depositStep === 2 && (
                                        <div className="space-y-4">
                                            <button onClick={() => setDepositStep(1)} className="text-sm text-zinc-500 hover:text-white">
                                                ← Retour
                                            </button>

                                            <p className="text-zinc-500 text-sm">Selectionnez le pack a acheter</p>
                                            <p className="text-amber-500 text-xs flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                Deposez le montant EXACT du pack choisi
                                            </p>

                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {PACKS.map(pack => (
                                                    <button
                                                        key={pack.id}
                                                        onClick={() => setSelectedPack(pack.id)}
                                                        className={`w-full p-3 border-2 rounded-xl transition-all flex items-center justify-between ${
                                                            selectedPack === pack.id
                                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                                : 'border-zinc-200 dark:border-zinc-700'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xl">{pack.icon}</span>
                                                            <div className="text-left">
                                                                <p className="font-bold text-sm">{pack.name}</p>
                                                                <p className="text-xs text-zinc-500">{pack.price.toLocaleString()} F</p>
                                                            </div>
                                                        </div>
                                                        {selectedPack === pack.id && (
                                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>

                                            {selectedPack && depositMethod === 'USDT' && (
                                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                                    <p className="text-green-600 text-sm">
                                                        Bonus USDT: <strong>+{bonusAmount.toLocaleString()} F</strong>
                                                    </p>
                                                    <p className="text-green-600 text-xs">
                                                        Total credite: {((selectedPackData?.price || 0) + bonusAmount).toLocaleString()} F
                                                    </p>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => selectedPack && setDepositStep(3)}
                                                disabled={!selectedPack}
                                                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold disabled:opacity-50"
                                            >
                                                Continuer
                                            </button>
                                        </div>
                                    )}

                                    {/* Step 3: Payment instructions */}
                                    {depositStep === 3 && (
                                        <div className="space-y-4">
                                            <button onClick={() => setDepositStep(2)} className="text-sm text-zinc-500 hover:text-white">
                                                ← Retour
                                            </button>

                                            {actionError && (
                                                <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{actionError}</p>
                                            )}

                                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                                                <p className="font-bold text-amber-800 dark:text-amber-200 mb-2">
                                                    Montant a envoyer:
                                                </p>
                                                <p className="text-2xl font-bold text-amber-600">
                                                    {selectedPackData?.price.toLocaleString()} F
                                                </p>
                                            </div>

                                            {depositMethod === 'USDT' ? (
                                                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4">
                                                    <p className="text-sm text-zinc-500 mb-2">Adresse USDT (TRC20):</p>
                                                    <div className="flex items-center gap-2">
                                                        <code className="flex-1 text-xs bg-zinc-200 dark:bg-zinc-700 p-2 rounded-lg break-all">
                                                            {settings.USDT_ADDRESS}
                                                        </code>
                                                        <button
                                                            onClick={copyAddress}
                                                            className="p-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600"
                                                        >
                                                            {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-red-500 mt-2">
                                                        Reseau: TRON (TRC20) uniquement!
                                                    </p>
                                                </div>
                                            ) : (
                                                <a
                                                    href={settings.MOMO_LINK}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block w-full p-4 bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl font-bold text-center flex items-center justify-center gap-2"
                                                >
                                                    <ExternalLink className="w-5 h-5" />
                                                    Ouvrir le lien de paiement
                                                </a>
                                            )}

                                            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                                                <p className="text-sm font-bold mb-2">Apres le paiement:</p>
                                                <p className="text-sm text-zinc-500 mb-3">
                                                    Telechargez une capture d'ecran montrant la transaction
                                                </p>

                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileUpload}
                                                    accept="image/*"
                                                    className="hidden"
                                                />

                                                {proofImage ? (
                                                    <div className="relative">
                                                        <img src={proofImage} alt="Preuve" className="w-full h-40 object-cover rounded-xl" />
                                                        <button
                                                            onClick={() => setProofImage(null)}
                                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={uploading}
                                                        className="w-full py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl flex items-center justify-center gap-2 hover:border-green-500 transition-colors"
                                                    >
                                                        {uploading ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Upload className="w-5 h-5" />
                                                                Telecharger la capture
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            <button
                                                onClick={handleDeposit}
                                                disabled={isProcessing || !proofImage}
                                                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {isProcessing ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-5 h-5" />
                                                )}
                                                Soumettre le depot
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
