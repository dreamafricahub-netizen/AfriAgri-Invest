'use client';

import { useState, useRef } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, Shield, Lock } from 'lucide-react';
import Link from 'next/link';

export default function CodePinPage() {
    const [step, setStep] = useState<'create' | 'confirm' | 'done'>('create');
    const [pin, setPin] = useState(['', '', '', '']);
    const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handlePinChange = (index: number, value: string, isConfirm = false) => {
        if (!/^\d*$/.test(value)) return;
        const newPin = isConfirm ? [...confirmPin] : [...pin];
        newPin[index] = value.slice(-1);
        if (isConfirm) {
            setConfirmPin(newPin);
        } else {
            setPin(newPin);
        }

        // Auto-focus next
        if (value && index < 3) {
            const refs = isConfirm ? confirmRefs : inputRefs;
            refs.current[index + 1]?.focus();
        }

        // Auto-submit on last digit
        if (value && index === 3) {
            const fullPin = newPin.join('');
            if (!isConfirm && fullPin.length === 4) {
                setTimeout(() => setStep('confirm'), 300);
            } else if (isConfirm && fullPin.length === 4) {
                if (fullPin === pin.join('')) {
                    setError('');
                    setIsLoading(true);
                    setTimeout(() => {
                        setIsLoading(false);
                        setStep('done');
                    }, 1500);
                } else {
                    setError('Les codes PIN ne correspondent pas');
                    setConfirmPin(['', '', '', '']);
                    confirmRefs.current[0]?.focus();
                }
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm = false) => {
        if (e.key === 'Backspace') {
            const currentPin = isConfirm ? confirmPin : pin;
            if (!currentPin[index] && index > 0) {
                const refs = isConfirm ? confirmRefs : inputRefs;
                refs.current[index - 1]?.focus();
            }
        }
    };

    const renderPinInputs = (values: string[], refs: React.MutableRefObject<(HTMLInputElement | null)[]>, isConfirm = false) => (
        <div className="flex justify-center gap-4">
            {values.map((digit, i) => (
                <input
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(i, e.target.value, isConfirm)}
                    onKeyDown={(e) => handleKeyDown(i, e, isConfirm)}
                    className="w-14 h-14 text-center text-2xl font-black bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
            ))}
        </div>
    );

    if (step === 'done') {
        return (
            <div className="p-4 space-y-6 pb-8">
                <div className="flex items-center gap-3 pt-2">
                    <Link href="/profil" className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-black">Code PIN</h1>
                </div>

                <div className="flex flex-col items-center pt-12 text-center">
                    <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-black mb-2">Code PIN configure !</h2>
                    <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
                        Ton code PIN de retrait est maintenant actif. Il sera demande a chaque demande de retrait pour securiser ton compte.
                    </p>
                    <Link href="/profil" className="mt-8 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition-all active:scale-95">
                        Retour au profil
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center gap-3 pt-2">
                <Link href="/profil" className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-black">Code PIN de retrait</h1>
            </div>

            {/* Security Info */}
            <div className="flex gap-3 items-start p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold text-sm text-amber-900 dark:text-amber-100">Code a 4 chiffres</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        Ce code PIN sera requis a chaque demande de retrait. Ne le partagez avec personne.
                    </p>
                </div>
            </div>

            {/* PIN Input */}
            <div className="flex flex-col items-center pt-8">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8 text-zinc-400" />
                </div>

                {step === 'create' && (
                    <>
                        <h2 className="text-lg font-bold mb-1">Creer ton code PIN</h2>
                        <p className="text-zinc-500 text-sm mb-8">Choisis un code a 4 chiffres</p>
                        {renderPinInputs(pin, inputRefs)}
                    </>
                )}

                {step === 'confirm' && (
                    <>
                        <h2 className="text-lg font-bold mb-1">Confirmer ton code PIN</h2>
                        <p className="text-zinc-500 text-sm mb-8">Re-entre ton code pour confirmer</p>
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-xl text-center font-medium mb-4 w-full">
                                {error}
                            </div>
                        )}
                        {renderPinInputs(confirmPin, confirmRefs, true)}
                        {isLoading && (
                            <div className="flex items-center gap-2 mt-6 text-zinc-500">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm">Configuration en cours...</span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Tips */}
            <div className="space-y-2 pt-8">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1 mb-2">Conseils de securite</p>
                <div className="space-y-2 text-xs text-zinc-500">
                    <p className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">&#10003;</span>
                        N'utilise pas ta date de naissance
                    </p>
                    <p className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">&#10003;</span>
                        Evite les suites simples (1234, 0000)
                    </p>
                    <p className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">&#10003;</span>
                        Ne partage jamais ton code PIN
                    </p>
                    <p className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">&#10003;</span>
                        Change ton code regulierement
                    </p>
                </div>
            </div>
        </div>
    );
}
