'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Clock, CheckCircle, Leaf } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Farm {
    id: string;
    packId: number;
    packName: string;
    packIcon: string;
    dailyGain: number;
    amount: number;
    isReady: boolean;
    hoursRemaining: number;
    progress: number;
    lastHarvest: string;
}

export default function FermesPage() {
    const [farms, setFarms] = useState<Farm[]>([]);
    const [loading, setLoading] = useState(true);
    const [harvesting, setHarvesting] = useState<string | null>(null);
    const [harvestResult, setHarvestResult] = useState<{ id: string; amount: number } | null>(null);
    const [totalHarvested, setTotalHarvested] = useState(0);

    const fetchFarms = async () => {
        try {
            const res = await fetch('/api/harvest');
            const data = await res.json();
            setFarms(data.farms || []);
        } catch (error) {
            console.error('Failed to fetch farms:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFarms();
        // Refresh every minute to update timers
        const interval = setInterval(fetchFarms, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleHarvest = async (farmId: string) => {
        setHarvesting(farmId);
        try {
            const res = await fetch('/api/harvest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ investmentId: farmId })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                // Show confetti
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#22c55e', '#fbbf24', '#84cc16']
                });

                setHarvestResult({ id: farmId, amount: data.amount });
                setTotalHarvested(prev => prev + data.amount);

                // Refresh farms
                await fetchFarms();

                // Clear result after animation
                setTimeout(() => setHarvestResult(null), 3000);
            }
        } catch (error) {
            console.error('Harvest failed:', error);
        } finally {
            setHarvesting(null);
        }
    };

    const readyFarms = farms.filter(f => f.isReady);
    const growingFarms = farms.filter(f => !f.isReady);

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
                <p className="text-zinc-500">Chargement de vos fermes...</p>
            </div>
        );
    }

    if (farms.length === 0) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="text-6xl mb-4">🌾</div>
                <h2 className="text-xl font-bold mb-2">Aucune ferme active</h2>
                <p className="text-zinc-500 mb-6">Investissez dans un pack pour commencer a cultiver!</p>
                <a
                    href="/investir"
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold"
                >
                    Acheter un pack
                </a>
            </div>
        );
    }

    return (
        <div className="pb-24">
            {/* Header */}
            <div className="bg-gradient-to-b from-green-900/30 to-transparent p-6 border-b border-zinc-800">
                <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                    <Leaf className="w-6 h-6 text-green-500" />
                    Mes Fermes
                </h1>
                <p className="text-zinc-400 text-sm">Tapez sur les champs prets pour recolter vos gains</p>

                {/* Stats */}
                <div className="flex gap-4 mt-4">
                    <div className="flex-1 bg-green-900/30 rounded-xl p-3 border border-green-800/50">
                        <p className="text-green-400 text-xs">Prets a recolter</p>
                        <p className="text-xl font-bold text-white">{readyFarms.length}</p>
                    </div>
                    <div className="flex-1 bg-amber-900/30 rounded-xl p-3 border border-amber-800/50">
                        <p className="text-amber-400 text-xs">En croissance</p>
                        <p className="text-xl font-bold text-white">{growingFarms.length}</p>
                    </div>
                    {totalHarvested > 0 && (
                        <div className="flex-1 bg-purple-900/30 rounded-xl p-3 border border-purple-800/50">
                            <p className="text-purple-400 text-xs">Recolte du jour</p>
                            <p className="text-xl font-bold text-white">+{totalHarvested.toLocaleString()} F</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Ready to Harvest Section */}
            {readyFarms.length > 0 && (
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        <h2 className="font-bold text-lg text-yellow-400">Prets a recolter!</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {readyFarms.map((farm) => (
                            <FarmCard
                                key={farm.id}
                                farm={farm}
                                onHarvest={handleHarvest}
                                isHarvesting={harvesting === farm.id}
                                harvestResult={harvestResult?.id === farm.id ? harvestResult.amount : null}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Growing Section */}
            {growingFarms.length > 0 && (
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-zinc-400" />
                        <h2 className="font-bold text-lg text-zinc-400">En croissance</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {growingFarms.map((farm) => (
                            <FarmCard
                                key={farm.id}
                                farm={farm}
                                onHarvest={handleHarvest}
                                isHarvesting={false}
                                harvestResult={null}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Info Banner */}
            <div className="mx-4 mt-4 p-4 bg-amber-900/20 border border-amber-800/50 rounded-2xl">
                <p className="text-amber-300 text-xs text-center">
                    <strong>Important:</strong> Recoltez vos gains toutes les 24h. Si vous ne recoltez pas, la croissance s'arrete jusqu'a votre prochaine visite!
                </p>
            </div>
        </div>
    );
}

function FarmCard({
    farm,
    onHarvest,
    isHarvesting,
    harvestResult
}: {
    farm: Farm;
    onHarvest: (id: string) => void;
    isHarvesting: boolean;
    harvestResult: number | null;
}) {
    // Farm visual based on pack level
    const getFarmVisual = (packId: number, isReady: boolean) => {
        const visuals = [
            { bg: 'from-green-800 to-green-900', plant: '🌱', readyPlant: '🥬', ground: '🟫' },
            { bg: 'from-emerald-800 to-emerald-900', plant: '🌿', readyPlant: '🥕', ground: '🟫' },
            { bg: 'from-lime-800 to-lime-900', plant: '🌳', readyPlant: '🍎', ground: '🟫' },
            { bg: 'from-teal-800 to-teal-900', plant: '🌴', readyPlant: '🍌', ground: '🟫' },
            { bg: 'from-cyan-800 to-cyan-900', plant: '🌾', readyPlant: '🌽', ground: '🟫' },
            { bg: 'from-sky-800 to-sky-900', plant: '🏭', readyPlant: '🍫', ground: '🟫' },
            { bg: 'from-indigo-800 to-indigo-900', plant: '🏰', readyPlant: '💎', ground: '🟫' },
            { bg: 'from-violet-800 to-violet-900', plant: '🌟', readyPlant: '👑', ground: '🟫' },
        ];
        return visuals[packId - 1] || visuals[0];
    };

    const visual = getFarmVisual(farm.packId, farm.isReady);

    return (
        <motion.div
            whileHover={farm.isReady ? { scale: 1.02 } : {}}
            whileTap={farm.isReady ? { scale: 0.98 } : {}}
            className={`relative overflow-hidden rounded-2xl border-2 transition-all ${
                farm.isReady
                    ? 'border-yellow-500 shadow-lg shadow-yellow-500/20 cursor-pointer'
                    : 'border-zinc-700 opacity-80'
            }`}
            onClick={() => farm.isReady && !isHarvesting && onHarvest(farm.id)}
        >
            {/* Farm Background */}
            <div className={`bg-gradient-to-b ${visual.bg} p-4 min-h-[180px] relative`}>
                {/* Sky */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 to-transparent" />

                {/* Sun/Moon based on ready state */}
                <div className="absolute top-2 right-2">
                    {farm.isReady ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            className="text-2xl"
                        >
                            ☀️
                        </motion.div>
                    ) : (
                        <div className="text-2xl">🌙</div>
                    )}
                </div>

                {/* Plants Grid */}
                <div className="relative z-10 grid grid-cols-3 gap-2 mt-6 mb-4">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={farm.isReady ? {
                                y: [0, -5, 0],
                                rotate: [-2, 2, -2]
                            } : {}}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                            className="text-2xl text-center"
                        >
                            {farm.isReady ? visual.readyPlant : visual.plant}
                        </motion.div>
                    ))}
                </div>

                {/* Ground */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-amber-900/50" />

                {/* Ready Indicator */}
                {farm.isReady && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-2 left-2"
                    >
                        <div className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            RECOLTER
                        </div>
                    </motion.div>
                )}

                {/* Harvest Animation */}
                <AnimatePresence>
                    {harvestResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.5 }}
                            animate={{ opacity: 1, y: -30, scale: 1.2 }}
                            exit={{ opacity: 0, y: -60 }}
                            className="absolute inset-0 flex items-center justify-center z-20"
                        >
                            <div className="px-4 py-2 bg-green-500 text-white text-xl font-bold rounded-full shadow-lg">
                                +{harvestResult.toLocaleString()} F
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading Overlay */}
                {isHarvesting && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                )}
            </div>

            {/* Info Bar */}
            <div className="bg-zinc-900 p-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white truncate">{farm.packName}</span>
                    <span className="text-xs text-green-400 font-bold">+{farm.dailyGain.toLocaleString()} F</span>
                </div>

                {/* Progress Bar */}
                {!farm.isReady && (
                    <div className="space-y-1">
                        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${farm.progress}%` }}
                                className="h-full bg-gradient-to-r from-green-600 to-green-400"
                            />
                        </div>
                        <div className="flex items-center justify-center gap-1 text-xs text-zinc-400">
                            <Clock className="w-3 h-3" />
                            <span>{farm.hoursRemaining}h restantes</span>
                        </div>
                    </div>
                )}

                {farm.isReady && (
                    <div className="flex items-center justify-center gap-1 text-xs text-yellow-400 font-bold">
                        <CheckCircle className="w-3 h-3" />
                        <span>Pret a recolter!</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
