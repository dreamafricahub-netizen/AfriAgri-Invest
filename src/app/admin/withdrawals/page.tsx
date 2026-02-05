'use client';

import { useEffect, useState } from 'react';
import {
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    Phone,
    Mail,
    AlertCircle
} from 'lucide-react';

interface Withdrawal {
    id: string;
    amount: number;
    status: string;
    method: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        phone: string | null;
    };
}

export default function AdminWithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');
    const [processing, setProcessing] = useState<string | null>(null);

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/withdrawals?status=${filter}`);
            const data = await res.json();
            setWithdrawals(data.withdrawals || []);
        } catch (error) {
            console.error('Failed to fetch withdrawals:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, [filter]);

    const handleAction = async (transactionId: string, action: 'APPROVE' | 'REJECT') => {
        setProcessing(transactionId);
        try {
            await fetch('/api/admin/withdrawals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId, action })
            });
            fetchWithdrawals();
        } catch (error) {
            console.error('Failed to process withdrawal:', error);
        } finally {
            setProcessing(null);
        }
    };

    const pendingCount = withdrawals.filter(w => w.status === 'PENDING').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Demandes de Retrait</h1>
                    <p className="text-zinc-400 text-sm">Valider ou rejeter les demandes de retrait</p>
                </div>
                {filter === 'PENDING' && pendingCount > 0 && (
                    <div className="px-4 py-2 bg-red-900/50 border border-red-700 rounded-xl">
                        <span className="text-red-400 font-bold">{pendingCount} en attente</span>
                    </div>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {['PENDING', 'COMPLETED', 'FAILED', 'ALL'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                            filter === status
                                ? 'bg-red-600 text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                    >
                        {status === 'PENDING' && 'En attente'}
                        {status === 'COMPLETED' && 'Validees'}
                        {status === 'FAILED' && 'Rejetees'}
                        {status === 'ALL' && 'Toutes'}
                    </button>
                ))}
            </div>

            {/* Withdrawals List */}
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                </div>
            ) : withdrawals.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-white font-medium">Aucune demande de retrait</p>
                    <p className="text-zinc-500 text-sm">
                        {filter === 'PENDING' ? 'Toutes les demandes ont ete traitees' : 'Aucune demande dans cette categorie'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {withdrawals.map((withdrawal) => (
                        <div
                            key={withdrawal.id}
                            className={`bg-zinc-900 border rounded-2xl p-6 ${
                                withdrawal.status === 'PENDING' ? 'border-amber-600/50' : 'border-zinc-800'
                            }`}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* User Info */}
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {withdrawal.user.name?.charAt(0) || withdrawal.user.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{withdrawal.user.name || 'Sans nom'}</p>
                                        <div className="flex items-center gap-3 text-sm text-zinc-400">
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {withdrawal.user.email}
                                            </span>
                                            {withdrawal.user.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {withdrawal.user.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Amount & Status */}
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-white">{withdrawal.amount.toLocaleString()} F</p>
                                        <p className="text-xs text-zinc-500">
                                            {new Date(withdrawal.createdAt).toLocaleString('fr-FR')}
                                        </p>
                                    </div>

                                    {withdrawal.status === 'PENDING' ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAction(withdrawal.id, 'APPROVE')}
                                                disabled={processing === withdrawal.id}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                            >
                                                {processing === withdrawal.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4" />
                                                )}
                                                Valider
                                            </button>
                                            <button
                                                onClick={() => handleAction(withdrawal.id, 'REJECT')}
                                                disabled={processing === withdrawal.id}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Rejeter
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                                            withdrawal.status === 'COMPLETED'
                                                ? 'bg-green-900/50 text-green-400'
                                                : 'bg-red-900/50 text-red-400'
                                        }`}>
                                            {withdrawal.status === 'COMPLETED' ? (
                                                <>
                                                    <CheckCircle className="w-4 h-4" />
                                                    Validee
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-4 h-4" />
                                                    Rejetee
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {withdrawal.status === 'PENDING' && (
                                <div className="mt-4 p-3 bg-amber-900/20 border border-amber-800/50 rounded-xl flex items-center gap-2 text-amber-400 text-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>Verifiez le numero Mobile Money avant de valider : <strong>{withdrawal.user.phone || 'Non renseigne'}</strong></span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
