'use client';

import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { Loader2, Shield, HelpCircle, FileText, ChevronRight, Star, Share2, Bell, Globe, Check, Copy } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useUserData } from '@/hooks/useUserData';

export default function ProfilPage() {
    const { data: session } = useSession();
    const { userData, loading } = useUserData();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [copied, setCopied] = useState(false);

    const referralCode = userData?.referralCode || '';
    const referralLink = `https://afriagriinvest.vercel.app/r/${referralCode}`;

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

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await signOut({ callbackUrl: '/auth/login' });
    };

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
                <p className="text-zinc-500">Chargement du profil...</p>
            </div>
        );
    }

    const investedCapital = userData?.investedCapital || 0;
    const investments = userData?.investments || [];
    const referralCount = userData?.referralCount || 0;

    // Calculate investor level
    let level = "Debutant";
    let levelColor = "text-zinc-500";
    let levelBg = "bg-zinc-100 dark:bg-zinc-800";
    if (investedCapital >= 10000) { level = "Fermier"; levelColor = "text-green-600"; levelBg = "bg-green-50 dark:bg-green-900/20"; }
    if (investedCapital >= 50000) { level = "Exploitant"; levelColor = "text-blue-600"; levelBg = "bg-blue-50 dark:bg-blue-900/20"; }
    if (investedCapital >= 200000) { level = "Agro-Expert"; levelColor = "text-purple-600"; levelBg = "bg-purple-50 dark:bg-purple-900/20"; }
    if (investedCapital >= 500000) { level = "Magnat"; levelColor = "text-amber-600"; levelBg = "bg-amber-50 dark:bg-amber-900/20"; }

    return (
        <div className="p-4 space-y-6 pb-8">
            {/* Profile Header */}
            <div className="flex flex-col items-center pt-6 pb-4">
                <div className="relative">
                    <div className="w-24 h-24 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-3 overflow-hidden border-4 border-white dark:border-zinc-900 shadow-xl">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.email || 'Felix'}`} alt="Avatar" className="w-full h-full" />
                    </div>
                    <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${levelBg} ${levelColor} border`}>
                        {level}
                    </div>
                </div>
                <h2 className="text-2xl font-bold mt-3">{session?.user?.name || 'Investisseur'}</h2>
                <p className="text-zinc-500 text-sm">{session?.user?.email}</p>
            </div>

            {/* Account Stats */}
            <div className="grid grid-cols-3 gap-3">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center">
                    <p className="text-lg font-black text-zinc-800 dark:text-zinc-100">{investments.length}</p>
                    <p className="text-[10px] text-zinc-400">Fermes</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center">
                    <p className="text-lg font-black text-zinc-800 dark:text-zinc-100">{referralCount}</p>
                    <p className="text-[10px] text-zinc-400">Filleuls</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center">
                    <p className="text-lg font-black text-green-600">{level}</p>
                    <p className="text-[10px] text-zinc-400">Niveau</p>
                </motion.div>
            </div>

            {/* Referral Card */}
            <Link href="/parrainage" className="block">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 rounded-2xl text-white relative overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Share2 className="w-5 h-5" />
                                <h3 className="font-bold">Inviter des amis</h3>
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/60" />
                        </div>
                        <p className="text-sm text-green-100 mb-3">Gagne 10% de bonus sur chaque investissement de tes filleuls. A vie.</p>
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => { e.preventDefault(); handleCopyLink(); }}
                                className="bg-white text-green-600 px-4 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
                            >
                                {copied ? <><Check className="w-4 h-4" /> Copie !</> : <><Copy className="w-4 h-4" /> Copier le lien</>}
                            </button>
                            <span className="bg-white/20 text-white px-3 py-2 rounded-full text-xs font-medium backdrop-blur-sm">
                                {referralCount} filleul{referralCount > 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Menu Sections */}
            <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1 mb-2">Compte</p>
                <Link href="/profil/modifier">
                    <ButtonRow label="Modifier le profil" icon={<span className="text-xl">✏️</span>} />
                </Link>
                <Link href="/notifications">
                    <ButtonRow label="Notifications" icon={<Bell className="w-5 h-5 text-blue-500" />} />
                </Link>
                <ButtonRow label="Langue" icon={<Globe className="w-5 h-5 text-purple-500" />} value="Francais" />
            </div>

            <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1 mb-2">Securite</p>
                <Link href="/profil/mot-de-passe">
                    <ButtonRow label="Changer le mot de passe" icon={<Shield className="w-5 h-5 text-green-500" />} />
                </Link>
                <Link href="/profil/code-pin">
                    <ButtonRow label="Code PIN de retrait" icon={<span className="text-xl">🔒</span>} />
                </Link>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1 mb-2">Support</p>
                <Link href="/aide">
                    <ButtonRow label="Centre d'aide" icon={<HelpCircle className="w-5 h-5 text-amber-500" />} />
                </Link>
                <Link href="/contact">
                    <ButtonRow label="Contacter le support" icon={<span className="text-xl">🎧</span>} value="WhatsApp" />
                </Link>
                <ButtonRow label="Noter l'application" icon={<Star className="w-5 h-5 text-yellow-500" />} />
                <Link href="/mentions-legales">
                    <ButtonRow label="Mentions legales" icon={<FileText className="w-5 h-5 text-zinc-400" />} />
                </Link>
            </div>

            {/* Logout */}
            <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 font-bold py-3.5 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 border border-red-100 dark:border-red-900/30"
            >
                {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Se Deconnecter'}
            </button>

            {/* App Version */}
            <p className="text-center text-[10px] text-zinc-400 pb-4">
                AfriAgri Invest v1.0.0 — Tous droits reserves
            </p>
        </div>
    );
}

function ButtonRow({ label, icon, badge, value }: { label: string; icon: React.ReactNode; badge?: string; value?: string }) {
    return (
        <button className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <span className="flex items-center gap-3">
                {icon}
                <span className="font-medium text-sm">{label}</span>
            </span>
            <span className="flex items-center gap-2">
                {badge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{badge}</span>
                )}
                {value && (
                    <span className="text-xs text-zinc-400">{value}</span>
                )}
                <ChevronRight className="w-4 h-4 text-zinc-300" />
            </span>
        </button>
    );
}
