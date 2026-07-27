'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, Percent, Target } from 'lucide-react';

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                </div>
            }
        >
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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black">
            <div className="max-w-5xl mx-auto px-4 py-8 lg:py-16 lg:flex lg:gap-12 lg:items-start">

                <div className="hidden lg:flex lg:flex-col lg:flex-1 lg:gap-5">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">
                            <span className="text-zinc-900 dark:text-white">Zoo</span>
                            <span className="text-agri-green">Foot</span>
                        </h2>
                        <p className="text-zinc-500 mt-1">Le pari inversé</p>
                    </div>

                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-md">
                        Écartez les scores qui n&apos;arriveront pas. Vous gagnez si aucun d&apos;eux
                        ne tombe. Plus vous en écartez, plus la cote monte.
                    </p>

                    {/*
                      Aucun chiffre d'audience, aucun temoignage. La plateforme demarre :
                      annoncer des milliers d'inscrits serait faux, et c'est exactement ce
                      que faisait la version precedente.
                    */}
                    <div className="flex flex-col gap-3 mt-2 max-w-md">
                        <Argument
                            icon={<Percent className="w-4 h-4" />}
                            title="Notre marge est affichée"
                            body="Sur chaque pari. Vérifiable en comparant nos cotes à celles d'un autre opérateur."
                        />
                        <Argument
                            icon={<ShieldCheck className="w-4 h-4" />}
                            title="Les matchs virtuels sont scellés"
                            body="Le résultat est tiré avant l'ouverture des paris, et vous pouvez le vérifier après le match."
                        />
                        <Argument
                            icon={<Target className="w-4 h-4" />}
                            title="Règlement automatique"
                            body="Les paris sont soldés dès la fin du match."
                        />
                    </div>
                </div>

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

                    <h2 className="text-xl font-bold">Créer un compte</h2>
                    <p className="text-sm text-zinc-500 mt-1 mb-6">
                        {referralCode
                            ? `Vous avez été invité par un membre (code ${referralCode}).`
                            : 'Quelques informations et vous pouvez parier.'}
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <Field label="Nom" name="name" value={formData.name} onChange={handleChange} placeholder="Votre nom" />
                        <Field label="Email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="vous@exemple.com" />
                        <Field label="Téléphone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+229 …" />
                        <Field label="Mot de passe" name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" />

                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-1 rounded-xl bg-agri-green text-white font-bold py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Créer mon compte
                        </button>
                    </form>

                    <p className="text-sm text-zinc-500 text-center mt-5">
                        Déjà inscrit ?{' '}
                        <Link href="/auth/login" className="text-agri-green font-semibold">
                            Se connecter
                        </Link>
                    </p>

                    <p className="text-[10px] text-zinc-400 text-center mt-6 leading-relaxed">
                        En créant un compte, vous déclarez avoir 18 ans ou plus. Les paris
                        comportent un risque de perte. Jouez de manière responsable.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

function Field({
    label, name, value, onChange, type = 'text', required = false, placeholder,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    required?: boolean;
    placeholder?: string;
}) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
            <input
                name={name}
                type={type}
                required={required}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-3 text-sm outline-none focus:border-agri-green"
            />
        </label>
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
