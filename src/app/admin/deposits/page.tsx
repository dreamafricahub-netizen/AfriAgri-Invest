'use client';

import { useEffect, useState } from 'react';
import {
    Loader2,
    CheckCircle,
    XCircle,
    Phone,
    Mail,
    Image as ImageIcon,
    ExternalLink,
    X
} from 'lucide-react';
import { PACKS } from '@/utils/packs';

interface Deposit {
    id: string;
    amount: number;
    status: string;
    method: string | null;
    reference: string | null;
    proofImage: string | null;
    packId: number | null;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        phone: string | null;
    };
}

export default function AdminDepositsPage() {
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');
    const [processing, setProcessing] = useState<string | null>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    const fetchDeposits = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/deposits?status=${filter}`);
            const data = await res.json();
            setDeposits(data.deposits || []);
        } catch (error) {
            console.error('Failed to fetch deposits:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeposits();
    }, [filter]);

    const handleAction = async (transactionId: string, action: 'APPROVE' | 'REJECT') => {
        setProcessing(transactionId);
        try {
            await fetch('/api/admin/deposits', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId, action })
            });
            fetchDeposits();
        } catch (error) {
            console.error('Failed to process deposit:', error);
        } finally {
            setProcessing(null);
        }
    };

    const pendingCount = deposits.filter(d => d.status === 'PENDING').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Depots</h1>
                    <p className="text-zinc-400 text-sm">Valider les depots avec verification des captures d'ecran</p>
                </div>
                {pendingCount > 0 && (
                    <div className="px-4 py-2 bg-green-900/50 border border-green-700 rounded-xl animate-pulse">
                        <span className="text-green-400 font-bold">{pendingCount} en attente</span>
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
                        {status === 'PENDING' && `En attente ${pendingCount > 0 ? `(${pendingCount})` : ''}`}
                        {status === 'COMPLETED' && 'Valides'}
                        {status === 'FAILED' && 'Rejetes'}
                        {status === 'ALL' && 'Tous'}
                    </button>
                ))}
            </div>

            {/* Deposits List */}
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                </div>
            ) : deposits.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-white font-medium">Aucun depot</p>
                    <p className="text-zinc-500 text-sm">
                        {filter === 'PENDING' ? 'Aucun depot en attente' : 'Aucun depot dans cette categorie'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {deposits.map((deposit) => {
                        const pack = deposit.packId ? PACKS.find(p => p.id === deposit.packId) : null;
                        return (
                            <div
                                key={deposit.id}
                                className={`bg-zinc-900 border rounded-2xl p-6 ${
                                    deposit.status === 'PENDING' ? 'border-green-600/50' : 'border-zinc-800'
                                }`}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    {/* User Info */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-green-900/50 rounded-full flex items-center justify-center text-green-400 font-bold text-lg shrink-0">
                                            {deposit.user.name?.charAt(0) || deposit.user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{deposit.user.name || 'Sans nom'}</p>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {deposit.user.email}
                                                </span>
                                                {deposit.user.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3" /> {deposit.user.phone}
                                                    </span>
                                                )}
                                            </div>
                                            {deposit.reference && (
                                                <p className="text-xs text-zinc-500 mt-1">Ref: {deposit.reference}</p>
                                            )}
                                            {pack && (
                                                <p className="text-xs text-blue-400 mt-1">
                                                    Pack: {pack.name} ({pack.price.toLocaleString()} F)
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Proof Image */}
                                    {deposit.proofImage && (
                                        <div className="lg:mx-4">
                                            <p className="text-xs text-zinc-500 mb-2">Capture d'ecran:</p>
                                            <button
                                                onClick={() => setViewingImage(deposit.proofImage)}
                                                className="relative group"
                                            >
                                                <img
                                                    src={deposit.proofImage}
                                                    alt="Preuve de paiement"
                                                    className="w-32 h-32 object-cover rounded-xl border border-zinc-700 hover:border-green-500 transition-colors"
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                                    <ExternalLink className="w-6 h-6 text-white" />
                                                </div>
                                            </button>
                                        </div>
                                    )}

                                    {/* Amount & Actions */}
                                    <div className="flex flex-col items-end gap-4">
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-green-400">+{deposit.amount.toLocaleString()} F</p>
                                            <p className="text-xs text-zinc-500">
                                                {deposit.method === 'USDT' ? '💰 USDT TRC20' : '📱 Mobile Money'}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {new Date(deposit.createdAt).toLocaleString('fr-FR')}
                                            </p>
                                        </div>

                                        {deposit.status === 'PENDING' ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAction(deposit.id, 'APPROVE')}
                                                    disabled={processing === deposit.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium disabled:opacity-50"
                                                >
                                                    {processing === deposit.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4" />
                                                    )}
                                                    Valider
                                                </button>
                                                <button
                                                    onClick={() => handleAction(deposit.id, 'REJECT')}
                                                    disabled={processing === deposit.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium disabled:opacity-50"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Rejeter
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                                                deposit.status === 'COMPLETED'
                                                    ? 'bg-green-900/50 text-green-400'
                                                    : 'bg-red-900/50 text-red-400'
                                            }`}>
                                                {deposit.status === 'COMPLETED' ? (
                                                    <>
                                                        <CheckCircle className="w-4 h-4" />
                                                        Valide
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-4 h-4" />
                                                        Rejete
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Warning for pending */}
                                {deposit.status === 'PENDING' && (
                                    <div className="mt-4 p-3 bg-amber-900/20 border border-amber-800/50 rounded-xl text-amber-400 text-sm">
                                        <p className="font-bold mb-1">Verifiez bien avant de valider:</p>
                                        <ul className="list-disc list-inside text-xs space-y-1">
                                            <li>Le montant correspond au pack selectionne ({pack?.price.toLocaleString()} F)</li>
                                            <li>L'ID de transaction sur la capture est valide</li>
                                            <li>Le paiement a bien ete recu</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Image Viewer Modal */}
            {viewingImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setViewingImage(null)}
                >
                    <button
                        onClick={() => setViewingImage(null)}
                        className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={viewingImage}
                        alt="Preuve de paiement"
                        className="max-w-full max-h-[90vh] object-contain rounded-xl"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
