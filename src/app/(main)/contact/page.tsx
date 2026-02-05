'use client';

import { useState } from 'react';
import { ArrowLeft, MessageCircle, Phone, Mail, Clock, Send, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSend = () => {
        if (!subject || !message) return;
        setIsSending(true);
        setTimeout(() => {
            setIsSending(false);
            setSent(true);
            setSubject('');
            setMessage('');
        }, 2000);
    };

    return (
        <div className="p-4 space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center gap-3 pt-2">
                <Link href="/profil" className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-black">Contacter le support</h1>
            </div>

            {/* Quick Contact Options */}
            <div className="grid grid-cols-1 gap-3">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 rounded-2xl text-white relative overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold">WhatsApp</h3>
                            <p className="text-sm text-green-100">Reponse rapide en moins de 5 min</p>
                        </div>
                        <button className="bg-white text-green-600 px-4 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform shrink-0">
                            Ouvrir
                        </button>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 text-center">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Phone className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="font-bold text-sm">Telephone</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">+225 07 00 00 00</p>
                    </div>
                    <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 text-center">
                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Mail className="w-5 h-5 text-purple-500" />
                        </div>
                        <p className="font-bold text-sm">Email</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">support@afriagri.com</p>
                    </div>
                </div>
            </div>

            {/* Hours */}
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/20">
                <Clock className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                    <p className="font-bold text-sm text-green-900 dark:text-green-100">Disponible 24h/24 - 7j/7</p>
                    <p className="text-xs text-green-700 dark:text-green-300">Notre equipe est toujours la pour vous aider</p>
                </div>
            </div>

            {/* Contact Form */}
            {sent ? (
                <div className="flex flex-col items-center pt-6 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8">
                    <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-lg font-bold mb-2">Message envoye !</h2>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                        Notre equipe a bien recu ton message et te repondra dans les plus brefs delais via email ou WhatsApp.
                    </p>
                    <button
                        onClick={() => setSent(false)}
                        className="mt-4 text-green-600 font-bold text-sm"
                    >
                        Envoyer un autre message
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 space-y-4">
                    <h3 className="font-bold">Envoyer un message</h3>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Sujet</label>
                        <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        >
                            <option value="">Choisir un sujet</option>
                            <option value="retrait">Probleme de retrait</option>
                            <option value="depot">Probleme de depot</option>
                            <option value="investissement">Question sur un investissement</option>
                            <option value="compte">Mon compte</option>
                            <option value="parrainage">Parrainage</option>
                            <option value="technique">Probleme technique</option>
                            <option value="autre">Autre</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none"
                            placeholder="Decris ton probleme ou ta question en detail..."
                        ></textarea>
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={isSending || !subject || !message}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Envoyer</>}
                    </button>
                </div>
            )}

            {/* FAQ link */}
            <div className="text-center">
                <p className="text-zinc-500 text-sm">Tu trouveras peut-etre ta reponse dans notre</p>
                <Link href="/aide" className="text-green-600 font-bold text-sm hover:underline">
                    Centre d'aide & FAQ
                </Link>
            </div>
        </div>
    );
}
