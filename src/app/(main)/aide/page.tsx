'use client';

import { HelpCircle, ChevronDown, Shield, Wallet, Users, Sprout, TrendingUp, AlertTriangle, Gift, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = useState(false);
    return (
        <button
            onClick={() => setOpen(!open)}
            className="w-full text-left bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden"
        >
            <div className="flex items-center justify-between p-4">
                <span className="font-bold text-sm pr-4">{question}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <p className="px-4 pb-4 text-sm text-zinc-500 leading-relaxed">{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
}

export default function AidePage() {
    return (
        <div className="p-4 space-y-6 pb-8">
            {/* Header */}
            <div className="text-center pt-4">
                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <HelpCircle className="w-7 h-7 text-amber-500" />
                </div>
                <h1 className="text-2xl font-black">Centre d'aide</h1>
                <p className="text-zinc-500 text-sm mt-1">Tout ce que tu dois savoir sur AfriAgri Invest</p>
            </div>

            {/* How it works */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 rounded-2xl border border-green-100 dark:border-green-900/30 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Sprout className="w-5 h-5 text-green-600" />
                    <h2 className="font-bold text-lg text-green-900 dark:text-green-100">Comment ca marche ?</h2>
                </div>
                <div className="space-y-4">
                    {[
                        { n: '1', title: 'Cree ton compte gratuitement', desc: 'Inscription rapide avec ton email et numero de telephone. Tu recois un bonus de bienvenue de 3 000 F.' },
                        { n: '2', title: 'Choisis un pack agricole', desc: 'Selectionne un pack d\'investissement parmi nos 8 options, de 3 000 F a 500 000 F. Chaque pack represente une ferme virtuelle.' },
                        { n: '3', title: 'Tes gains s\'accumulent chaque jour', desc: 'Ton capital investi genere un rendement compose de 3.5% par jour. Plus tu investis tot, plus tes gains explosent grace a l\'effet compose.' },
                        { n: '4', title: 'Retire tes gains via Mobile Money', desc: 'Une fois que tu as investi dans un pack, tu peux retirer tes gains a tout moment via MTN MoMo, Orange Money ou Wave.' },
                    ].map(step => (
                        <div key={step.n} className="flex gap-3">
                            <div className={`w-8 h-8 ${step.n === '4' ? 'bg-agri-gold text-black' : 'bg-green-500 text-white'} rounded-full flex items-center justify-center text-xs font-black shrink-0`}>{step.n}</div>
                            <div>
                                <p className="font-bold text-sm text-green-900 dark:text-green-100">{step.title}</p>
                                <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Rules & Conditions */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <h2 className="font-bold text-lg">Regles et conditions</h2>
                </div>
                <div className="space-y-3">
                    <RuleItem
                        icon={<Gift className="w-4 h-4 text-amber-500" />}
                        title="Bonus de bienvenue : 3 000 F"
                        desc="A l'inscription, tu recois un solde de bienvenue de 3 000 F. Ce bonus est un cadeau pour te permettre de decouvrir la plateforme."
                    />
                    <RuleItem
                        icon={<Wallet className="w-4 h-4 text-green-500" />}
                        title="Investir avant de retirer"
                        desc="Pour effectuer ton premier retrait, tu dois d'abord investir dans au moins un pack agricole. Cette condition garantit ton engagement dans le programme."
                    />
                    <RuleItem
                        icon={<Users className="w-4 h-4 text-purple-500" />}
                        title="Programme de parrainage"
                        desc="Parraine tes amis et gagne 10% de bonus sur chacun de leurs investissements, a vie. Le parrainage te permet aussi de debloquer des avantages speciaux sur la plateforme."
                    />
                    <RuleItem
                        icon={<TrendingUp className="w-4 h-4 text-green-500" />}
                        title="Rendement compose : 3.5% / jour"
                        desc="Ton capital investi croit automatiquement de 3.5% par jour grace a l'interet compose. Cela signifie que tes gains d'aujourd'hui generent aussi des gains demain."
                    />
                    <RuleItem
                        icon={<ArrowUpRight className="w-4 h-4 text-blue-500" />}
                        title="Retraits via Mobile Money"
                        desc="Les retraits sont traites sous 24h via MTN Mobile Money, Orange Money ou Wave. Montant minimum de retrait : 1 000 F."
                    />
                    <RuleItem
                        icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
                        title="Capital minimum par pack"
                        desc="Le pack le plus accessible commence a 3 000 F (Petite Ferme Starter). Tu peux investir dans plusieurs packs simultanement pour diversifier."
                    />
                </div>
            </div>

            {/* Packs Summary */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Sprout className="w-5 h-5 text-green-600" />
                    <h2 className="font-bold text-lg">Nos packs d'investissement</h2>
                </div>
                <div className="space-y-2">
                    {[
                        { name: 'Petite Ferme Starter', price: '3 000 F', gain: '+105 F/jour', icon: '🌱' },
                        { name: 'Ferme Familiale', price: '5 000 F', gain: '+175 F/jour', icon: '🌱' },
                        { name: 'Exploitation Rurale', price: '10 000 F', gain: '+350 F/jour', icon: '🌳' },
                        { name: 'Domaine Agricole', price: '25 000 F', gain: '+875 F/jour', icon: '🌳' },
                        { name: 'Plantation Moderne', price: '50 000 F', gain: '+1 750 F/jour', icon: '🏡' },
                        { name: 'Agro-Industrie', price: '100 000 F', gain: '+3 500 F/jour', icon: '🏡' },
                        { name: 'Empire Vert', price: '200 000 F', gain: '+7 000 F/jour', icon: '🌾' },
                        { name: 'Ferme Milliardaire', price: '500 000 F', gain: '+17 500 F/jour', icon: '🏰' },
                    ].map((pack, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{pack.icon}</span>
                                <div>
                                    <p className="font-bold text-sm">{pack.name}</p>
                                    <p className="text-[10px] text-zinc-500">{pack.price}</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">{pack.gain}</span>
                        </div>
                    ))}
                </div>
                <Link href="/investir">
                    <button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors active:scale-95">
                        Voir les packs disponibles
                    </button>
                </Link>
            </div>

            {/* FAQ */}
            <div>
                <div className="flex items-center gap-2 mb-4 px-1">
                    <HelpCircle className="w-5 h-5 text-zinc-400" />
                    <h2 className="font-bold text-lg">Questions frequentes</h2>
                </div>
                <div className="space-y-2">
                    <FAQItem
                        question="Comment fonctionne le bonus de bienvenue ?"
                        answer="A ton inscription, tu recois automatiquement 3 000 F sur ton solde. Ce bonus te permet de decouvrir la plateforme. Pour retirer des fonds, tu dois d'abord investir dans au moins un pack agricole."
                    />
                    <FAQItem
                        question="Quand est-ce que je peux retirer mon argent ?"
                        answer="Tu peux retirer tes gains a tout moment, a condition d'avoir investi dans au moins un pack agricole. Les retraits sont traites sous 24h via Mobile Money (MTN, Orange Money, Wave)."
                    />
                    <FAQItem
                        question="Comment fonctionne le rendement compose ?"
                        answer="Ton capital investi croit de 3.5% par jour de maniere composee. Cela signifie que le gain du jour 1 s'ajoute a ton capital, et le jour 2 tu gagnes 3.5% sur ce nouveau montant plus eleve. L'effet boule de neige fait exploser tes gains sur 30 jours."
                    />
                    <FAQItem
                        question="Est-ce que je peux investir dans plusieurs packs ?"
                        answer="Oui ! Tu peux acheter autant de packs que tu veux. Chaque pack genere ses propres rendements quotidiens. Plus tu diversifies, plus tes gains s'accumulent rapidement."
                    />
                    <FAQItem
                        question="Comment fonctionne le parrainage ?"
                        answer="Partage ton lien de parrainage avec tes amis. Quand ils s'inscrivent et investissent, tu recois 10% de bonus sur chacun de leurs investissements, a vie. Le parrainage te donne aussi acces a des avantages exclusifs sur la plateforme."
                    />
                    <FAQItem
                        question="Mon argent est-il en securite ?"
                        answer="Tes fonds sont securises par nos partenaires financiers agrees. Chaque cooperative partenaire est auditee et certifiee. Les retraits sont garantis et traites sous 24h."
                    />
                    <FAQItem
                        question="Quel est le montant minimum pour investir ?"
                        answer="Le pack le plus accessible est la Petite Ferme Starter a 3 000 F. C'est le montant minimum pour commencer a investir et generer des rendements quotidiens."
                    />
                    <FAQItem
                        question="Combien de personnes dois-je parrainer ?"
                        answer="Il n'y a pas de nombre minimum obligatoire pour utiliser la plateforme. Cependant, plus tu parraines, plus tu gagnes de bonus. Chaque filleul te rapporte 10% sur ses investissements."
                    />
                    <FAQItem
                        question="Quels sont les moyens de paiement acceptes ?"
                        answer="Nous acceptons MTN Mobile Money, Orange Money et Wave. Les depots et retraits sont instantanes pour les depots et traites sous 24h pour les retraits."
                    />
                    <FAQItem
                        question="Puis-je annuler un investissement ?"
                        answer="Les investissements dans les packs agricoles sont des engagements dans des cycles de production. Une fois investi, ton capital est actif et genere des rendements chaque jour. Tu peux retirer tes gains accumules a tout moment."
                    />
                </div>
            </div>

            {/* Contact Support */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 rounded-2xl text-white relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
                <div className="relative z-10">
                    <h3 className="font-bold mb-1">Besoin d'aide supplementaire ?</h3>
                    <p className="text-sm text-green-100 mb-3">Notre equipe de support est disponible 24h/24 et 7j/7 sur WhatsApp.</p>
                    <button className="bg-white text-green-600 px-5 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform">
                        Contacter le support
                    </button>
                </div>
            </div>

            {/* Legal */}
            <div className="text-center text-[10px] text-zinc-400 space-y-1 pb-4">
                <p>AfriAgri Invest v1.0.0</p>
                <p>Conditions d'utilisation | Politique de confidentialite</p>
                <p>Tous droits reserves 2024</p>
            </div>
        </div>
    );
}

function RuleItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="flex gap-3 items-start p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
            <div className="w-8 h-8 bg-white dark:bg-zinc-700 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                {icon}
            </div>
            <div>
                <p className="font-bold text-sm">{title}</p>
                <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">{desc}</p>
            </div>
        </div>
    );
}
