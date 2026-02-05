'use client';

import { PACKS, Pack } from "@/utils/packs";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserData } from '@/hooks/useUserData';

export default function InvestPage() {
    const { userData, loading, invest } = useUserData();
    const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
                <p className="text-zinc-500">Chargement des packs...</p>
            </div>
        );
    }

    const investments = userData?.investments || [];

    // Determine current level (simplified: highest pack owned)
    const highestOwnedId = investments.length > 0 ? Math.max(...investments.map(f => f.packId)) : 0;
    // Progress: e.g. Pack 5/8
    const progress = (highestOwnedId / 8) * 100;

    const handleInvest = async () => {
        if (!selectedPack) return;

        setError('');
        setIsProcessing(true);

        const result = await invest(selectedPack.id);

        setIsProcessing(false);

        if (result.success) {
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setSelectedPack(null);
            }, 2000);
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="pb-8">
            {/* Header Section (Non-sticky to avoid clipping issues) */}
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

            {/* Packs Grid - Standard spacing */}
            <div className="p-4 grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4 pb-28">
                {PACKS.map((pack) => {
                    const isOwned = investments.some(f => f.packId === pack.id);
                    // Cycle gradients for visual variety
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
                                    {[1, 2].includes(pack.id) ? "🌱" :
                                        [3, 4].includes(pack.id) ? "🌳" :
                                            [5, 6].includes(pack.id) ? "🏡" :
                                                [7].includes(pack.id) ? "🌾" : "🏰"}
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
                                        <span className="font-bold text-zinc-700 dark:text-zinc-200">{pack.price.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 mt-auto bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                                <button
                                    onClick={() => setSelectedPack(pack)}
                                    className={cn(
                                        "w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1",
                                        isOwned
                                            ? "bg-green-100 text-green-700 cursor-default opacity-80"
                                            : "bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-agri-green dark:hover:bg-agri-gold hover:text-white"
                                    )}
                                    disabled={isOwned}
                                >
                                    {isOwned ? "Deja a toi" : "Investir"}
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {selectedPack && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative"
                        >
                            {!isSuccess ? (
                                <>
                                    <button onClick={() => { setSelectedPack(null); setError(''); }} className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                                        <X className="w-4 h-4" />
                                    </button>
                                    <h3 className="text-2xl font-bold mb-4 pr-10">Confirmer l'achat</h3>

                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl mb-6 flex flex-col items-center">
                                        <span className="text-4xl mb-2">📱</span>
                                        <p className="text-sm text-center mb-1">Paiement Mobile Money</p>
                                        <p className="font-bold text-xl">{selectedPack.price.toLocaleString()} FCFA</p>
                                        <p className="text-xs text-zinc-500 mt-1">{selectedPack.name}</p>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl text-center font-medium mb-4">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <p className="text-center text-sm text-zinc-500">
                                            En confirmant, tu investis {selectedPack.price.toLocaleString()} F dans cette ferme. Tes gains commencent immediatement !
                                        </p>
                                        <button
                                            onClick={handleInvest}
                                            disabled={isProcessing}
                                            className="w-full bg-agri-green text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Traitement en cours...
                                                </>
                                            ) : (
                                                'Confirmer et Payer'
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <motion.div
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-4xl"
                                    >
                                        <Check />
                                    </motion.div>
                                    <h3 className="text-2xl font-bold text-green-600 mb-2">Succes !</h3>
                                    <p className="text-zinc-500">Ta ferme a grandi. Les gains commencent maintenant.</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
