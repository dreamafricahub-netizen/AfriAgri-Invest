'use client';

import { useState } from 'react';
import { Settings, Save, AlertTriangle, Info } from 'lucide-react';

export default function AdminSettingsPage() {
    const [dailyRate, setDailyRate] = useState('3.5');
    const [welcomeBonus, setWelcomeBonus] = useState('3000');
    const [referralBonus, setReferralBonus] = useState('10');
    const [minWithdrawal, setMinWithdrawal] = useState('1000');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Parametres</h1>
                <p className="text-zinc-400 text-sm">Configuration de la plateforme</p>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-blue-300 text-sm">
                        Les parametres ci-dessous sont actuellement codes en dur dans l'application.
                        Une mise a jour du code sera necessaire pour les modifier.
                    </p>
                </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Daily Rate */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-zinc-400" />
                        Taux de rendement
                    </h3>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Taux journalier (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={dailyRate}
                            onChange={(e) => setDailyRate(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-red-500 outline-none"
                            disabled
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                            Actuellement: 3.5% par jour (compose)
                        </p>
                    </div>
                </div>

                {/* Welcome Bonus */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-zinc-400" />
                        Bonus de bienvenue
                    </h3>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Montant (FCFA)</label>
                        <input
                            type="number"
                            value={welcomeBonus}
                            onChange={(e) => setWelcomeBonus(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-red-500 outline-none"
                            disabled
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                            Credite automatiquement a l'inscription
                        </p>
                    </div>
                </div>

                {/* Referral Bonus */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-zinc-400" />
                        Bonus de parrainage
                    </h3>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Pourcentage (%)</label>
                        <input
                            type="number"
                            value={referralBonus}
                            onChange={(e) => setReferralBonus(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-red-500 outline-none"
                            disabled
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                            10% des investissements des filleuls
                        </p>
                    </div>
                </div>

                {/* Min Withdrawal */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-zinc-400" />
                        Retrait minimum
                    </h3>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Montant (FCFA)</label>
                        <input
                            type="number"
                            value={minWithdrawal}
                            onChange={(e) => setMinWithdrawal(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-red-500 outline-none"
                            disabled
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                            Montant minimum pour effectuer un retrait
                        </p>
                    </div>
                </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-900/20 border border-amber-800/50 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-amber-300 font-medium">Fonctionnalite en developpement</p>
                    <p className="text-amber-400/70 text-sm mt-1">
                        La modification dynamique des parametres sera disponible dans une prochaine mise a jour.
                        Pour l'instant, contactez le developpeur pour toute modification.
                    </p>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-zinc-900 border border-red-900/50 rounded-2xl p-6">
                <h3 className="font-bold text-red-400 mb-4">Zone dangereuse</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl">
                        <div>
                            <p className="font-medium text-white">Exporter les donnees</p>
                            <p className="text-xs text-zinc-500">Telecharger toutes les donnees en CSV</p>
                        </div>
                        <button className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-sm font-medium transition-colors">
                            Exporter
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl">
                        <div>
                            <p className="font-medium text-white">Reinitialiser les gains</p>
                            <p className="text-xs text-zinc-500">Remettre tous les gains a zero (irreversible)</p>
                        </div>
                        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors" disabled>
                            Desactive
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
