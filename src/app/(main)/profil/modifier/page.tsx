'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { ArrowLeft, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ModifierProfilPage() {
    const { data: session } = useSession();
    const [name, setName] = useState(session?.user?.name || '');
    const [email] = useState(session?.user?.email || '');
    const [phone, setPhone] = useState('');
    const [ville, setVille] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }, 1500);
    };

    return (
        <div className="p-4 space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center gap-3 pt-2">
                <Link href="/profil" className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-black">Modifier le profil</h1>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center">
                <div className="relative">
                    <div className="w-24 h-24 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden border-4 border-white dark:border-zinc-900 shadow-xl">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${email || 'Felix'}`} alt="Avatar" className="w-full h-full" />
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-lg">
                        <Camera className="w-4 h-4 text-white" />
                    </button>
                </div>
                <p className="text-xs text-zinc-400 mt-2">Appuyer pour changer la photo</p>
            </div>

            {/* Form */}
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Nom complet</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        placeholder="Ton nom complet"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-400 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-zinc-400 mt-1 ml-1">L'email ne peut pas etre modifie</p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Telephone (Mobile Money)</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        placeholder="01 23 45 67 89"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Ville</label>
                    <select
                        value={ville}
                        onChange={(e) => setVille(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    >
                        <option value="">Selectionner ta ville</option>
                        <option value="abidjan">Abidjan</option>
                        <option value="dakar">Dakar</option>
                        <option value="douala">Douala</option>
                        <option value="bamako">Bamako</option>
                        <option value="lome">Lome</option>
                        <option value="cotonou">Cotonou</option>
                        <option value="ouagadougou">Ouagadougou</option>
                        <option value="conakry">Conakry</option>
                        <option value="niamey">Niamey</option>
                        <option value="kinshasa">Kinshasa</option>
                    </select>
                </div>
            </div>

            {/* Save */}
            {saved && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Profil mis a jour avec succes !</span>
                </div>
            )}

            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer les modifications'}
            </button>
        </div>
    );
}
