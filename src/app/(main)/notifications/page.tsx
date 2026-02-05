'use client';

import { ArrowLeft, Bell, TrendingUp, Gift, Shield, Megaphone, Users } from 'lucide-react';
import Link from 'next/link';

const NOTIFICATIONS = [
    {
        id: 1,
        type: 'gain',
        icon: <TrendingUp className="w-4 h-4 text-green-500" />,
        bg: 'bg-green-50 dark:bg-green-900/20',
        title: 'Gain journalier credite',
        desc: 'Votre capital a genere +3.5% aujourd\'hui. Vos gains s\'accumulent automatiquement.',
        time: 'Il y a 2h',
        unread: true,
    },
    {
        id: 2,
        type: 'bonus',
        icon: <Gift className="w-4 h-4 text-amber-500" />,
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        title: 'Bonus de bienvenue recu',
        desc: 'Felicitations ! Vous avez recu 3 000 F de bonus de bienvenue sur votre compte.',
        time: 'Il y a 5h',
        unread: true,
    },
    {
        id: 3,
        type: 'promo',
        icon: <Megaphone className="w-4 h-4 text-blue-500" />,
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        title: 'Nouveau pack disponible !',
        desc: 'Le pack "Plantation Moderne" est maintenant disponible a 50 000 F avec des rendements exceptionnels.',
        time: 'Il y a 1j',
        unread: true,
    },
    {
        id: 4,
        type: 'security',
        icon: <Shield className="w-4 h-4 text-green-500" />,
        bg: 'bg-green-50 dark:bg-green-900/20',
        title: 'Connexion reussie',
        desc: 'Connexion detectee depuis votre appareil habituel. Si ce n\'etait pas vous, changez votre mot de passe.',
        time: 'Il y a 1j',
        unread: false,
    },
    {
        id: 5,
        type: 'referral',
        icon: <Users className="w-4 h-4 text-purple-500" />,
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        title: 'Programme de parrainage',
        desc: 'Invitez vos amis et gagnez 10% de bonus sur chacun de leurs investissements. Partagez votre lien maintenant !',
        time: 'Il y a 2j',
        unread: false,
    },
    {
        id: 6,
        type: 'gain',
        icon: <TrendingUp className="w-4 h-4 text-green-500" />,
        bg: 'bg-green-50 dark:bg-green-900/20',
        title: 'Gain journalier credite',
        desc: 'Votre capital a genere +3.5% hier. Continuez a investir pour maximiser vos rendements.',
        time: 'Il y a 2j',
        unread: false,
    },
    {
        id: 7,
        type: 'info',
        icon: <Bell className="w-4 h-4 text-zinc-500" />,
        bg: 'bg-zinc-50 dark:bg-zinc-800',
        title: 'Bienvenue sur AfriAgri Invest',
        desc: 'Merci de nous avoir rejoint ! Commencez par investir dans un pack pour generer vos premiers gains quotidiens.',
        time: 'Il y a 3j',
        unread: false,
    },
];

export default function NotificationsPage() {
    return (
        <div className="p-4 space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                    <Link href="/profil" className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-black">Notifications</h1>
                </div>
                <button className="text-xs text-green-600 font-bold">Tout marquer lu</button>
            </div>

            {/* Today */}
            <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1 mb-3">Aujourd'hui</p>
                <div className="space-y-2">
                    {NOTIFICATIONS.filter(n => n.time.includes('h')).map(n => (
                        <div key={n.id} className={`flex gap-3 p-4 rounded-2xl border ${n.unread ? 'bg-white dark:bg-zinc-900 border-green-100 dark:border-green-900/30' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800'}`}>
                            <div className={`w-10 h-10 ${n.bg} rounded-full flex items-center justify-center shrink-0`}>
                                {n.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`font-bold text-sm ${n.unread ? '' : 'text-zinc-500'}`}>{n.title}</p>
                                    {n.unread && <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>}
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">{n.desc}</p>
                                <p className="text-[10px] text-zinc-400 mt-1">{n.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Earlier */}
            <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1 mb-3">Plus tot</p>
                <div className="space-y-2">
                    {NOTIFICATIONS.filter(n => n.time.includes('j')).map(n => (
                        <div key={n.id} className={`flex gap-3 p-4 rounded-2xl border ${n.unread ? 'bg-white dark:bg-zinc-900 border-green-100 dark:border-green-900/30' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800'}`}>
                            <div className={`w-10 h-10 ${n.bg} rounded-full flex items-center justify-center shrink-0`}>
                                {n.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`font-bold text-sm ${n.unread ? '' : 'text-zinc-500'}`}>{n.title}</p>
                                    {n.unread && <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>}
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">{n.desc}</p>
                                <p className="text-[10px] text-zinc-400 mt-1">{n.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4">
                <h3 className="font-bold text-sm mb-3">Preferences de notification</h3>
                <div className="space-y-3">
                    <ToggleRow label="Gains journaliers" desc="Notification quand tes gains sont credites" defaultOn={true} />
                    <ToggleRow label="Promotions" desc="Nouveaux packs et offres speciales" defaultOn={true} />
                    <ToggleRow label="Securite" desc="Alertes de connexion et activite suspecte" defaultOn={true} />
                    <ToggleRow label="Parrainage" desc="Quand un filleul s'inscrit ou investit" defaultOn={false} />
                </div>
            </div>
        </div>
    );
}

function ToggleRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-[10px] text-zinc-400">{desc}</p>
            </div>
            <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${defaultOn ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${defaultOn ? 'right-0.5' : 'left-0.5'}`}></div>
            </div>
        </div>
    );
}
