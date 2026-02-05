'use client';

import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2, Shield } from 'lucide-react';
import Link from 'next/link';

export default function MotDePassePage() {
    const [current, setCurrent] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = () => {
        setError('');
        if (!current || !newPass || !confirm) {
            setError('Tous les champs sont obligatoires');
            return;
        }
        if (newPass.length < 6) {
            setError('Le nouveau mot de passe doit contenir au moins 6 caracteres');
            return;
        }
        if (newPass !== confirm) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setSaved(true);
            setCurrent('');
            setNewPass('');
            setConfirm('');
            setTimeout(() => setSaved(false), 3000);
        }, 1500);
    };

    // Password strength
    let strength = 0;
    if (newPass.length >= 6) strength++;
    if (newPass.length >= 8) strength++;
    if (/[A-Z]/.test(newPass)) strength++;
    if (/[0-9]/.test(newPass)) strength++;
    if (/[^A-Za-z0-9]/.test(newPass)) strength++;

    const strengthLabels = ['', 'Faible', 'Moyen', 'Bon', 'Fort', 'Excellent'];
    const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

    return (
        <div className="p-4 space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center gap-3 pt-2">
                <Link href="/profil" className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-black">Mot de passe</h1>
            </div>

            {/* Security Info */}
            <div className="flex gap-3 items-start p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold text-sm text-blue-900 dark:text-blue-100">Protege ton compte</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                        Utilise un mot de passe unique et complexe. Ne partage jamais ton mot de passe avec qui que ce soit.
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl text-center font-medium">
                        {error}
                    </div>
                )}

                {saved && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Mot de passe modifie avec succes !</span>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Mot de passe actuel</label>
                    <div className="relative">
                        <input
                            type={showCurrent ? 'text' : 'password'}
                            value={current}
                            onChange={(e) => setCurrent(e.target.value)}
                            className="w-full px-4 py-3 pr-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            placeholder="Ton mot de passe actuel"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrent(!showCurrent)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                        >
                            {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Nouveau mot de passe</label>
                    <div className="relative">
                        <input
                            type={showNew ? 'text' : 'password'}
                            value={newPass}
                            onChange={(e) => setNewPass(e.target.value)}
                            className="w-full px-4 py-3 pr-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            placeholder="Minimum 6 caracteres"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                        >
                            {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {newPass.length > 0 && (
                        <div className="mt-2 space-y-1">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? strengthColors[strength] : 'bg-zinc-200 dark:bg-zinc-700'}`}></div>
                                ))}
                            </div>
                            <p className="text-[10px] text-zinc-400">Force : {strengthLabels[strength]}</p>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Confirmer le nouveau mot de passe</label>
                    <input
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        placeholder="Confirmer le mot de passe"
                    />
                    {confirm.length > 0 && confirm !== newPass && (
                        <p className="text-[10px] text-red-500 mt-1 ml-1">Les mots de passe ne correspondent pas</p>
                    )}
                    {confirm.length > 0 && confirm === newPass && newPass.length > 0 && (
                        <p className="text-[10px] text-green-500 mt-1 ml-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Les mots de passe correspondent
                        </p>
                    )}
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Modifier le mot de passe'}
            </button>
        </div>
    );
}
