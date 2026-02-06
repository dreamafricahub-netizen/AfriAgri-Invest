'use client';

import { PACKS, Pack } from "@/utils/packs";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Check, Loader2, X, Upload, Copy, CheckCircle, ExternalLink, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserData } from '@/hooks/useUserData';

interface DepositSettings {
    USDT_ADDRESS: string;
    MOMO_LINK: string;
    USDT_BONUS_PERCENT: string;
    USDT_RATE: string; // 1 USDT = X FCFA
}

// Convert FCFA to USDT
const fcfaToUsdt = (fcfa: number, rate: number | string) => {
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    if (!numRate || isNaN(numRate) || numRate <= 0) return '0.00';
    return (fcfa / numRate).toFixed(2);
};

export default function InvestPage() {
    const { userData, loading, deposit } = useUserData();
    const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    // Deposit flow states
    const [depositStep, setDepositStep] = useState(1);
    const [depositMethod, setDepositMethod] = useState<'USDT' | 'MOMO' | null>(null);
    const [proofImage, setProofImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Settings
    const [settings, setSettings] = useState<DepositSettings>({
        USDT_ADDRESS: 'TYaoqvL3QqNfQXt59KtsKNehbS2u3HQTxb',
        MOMO_LINK: '',
        USDT_BONUS_PERCENT: '10',
        USDT_RATE: '655' // 1 USDT = 655 FCFA par defaut
    });

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => setSettings(prev => ({ ...prev, ...data })))
            .catch(() => {});
    }, []);

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
                <p className="text-zinc-500">Chargement des packs...</p>
            </div>
        );
    }

    const investments = userData?.investments || [];
    const highestOwnedId = investments.length > 0 ? Math.max(...investments.map(f => f.packId)) : 0;
    const progress = (highestOwnedId / 8) * 100;

    const resetModal = () => {
        setSelectedPack(null);
        setDepositStep(1);
        setDepositMethod(null);
        setProofImage(null);
        setError('');
        setIsSuccess(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError('');

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
                setError(data.message || 'Erreur lors de l\'upload');
            }
        } catch (err) {
            setError('Erreur lors de l\'upload du fichier');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmitDeposit = async () => {
        if (!selectedPack || !proofImage || !depositMethod) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        setIsProcessing(true);
        setError('');

        const result = await deposit(selectedPack.price, depositMethod, proofImage, selectedPack.id);
        setIsProcessing(false);

        if (result.success) {
            setIsSuccess(true);
            setTimeout(() => {
                resetModal();
            }, 3000);
        } else {
            setError(result.message);
        }
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(settings.USDT_ADDRESS);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const bonusAmount = selectedPack && depositMethod === 'USDT'
        ? Math.floor(selectedPack.price * parseFloat(settings.USDT_BONUS_PERCENT) / 100)
        : 0;

    return (
        <div className="pb-8">
            {/* Header Section */}
            <div className="z-30 bg-white dark:bg-zinc-950 p-4 border-b border-zinc-200 dark:border-zinc-800 shadow-sm relative">
                <h2 className="text-2xl font-bold mb-2">Investir</h2>
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-zinc-500">
                        <span>Niveau actuel: {highestOwnedId > 0 ? `Pack ${highestOwnedId}` : 'Debutant'}</span>
                        <span>Max: Pack 8</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-agri-gold"
                        />
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="mx-4 mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-green-700 dark:text-green-300 text-xs text-center">
                    💰 Deposez en <strong>USDT</strong> et recevez <strong>+{settings.USDT_BONUS_PERCENT}% bonus</strong> sur votre investissement!
                </p>
            </div>

            {/* Packs Grid */}
            <div className="p-4 grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4 pb-28">
                {PACKS.map((pack) => {
                    const isOwned = investments.some(f => f.packId === pack.id);
                    const gradIndex = pack.id % 3;
                    const gradients = [
                        "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/10",
                        "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-900/10",
                        "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-900/10"
                    ];

                    return (
                        <motion.div
                            key={pack.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: "-50px" }}
                            className={cn(
                                "relative flex flex-col justify-between overflow-hidden rounded-3xl border transition-all duration-300",
                                isOwned
                                    ? "border-green-500 bg-green-50/80 dark:bg-green-900/20 shadow-lg shadow-green-500/10"
                                    : "border-zinc-100 dark:border-zinc-800 bg-gradient-to-br hover:shadow-xl hover:border-agri-gold/50 hover:-translate-y-1",
                                !isOwned && gradients[gradIndex]
                            )}
                        >
                            {isOwned && (
                                <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 rounded-bl-2xl text-[10px] font-black tracking-wider uppercase flex items-center gap-1 z-10">
                                    <Check className="w-3 h-3" /> Acquis
                                </div>
                            )}

                            <div className="p-5 pt-10 flex flex-col items-center text-center">
                                <div className="w-16 h-16 mb-2 flex items-center justify-center text-5xl filter drop-shadow-sm transition-transform duration-300 hover:scale-110 cursor-default leading-none pb-1 mt-2">
                                    {pack.icon}
                                </div>
                                <h3 className="font-extrabold text-sm md:text-base leading-tight mb-1 px-1">{pack.name}</h3>
                                <p className="text-[10px] text-zinc-500 font-medium line-clamp-2 h-8 px-2">{pack.message}</p>

                                <div className="w-full h-px bg-zinc-200 dark:bg-zinc-700/50 my-3"></div>

                                <div className="w-full space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-400">Gain/j</span>
                                        <span className="font-bold text-green-600 dark:text-green-400">+{pack.dailyGain.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-400">Prix</span>
                                        <div className="text-right">
                                            <span className="font-bold text-zinc-700 dark:text-zinc-200">{pack.price.toLocaleString()} F</span>
                                            <span className="block text-[10px] text-green-600">≈ {fcfaToUsdt(pack.price, settings.USDT_RATE)} USDT</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 mt-auto bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                                <button
                                    onClick={() => { setSelectedPack(pack); setDepositStep(1); }}
                                    className={cn(
                                        "w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1",
                                        isOwned
                                            ? "bg-green-100 text-green-700 cursor-default opacity-80"
                                            : "bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-agri-green dark:hover:bg-agri-gold hover:text-white"
                                    )}
                                    disabled={isOwned}
                                >
                                    {isOwned ? "Deja a toi" : "Acheter"}
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Purchase Modal */}
            <AnimatePresence>
                {selectedPack && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        >
                            {isSuccess ? (
                                <div className="text-center py-8">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white"
                                    >
                                        <Check className="w-10 h-10" />
                                    </motion.div>
                                    <h3 className="text-2xl font-bold text-green-600 mb-2">Demande envoyee!</h3>
                                    <p className="text-zinc-500 text-sm">
                                        Votre demande d'achat du pack <strong>{selectedPack.name}</strong> est en cours de validation.
                                    </p>
                                    <p className="text-zinc-400 text-xs mt-2">
                                        Vous recevrez une notification une fois validee.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <button onClick={resetModal} className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                                        <X className="w-4 h-4" />
                                    </button>

                                    {/* Pack Info Header */}
                                    <div className="flex items-center gap-4 mb-6 pr-10">
                                        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-3xl">
                                            {selectedPack.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">{selectedPack.name}</h3>
                                            <p className="text-2xl font-bold text-green-600">{selectedPack.price.toLocaleString()} F</p>
                                            <p className="text-sm text-green-500">≈ {fcfaToUsdt(selectedPack.price, settings.USDT_RATE)} USDT</p>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl mb-4">
                                            {error}
                                        </div>
                                    )}

                                    {/* Step 1: Choose payment method */}
                                    {depositStep === 1 && (
                                        <div className="space-y-4">
                                            <p className="text-zinc-500 text-sm">Choisissez votre methode de paiement:</p>

                                            <button
                                                onClick={() => { setDepositMethod('USDT'); setDepositStep(2); setError(''); }}
                                                className="w-full p-4 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl hover:border-green-500 transition-all flex items-center gap-4"
                                            >
                                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-2xl">
                                                    💰
                                                </div>
                                                <div className="text-left flex-1">
                                                    <p className="font-bold">USDT (TRC20)</p>
                                                    <p className="text-xs text-zinc-500">Reseau Tron</p>
                                                </div>
                                                <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 text-xs font-bold rounded-full">
                                                    +{settings.USDT_BONUS_PERCENT}% Bonus
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    if (!settings.MOMO_LINK) {
                                                        setError('Le depot Mobile Money n\'est pas encore disponible');
                                                        return;
                                                    }
                                                    setDepositMethod('MOMO');
                                                    setDepositStep(2);
                                                    setError('');
                                                }}
                                                className={`w-full p-4 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl transition-all flex items-center gap-4 ${!settings.MOMO_LINK ? 'opacity-50' : 'hover:border-yellow-500'}`}
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
                                        </div>
                                    )}

                                    {/* Step 2: Payment instructions */}
                                    {depositStep === 2 && (
                                        <div className="space-y-4">
                                            <button onClick={() => { setDepositStep(1); setError(''); }} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                                                ← Retour
                                            </button>

                                            {/* Warning */}
                                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2">
                                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                <p className="text-amber-700 dark:text-amber-300 text-xs">
                                                    <strong>Important:</strong> Envoyez exactement <strong>{selectedPack.price.toLocaleString()} F</strong> ({fcfaToUsdt(selectedPack.price, settings.USDT_RATE)} USDT). Un montant different peut entrainer la perte de vos fonds.
                                                </p>
                                            </div>

                                            {/* USDT Instructions */}
                                            {depositMethod === 'USDT' && (
                                                <>
                                                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4">
                                                        <p className="text-sm text-zinc-500 mb-2">Adresse USDT (TRC20):</p>
                                                        <div className="flex items-center gap-2">
                                                            <code className="flex-1 text-xs bg-zinc-200 dark:bg-zinc-700 p-2 rounded-lg break-all font-mono">
                                                                {settings.USDT_ADDRESS}
                                                            </code>
                                                            <button
                                                                onClick={copyAddress}
                                                                className="p-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 shrink-0"
                                                            >
                                                                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-red-500 mt-2 font-medium">
                                                            Reseau: TRON (TRC20) uniquement!
                                                        </p>
                                                    </div>

                                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                                        <p className="text-green-600 text-sm">
                                                            Bonus USDT: <strong>+{bonusAmount.toLocaleString()} F</strong>
                                                        </p>
                                                        <p className="text-green-600 text-xs">
                                                            Total credite apres validation: <strong>{(selectedPack.price + bonusAmount).toLocaleString()} F</strong>
                                                        </p>
                                                    </div>
                                                </>
                                            )}

                                            {/* MoMo Instructions */}
                                            {depositMethod === 'MOMO' && settings.MOMO_LINK && (
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

                                            {/* Upload proof */}
                                            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                                                <p className="text-sm font-bold mb-2">Apres le paiement:</p>
                                                <p className="text-sm text-zinc-500 mb-3">
                                                    Telechargez une capture d'ecran montrant l'ID de la transaction
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
                                                        <img src={proofImage} alt="Preuve" className="w-full h-40 object-cover rounded-xl border border-green-500" />
                                                        <button
                                                            onClick={() => setProofImage(null)}
                                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" /> Image ajoutee
                                                        </div>
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
                                                                Telecharger la capture d'ecran
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Submit button */}
                                            <button
                                                onClick={handleSubmitDeposit}
                                                disabled={isProcessing || !proofImage}
                                                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Envoi en cours...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-5 h-5" />
                                                        Soumettre ma demande
                                                    </>
                                                )}
                                            </button>

                                            <p className="text-xs text-zinc-400 text-center">
                                                Votre demande sera validee manuellement par notre equipe.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
