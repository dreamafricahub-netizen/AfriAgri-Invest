'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Leaf, Loader2, Shield, Users, TrendingUp, CheckCircle2, Sprout } from 'lucide-react';
import { LiveTicker } from '@/components/auth/LiveTicker';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const justRegistered = searchParams.get('registered') === 'true';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Email ou mot de passe incorrect');
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            setError('Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black">
            {/* Live Activity Ticker */}
            <div className="bg-zinc-900 border-b border-zinc-800 h-8 overflow-hidden flex items-center">
                <div className="flex items-center gap-2 px-3 shrink-0">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider whitespace-nowrap">En direct</span>
                </div>
                <div className="overflow-hidden flex-1">
                    <div className="flex animate-marquee whitespace-nowrap">
                        <MarqueeContent />
                        <MarqueeContent />
                    </div>
                </div>
            </div>

            {/* Main Layout: stacked on mobile, side-by-side on desktop */}
            <div className="max-w-6xl mx-auto px-4 py-6 lg:py-12 lg:flex lg:gap-10 lg:items-start">

                {/* LEFT COLUMN (desktop) — Info content */}
                <div className="hidden lg:flex lg:flex-col lg:flex-1 lg:gap-6">
                    {/* Hero */}
                    <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-8 text-white relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                    <Leaf className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">AfriAgri Invest</h2>
                                    <p className="text-green-200 text-sm">L'agriculture qui rapporte</p>
                                </div>
                            </div>
                            <p className="text-green-100 leading-relaxed">
                                Investissez dans l'agriculture africaine et recevez des rendements journaliers composes.
                                Des 3 000 FCFA, rejoignez +12 000 investisseurs qui font fructifier leur argent chaque jour.
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col items-center p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <Users className="w-5 h-5 text-blue-500 mb-2" />
                            <p className="text-xl font-black">12,847</p>
                            <p className="text-[10px] text-zinc-400 text-center">Investisseurs actifs</p>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
                            <p className="text-xl font-black">2.4 Mrd</p>
                            <p className="text-[10px] text-zinc-400 text-center">FCFA investis</p>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <CheckCircle2 className="w-5 h-5 text-amber-500 mb-2" />
                            <p className="text-xl font-black">98.7%</p>
                            <p className="text-[10px] text-zinc-400 text-center">Satisfaction</p>
                        </div>
                    </div>

                    {/* Our Story */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Sprout className="w-5 h-5 text-green-600" />
                            <h3 className="font-bold text-lg">Notre Histoire</h3>
                        </div>
                        <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            <p>
                                AfriAgri Invest est ne en 2024 d'une conviction simple : l'agriculture africaine est une mine d'or inexploitee. Nos fondateurs, issus du monde agricole et de la tech, ont decide de creer un pont entre les petits investisseurs et les cooperatives agricoles locales.
                            </p>
                            <p>
                                Aujourd'hui, nous collaborons avec plus de <span className="font-bold text-zinc-800 dark:text-zinc-200">45 cooperatives partenaires</span> reparties en Cote d'Ivoire, au Senegal, au Cameroun et au Mali. Chaque investissement finance directement l'achat de semences, d'engrais et d'equipements modernes.
                            </p>
                        </div>
                    </div>

                    {/* How We Generate Returns */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 rounded-2xl border border-green-100 dark:border-green-900/30 p-6">
                        <h3 className="font-bold text-lg mb-4 text-green-900 dark:text-green-100">Comment nous vous faisons gagner de l'argent</h3>
                        <div className="space-y-4">
                            {[
                                { n: '1', title: 'Votre argent finance les semences', desc: 'Chaque FCFA investi achete des semences certifiees, de l\'engrais bio et des outils pour nos cooperatives partenaires.' },
                                { n: '2', title: 'Les cooperatives cultivent et recoltent', desc: 'Cacao, cafe, hevea, palmier a huile... Nos partenaires exploitent des cultures a haute valeur sur les marches internationaux.' },
                                { n: '3', title: 'Les ventes generent des profits reels', desc: 'Les recoltes sont vendues en gros a des exportateurs agrees. Les marges de l\'agriculture africaine atteignent 30 a 60%.' },
                                { n: '4', title: 'Vous recevez votre part chaque jour', desc: 'Les benefices sont redistribues quotidiennement sous forme de rendements composes. Plus vous investissez tot, plus vos gains explosent.' },
                            ].map(step => (
                                <div key={step.n} className="flex gap-3">
                                    <div className={`w-8 h-8 ${step.n === '4' ? 'bg-agri-gold text-black' : 'bg-green-500 text-white'} rounded-full flex items-center justify-center text-xs font-black shrink-0`}>{step.n}</div>
                                    <div>
                                        <p className="font-bold text-sm text-green-900 dark:text-green-100">{step.title}</p>
                                        <p className="text-xs text-green-700 dark:text-green-300">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Live Activity */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold text-zinc-500">Activite en temps reel</span>
                        </div>
                        <div className="h-52 overflow-hidden">
                            <LiveTicker />
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <Shield className="w-4 h-4 text-green-600 shrink-0" />
                            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">Fonds 100% securises</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">Retrait sous 24h</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">Support WhatsApp 24/7</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">45+ cooperatives</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (desktop) / Main column (mobile) — Form + mobile info */}
                <div className="flex flex-col items-center w-full lg:w-[420px] lg:shrink-0 lg:sticky lg:top-12">
                    {/* Form Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl border border-zinc-100 dark:border-zinc-800"
                    >
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                                <Leaf className="w-8 h-8" />
                            </div>
                            <h1 className="text-2xl font-bold text-center">Bon retour !</h1>
                            <p className="text-zinc-500 text-sm text-center">Connecte-toi pour gerer ta ferme.</p>
                        </div>

                        {justRegistered && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 text-sm rounded-xl text-center font-medium mb-4 border border-green-100 dark:border-green-800">
                                Compte cree avec succes ! Connecte-toi maintenant.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl text-center font-medium">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                    placeholder="ex: jean@exemple.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Mot de passe</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/30 active:scale-95 transition-all flex items-center justify-center"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Se connecter'}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-zinc-500">
                            Pas encore de ferme ?{' '}
                            <Link href="/auth/register" className="text-green-600 font-bold hover:underline">
                                Creer un compte
                            </Link>
                        </div>
                    </motion.div>

                    {/* Desktop: small trust row below form */}
                    <div className="hidden lg:flex items-center justify-center gap-4 mt-4 text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Securise</span>
                        <span>|</span>
                        <span>MTN MoMo</span>
                        <span>|</span>
                        <span>Orange Money</span>
                        <span>|</span>
                        <span>Wave</span>
                    </div>

                    {/* MOBILE ONLY: info content below form */}
                    <div className="lg:hidden w-full flex flex-col gap-6 mt-6">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col items-center p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <Users className="w-4 h-4 text-blue-500 mb-1" />
                                <p className="text-sm font-black">12,847</p>
                                <p className="text-[9px] text-zinc-400 text-center">Investisseurs</p>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <TrendingUp className="w-4 h-4 text-green-500 mb-1" />
                                <p className="text-sm font-black">2.4 Mrd</p>
                                <p className="text-[9px] text-zinc-400 text-center">FCFA verses</p>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <CheckCircle2 className="w-4 h-4 text-amber-500 mb-1" />
                                <p className="text-sm font-black">98.7%</p>
                                <p className="text-[9px] text-zinc-400 text-center">Satisfaction</p>
                            </div>
                        </div>

                        {/* Live Activity */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold text-zinc-500">Activite en temps reel</span>
                            </div>
                            <div className="h-48 overflow-hidden">
                                <LiveTicker />
                            </div>
                        </div>

                        {/* Our Story */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Sprout className="w-5 h-5 text-green-600" />
                                <h3 className="font-bold">Notre Histoire</h3>
                            </div>
                            <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                <p>AfriAgri Invest est ne en 2024 d'une conviction simple : l'agriculture africaine est une mine d'or inexploitee. Nos fondateurs, issus du monde agricole et de la tech, ont decide de creer un pont entre les petits investisseurs et les cooperatives agricoles locales.</p>
                                <p>Aujourd'hui, nous collaborons avec plus de <span className="font-bold text-zinc-800 dark:text-zinc-200">45 cooperatives partenaires</span> reparties en Cote d'Ivoire, au Senegal, au Cameroun et au Mali.</p>
                            </div>
                        </div>

                        {/* How it works */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 rounded-2xl border border-green-100 dark:border-green-900/30 p-5">
                            <h3 className="font-bold mb-4 text-green-900 dark:text-green-100">Comment nous vous faisons gagner</h3>
                            <div className="space-y-4">
                                {[
                                    { n: '1', title: 'Votre argent finance les semences', desc: 'Semences certifiees, engrais bio et outils pour nos cooperatives.' },
                                    { n: '2', title: 'Les cooperatives cultivent', desc: 'Cacao, cafe, hevea, palmier a huile a haute valeur.' },
                                    { n: '3', title: 'Ventes aux exportateurs', desc: 'Marges de 30 a 60% sur les marches internationaux.' },
                                    { n: '4', title: 'Vos gains chaque jour', desc: 'Rendements composes redistribues quotidiennement.' },
                                ].map(step => (
                                    <div key={step.n} className="flex gap-3">
                                        <div className={`w-7 h-7 ${step.n === '4' ? 'bg-agri-gold text-black' : 'bg-green-500 text-white'} rounded-full flex items-center justify-center text-xs font-black shrink-0`}>{step.n}</div>
                                        <div>
                                            <p className="font-bold text-sm text-green-900 dark:text-green-100">{step.title}</p>
                                            <p className="text-xs text-green-700 dark:text-green-300">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Trust + Footer */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <Shield className="w-4 h-4 text-green-600 shrink-0" />
                                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">Fonds securises</span>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">Retrait sous 24h</span>
                            </div>
                        </div>

                        <div className="text-center pb-6">
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-2">Paiements acceptes</p>
                            <div className="flex justify-center items-center gap-4 opacity-50 text-xs font-black text-zinc-400">
                                <span>MTN MoMo</span><span className="text-zinc-300">|</span><span>Orange Money</span><span className="text-zinc-300">|</span><span>Wave</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-3">AfriAgri Invest v1.0.0</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MarqueeContent() {
    const items = [
        '🌱 Amadou K. (Abidjan) a investi 50 000 F',
        '💸 Fatou D. (Dakar) a retire 28 000 F',
        '📈 Ibrahim T. (Douala) a gagne +17 500 F',
        '🌱 Awa S. (Bamako) a investi 100 000 F',
        '💸 Kouame A. (Abidjan) a retire 75 000 F',
        '📈 Mariam B. (Lome) a gagne +3 500 F',
        '🌱 Seydou C. (Conakry) a investi 25 000 F',
        '💸 Aissatou N. (Dakar) a retire 45 000 F',
    ];
    return (
        <span className="inline-flex gap-8 mr-8">
            {items.map((item, i) => (
                <span key={i} className="text-xs text-zinc-400 whitespace-nowrap">{item}</span>
            ))}
        </span>
    );
}
