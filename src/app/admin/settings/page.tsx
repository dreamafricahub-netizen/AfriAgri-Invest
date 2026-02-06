'use client';

import { useEffect, useState } from 'react';
import {
    Loader2,
    Save,
    Settings,
    Wallet,
    Smartphone,
    Percent,
    CheckCircle,
    Copy,
    AlertTriangle,
    Info,
    ArrowLeftRight
} from 'lucide-react';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [settings, setSettings] = useState({
        USDT_ADDRESS: '',
        MOMO_LINK: '',
        USDT_BONUS_PERCENT: '10',
        USDT_RATE: '655',
    });

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            setSettings(data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateSetting = async (key: string, value: string) => {
        setSaving(key);
        setSuccess(null);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });
            if (res.ok) {
                setSettings(prev => ({ ...prev, [key]: value }));
                setSuccess(key);
                setTimeout(() => setSuccess(null), 2000);
            }
        } catch (error) {
            console.error('Failed to update setting:', error);
        } finally {
            setSaving(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Settings className="w-6 h-6" /> Parametres
                </h1>
                <p className="text-zinc-400 text-sm">Configuration des methodes de paiement et bonus</p>
            </div>

            {/* USDT Settings */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-green-900/50 rounded-xl flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Depot USDT (TRC20)</h2>
                        <p className="text-zinc-500 text-sm">Configuration de l'adresse de depot crypto</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Adresse USDT TRC20</label>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={settings.USDT_ADDRESS}
                                    onChange={(e) => setSettings(prev => ({ ...prev, USDT_ADDRESS: e.target.value }))}
                                    placeholder="TYaoqvL3QqNfQXt59KtsKNehbS2u3HQTxb"
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:border-green-500 outline-none pr-12"
                                />
                                <button
                                    onClick={() => copyToClipboard(settings.USDT_ADDRESS)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-700 rounded"
                                    title="Copier"
                                >
                                    {copied ? (
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-zinc-400" />
                                    )}
                                </button>
                            </div>
                            <button
                                onClick={() => updateSetting('USDT_ADDRESS', settings.USDT_ADDRESS)}
                                disabled={saving === 'USDT_ADDRESS'}
                                className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 shrink-0"
                            >
                                {saving === 'USDT_ADDRESS' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : success === 'USDT_ADDRESS' ? (
                                    <CheckCircle className="w-4 h-4" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Sauvegarder
                            </button>
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">
                            Les utilisateurs enverront leurs USDT a cette adresse. Reseau: TRON (TRC20).
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Bonus USDT (%)</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1 max-w-xs">
                                <input
                                    type="number"
                                    value={settings.USDT_BONUS_PERCENT}
                                    onChange={(e) => setSettings(prev => ({ ...prev, USDT_BONUS_PERCENT: e.target.value }))}
                                    placeholder="10"
                                    min="0"
                                    max="100"
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-green-500 outline-none pr-10"
                                />
                                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            </div>
                            <button
                                onClick={() => updateSetting('USDT_BONUS_PERCENT', settings.USDT_BONUS_PERCENT)}
                                disabled={saving === 'USDT_BONUS_PERCENT'}
                                className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving === 'USDT_BONUS_PERCENT' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : success === 'USDT_BONUS_PERCENT' ? (
                                    <CheckCircle className="w-4 h-4" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Sauvegarder
                            </button>
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">
                            Bonus accorde aux utilisateurs qui deposent en USDT. Ex: 10% = depot de 100 000 F donne 110 000 F de solde.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Taux de change (1 USDT = X FCFA)</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1 max-w-xs">
                                <ArrowLeftRight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type="number"
                                    value={settings.USDT_RATE}
                                    onChange={(e) => setSettings(prev => ({ ...prev, USDT_RATE: e.target.value }))}
                                    placeholder="655"
                                    min="1"
                                    className="w-full pl-10 pr-16 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-green-500 outline-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">FCFA</span>
                            </div>
                            <button
                                onClick={() => updateSetting('USDT_RATE', settings.USDT_RATE)}
                                disabled={saving === 'USDT_RATE'}
                                className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving === 'USDT_RATE' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : success === 'USDT_RATE' ? (
                                    <CheckCircle className="w-4 h-4" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Sauvegarder
                            </button>
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">
                            Taux utilise pour afficher l'equivalence USDT des prix en FCFA. Ex: Pack 50 000 FCFA = {settings.USDT_RATE ? (50000 / parseFloat(settings.USDT_RATE)).toFixed(2) : '76.34'} USDT
                        </p>
                    </div>
                </div>
            </div>

            {/* Mobile Money Settings */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-yellow-900/50 rounded-xl flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Depot Mobile Money</h2>
                        <p className="text-zinc-500 text-sm">Configuration du lien de paiement MoMo</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-zinc-400 mb-2">Lien de paiement MoMo</label>
                    <div className="flex gap-2">
                        <input
                            type="url"
                            value={settings.MOMO_LINK}
                            onChange={(e) => setSettings(prev => ({ ...prev, MOMO_LINK: e.target.value }))}
                            placeholder="https://pay.momo.cm/..."
                            className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-yellow-500 outline-none"
                        />
                        <button
                            onClick={() => updateSetting('MOMO_LINK', settings.MOMO_LINK)}
                            disabled={saving === 'MOMO_LINK'}
                            className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 shrink-0"
                        >
                            {saving === 'MOMO_LINK' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : success === 'MOMO_LINK' ? (
                                <CheckCircle className="w-4 h-4" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Sauvegarder
                        </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                        Lien de paiement ou les utilisateurs seront rediriges pour effectuer leur depot Mobile Money.
                    </p>
                    {!settings.MOMO_LINK && (
                        <div className="mt-3 p-3 bg-amber-900/20 border border-amber-800/50 rounded-xl flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="text-amber-400 text-xs">
                                Aucun lien configure. Les utilisateurs ne pourront pas deposer par Mobile Money.
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-blue-400 mb-2">Comment ca fonctionne</h3>
                        <ul className="text-sm text-blue-300 space-y-2">
                            <li><strong>1.</strong> L'utilisateur choisit un pack et une methode de paiement (USDT ou MoMo)</li>
                            <li><strong>2.</strong> Il effectue le paiement du <span className="text-amber-400">montant exact</span> du pack</li>
                            <li><strong>3.</strong> Il soumet une capture d'ecran de la transaction</li>
                            <li><strong>4.</strong> Vous verifiez la capture dans "Depots" et validez/rejetez</li>
                            <li><strong>5.</strong> Si valide, le montant (+ bonus USDT si applicable) est credite</li>
                        </ul>
                        <div className="mt-4 p-3 bg-amber-900/30 rounded-xl">
                            <p className="text-amber-300 text-xs">
                                <strong>Important:</strong> Si le montant envoye ne correspond pas exactement au pack choisi, l'argent peut etre perdu. Verifiez toujours les montants!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
