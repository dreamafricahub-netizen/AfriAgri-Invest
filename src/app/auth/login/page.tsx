'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, Percent, Target, CheckCircle2 } from 'lucide-react';

function LoginContent() {
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
            const result = await signIn('credentials', { email, password, redirect: false });
            if (result?.error) {
                setError('Email ou mot de passe incorrect');
            } else {
                router.push('/');
                router.refresh();
            }
        } catch {
            setError('Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black">
            <div className="max-w-5xl mx-auto px-4 py-8 lg:py-16 lg:flex lg:gap-12 lg:items-start">

                {/* Argumentaire — desktop uniquement */}
                <div className="hidden lg:flex lg:flex-col lg:flex-1 lg:gap-5">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">
                            <span className="text-zinc-900 dark:text-white">Zoo</span>
                            <span className="text-agri-green">Foot</span>
                        </h2>
                        <p className="text-zinc-500 mt-1">Le pari inversé</p>
                    </div>

                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-md">
                        Vous écartez les scores qui n&apos;arriveront pas. Vous gagnez si aucun
                        d&apos;eux ne tombe. Plus vous en écartez, plus la cote monte.
                    </p>

                    {/*
                      Deux arguments, et les deux sont verifiables par l'utilisateur
                      lui-meme. Pas de chiffres d'audience, pas de temoignages :
                      la plateforme demarre, et le pretendre serait mentir.
                    */}
                    <div className="flex flex-col gap-3 mt-2 max-w-md">
                        <Argument
                            icon={<Percent className="w-4 h-4" />}
                            title="Notre marge est affichée"
                            body="Elle apparaît sur chaque pari. Comparez-la à celle des autres opérateurs, sur le même match."
                        />
                        <Argument
                            icon={<ShieldCheck className="w-4 h-4" />}
                            title="Les matchs virtuels sont scellés"
                            body="Le résultat est tiré avant l'ouverture des paris. Son empreinte est publiée, et vous pouvez vérifier après coup qu'elle n'a pas changé."
                        />
                        <Argument
                            icon={<Target className="w-4 h-4" />}
                            title="Le règlement est automatique"
                            body="Dès la fin du match, les paris sont soldés et les gains crédités."
                        />
                    </div>
                </div>

                {/* Formulaire */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:w-[400px] bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 lg:p-8"
                >
                    <div className="lg:hidden mb-6">
                        <h1 className="text-2xl font-black tracking-tight">
                            <span className="text-zinc-900 dark:text-white">Zoo</span>
                            <span className="text-agri-green">Foot</span>
                        </h1>
                        <p className="text-xs text-zinc-500 mt-0.5">Le pari inversé</p>
                    </div>

                    <h2 className="text-xl font-bold">Connexion</h2>
                    <p className="text-sm text-zinc-500 mt-1 mb-6">Accédez à vos paris et à votre solde.</p>

                    {justRegistered && (
                        <div className="flex items-start gap-2 text-sm text-agri-green bg-agri-green/10 rounded-xl p-3 mb-4">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>Compte créé. Connectez-vous pour commencer.</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Email</span>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="vous@exemple.com"
                                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-3 text-sm outline-none focus:border-agri-green"
                            />
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Mot de passe</span>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-3 text-sm outline-none focus:border-agri-green"
                            />
                        </label>

                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-1 rounded-xl bg-agri-green text-white font-bold py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Se connecter
                        </button>
                    </form>

                    <p className="text-sm text-zinc-500 text-center mt-5">
                        Pas encore de compte ?{' '}
                        <Link href="/auth/register" className="text-agri-green font-semibold">
                            Créer un compte
                        </Link>
                    </p>

                    <p className="text-[10px] text-zinc-400 text-center mt-6 leading-relaxed">
                        Les paris comportent un risque de perte. Jouez de manière responsable.
                        Interdit aux personnes de moins de 18 ans.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

function Argument({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
    return (
        <div className="flex gap-3">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-agri-green/10 text-agri-green flex items-center justify-center">
                {icon}
            </div>
            <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-sm text-zinc-500 leading-snug">{body}</p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                </div>
            }
        >
            <LoginContent />
        </Suspense>
    );
}
