'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Leaf, Loader2, Shield, Users, TrendingUp, CheckCircle2, Sprout } from 'lucide-react';
import { LiveTicker } from '@/components/auth/LiveTicker';

export default function RegisterPage() {
    return (
        <Suspense>
            <RegisterContent />
        </Suspense>
    );
}

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const referralCode = searchParams.get('ref');
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, referredBy: referralCode || undefined }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Erreur inconnue');
            }
            router.push('/auth/login?registered=true');
        } catch (err: any) {
            setError(err.message);
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
                                    <h2 className="text-2xl font-black">Rejoins AfriAgri</h2>
                                    <p className="text-green-200 text-sm">+237 inscrits cette semaine</p>
                                </div>
                            </div>
                            <p className="text-green-100 leading-relaxed">
                                Cree ton compte gratuitement et commence a investir dans l'agriculture africaine des aujourd'hui.
                                Des 3 000 FCFA, fais fructifier ton argent avec un rendement compose de 3.5% par jour.
                            </p>
                        </div>
                    </div>

                    {/* Bonus */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white text-center shadow-lg">
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-100 mb-1">Offre de bienvenue</p>
                        <p className="font-black text-2xl">3 000 F de bonus</p>
                        <p className="text-sm text-amber-100 mt-1">Recois un solde de bienvenue pour decouvrir la plateforme.</p>
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

                    {/* Who we are */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Sprout className="w-5 h-5 text-green-600" />
                            <h3 className="font-bold text-lg">Qui sommes-nous ?</h3>
                        </div>
                        <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            <p>Fondes en 2024 par une equipe de jeunes entrepreneurs africains, AfriAgri Invest est ne d'un constat : l'Afrique possede 60% des terres arables mondiales, mais seulement 6% sont exploitees avec des moyens modernes.</p>
                            <p>Notre mission est de <span className="font-bold text-zinc-800 dark:text-zinc-200">democratiser l'investissement agricole</span> en permettant a chacun, meme avec 3 000 FCFA, de participer a la revolution verte africaine et d'en tirer des revenus concrets.</p>
                            <p>Nous travaillons avec <span className="font-bold text-zinc-800 dark:text-zinc-200">45 cooperatives certifiees</span> dans 4 pays d'Afrique de l'Ouest. Chaque cooperative est auditee et suit un cahier des charges strict.</p>
                        </div>
                    </div>

                    {/* How it works */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 rounded-2xl border border-green-100 dark:border-green-900/30 p-6">
                        <h3 className="font-bold text-lg mb-4 text-green-900 dark:text-green-100">D'ou viennent vos gains ?</h3>
                        <div className="space-y-4">
                            {[
                                { n: '1', title: 'Financement des cultures', desc: 'Votre investissement achete des semences de cacao, cafe, hevea et palmier a huile pour nos cooperatives.' },
                                { n: '2', title: 'Production et recolte', desc: 'Les cooperatives cultivent avec des techniques modernes. Le cacao ivoirien, 1er mondial, genere des marges de 40 a 60%.' },
                                { n: '3', title: 'Vente aux exportateurs', desc: 'Les recoltes sont vendues a des negociants internationaux (Cargill, Barry Callebaut, Olam) a des prix premium.' },
                                { n: '4', title: 'Redistribution des profits', desc: 'Les benefices sont reverses chaque jour sous forme de rendements composes. Retrait via Mobile Money a tout moment.' },
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

                    {/* Testimonials */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
                        <h3 className="font-bold mb-4">Ils nous font confiance</h3>
                        <div className="space-y-4">
                            <div className="flex gap-3 items-start">
                                <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-sm shrink-0">👨🏿</div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-bold text-xs">Amadou K.</span>
                                        <span className="text-yellow-500 text-[10px]">★★★★★</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 leading-relaxed">"J'ai commence avec 3 000 F pour tester. Aujourd'hui j'ai 3 fermes et je retire regulierement."</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-sm shrink-0">👩🏾</div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-bold text-xs">Fatou D.</span>
                                        <span className="text-yellow-500 text-[10px]">★★★★★</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 leading-relaxed">"Mon mari et moi investissons depuis 4 mois. On a deja multiplie notre capital par 3."</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm shrink-0">👨🏾</div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-bold text-xs">Ibrahim T.</span>
                                        <span className="text-yellow-500 text-[10px]">★★★★★</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 leading-relaxed">"Pack Domaine achete en janvier. Deja 3x mon investissement. L'equipe repond vite."</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trust */}
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
                            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">Inscription gratuite</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">Des 3 000 FCFA</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (desktop) / Main column (mobile) — Form */}
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
                            <h1 className="text-2xl font-bold text-center">Creer ta Ferme</h1>
                            <p className="text-zinc-500 text-sm text-center">Commence ton aventure agricole.</p>
                        </div>

                        {/* Social Proof */}
                        <div className="flex items-center justify-center gap-2 mb-5 p-2 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800">
                            <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full bg-blue-400 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] text-white font-bold">AK</div>
                                <div className="w-6 h-6 rounded-full bg-purple-400 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] text-white font-bold">FD</div>
                                <div className="w-6 h-6 rounded-full bg-amber-400 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] text-white font-bold">IT</div>
                            </div>
                            <span className="text-[11px] text-green-700 dark:text-green-300 font-medium">+237 inscrits cette semaine</span>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {referralCode && (
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm rounded-xl text-center font-medium border border-green-200 dark:border-green-800">
                                    Tu as ete invite par un parrain ! Code : <span className="font-bold">{referralCode}</span>
                                </div>
                            )}
                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl text-center font-medium">{error}</div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Nom Complet</label>
                                <input name="name" type="text" value={formData.name} onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                    placeholder="Ton nom" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Email</label>
                                <input name="email" type="email" value={formData.email} onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                    placeholder="Ton email" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Telephone (Mobile Money)</label>
                                <input name="phone" type="tel" value={formData.phone} onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                    placeholder="01 23 45 67 89" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Mot de passe</label>
                                <input name="password" type="password" value={formData.password} onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                    placeholder="••••••••" required />
                            </div>

                            <button type="submit" disabled={isLoading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/30 active:scale-95 transition-all flex items-center justify-center">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Creer mon compte gratuitement'}
                            </button>

                            <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
                                En creant un compte, tu acceptes nos Conditions d'utilisation et notre Politique de confidentialite.
                            </p>
                        </form>

                        <div className="mt-6 text-center text-sm text-zinc-500">
                            Deja un compte ?{' '}
                            <Link href="/auth/login" className="text-green-600 font-bold hover:underline">Se connecter</Link>
                        </div>
                    </motion.div>

                    {/* Desktop: small trust row below form */}
                    <div className="hidden lg:flex items-center justify-center gap-4 mt-4 text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Securise</span>
                        <span>|</span><span>MTN MoMo</span><span>|</span><span>Orange Money</span><span>|</span><span>Wave</span>
                    </div>

                    {/* MOBILE ONLY: info content below form */}
                    <div className="lg:hidden w-full flex flex-col gap-6 mt-6">
                        {/* Bonus */}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white text-center shadow-lg">
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-100 mb-1">Offre de bienvenue</p>
                            <p className="font-black text-lg">3 000 F de bonus a l'inscription !</p>
                            <p className="text-xs text-amber-100 mt-1">Recois un solde de bienvenue pour decouvrir.</p>
                        </div>

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

                        {/* Story */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Sprout className="w-5 h-5 text-green-600" />
                                <h3 className="font-bold">Qui sommes-nous ?</h3>
                            </div>
                            <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                <p>Fondes en 2024, AfriAgri Invest permet a chacun d'investir dans l'agriculture africaine et d'en tirer des revenus concrets. 60% des terres arables mondiales sont en Afrique.</p>
                                <p>Nous travaillons avec <span className="font-bold text-zinc-800 dark:text-zinc-200">45 cooperatives certifiees</span> dans 4 pays d'Afrique de l'Ouest.</p>
                            </div>
                        </div>

                        {/* How it works */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 rounded-2xl border border-green-100 dark:border-green-900/30 p-5">
                            <h3 className="font-bold mb-4 text-green-900 dark:text-green-100">D'ou viennent vos gains ?</h3>
                            <div className="space-y-4">
                                {[
                                    { n: '1', title: 'Financement des semences', desc: 'Cacao, cafe, hevea, palmier a huile.' },
                                    { n: '2', title: 'Production par les cooperatives', desc: 'Marges de 40 a 60% sur le marche mondial.' },
                                    { n: '3', title: 'Vente aux exportateurs', desc: 'Cargill, Barry Callebaut, Olam a prix premium.' },
                                    { n: '4', title: 'Vos gains chaque jour', desc: 'Rendements composes + retrait Mobile Money.' },
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
        '🌱 Moussa D. (Bamako) a investi 25 000 F',
        '💸 Bintou S. (Abidjan) a retire 45 000 F',
        '📈 Cheick O. (Ouagadougou) a gagne +10 500 F',
        '🌱 Rokia D. (Dakar) a investi 200 000 F',
        '💸 Youssouf K. (Douala) a retire 120 000 F',
        '📈 Kadiatou T. (Conakry) a gagne +7 000 F',
        '🌱 Adama B. (Lome) a investi 10 000 F',
        '💸 Mariame K. (Bamako) a retire 32 000 F',
    ];
    return (
        <span className="inline-flex gap-8 mr-8">
            {items.map((item, i) => (
                <span key={i} className="text-xs text-zinc-400 whitespace-nowrap">{item}</span>
            ))}
        </span>
    );
}
