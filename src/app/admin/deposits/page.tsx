'use client';

import { useEffect, useState } from 'react';
import {
    Loader2,
    CheckCircle,
    XCircle,
    Phone,
    Mail,
    Plus,
    Search
} from 'lucide-react';

interface Deposit {
    id: string;
    amount: number;
    status: string;
    method: string | null;
    reference: string | null;
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
    const [showManualDeposit, setShowManualDeposit] = useState(false);
    const [manualDeposit, setManualDeposit] = useState({ userId: '', amount: '', method: 'MOMO', reference: '' });
    const [users, setUsers] = useState<any[]>([]);
    const [searchUser, setSearchUser] = useState('');

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

    const searchUsers = async (query: string) => {
        if (query.length < 2) {
            setUsers([]);
            return;
        }
        try {
            const res = await fetch(`/api/admin/users?search=${query}&limit=5`);
            const data = await res.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error('Failed to search users:', error);
        }
    };

    useEffect(() => {
        fetchDeposits();
    }, [filter]);

    useEffect(() => {
        const timer = setTimeout(() => searchUsers(searchUser), 300);
        return () => clearTimeout(timer);
    }, [searchUser]);

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

    const handleManualDeposit = async () => {
        if (!manualDeposit.userId || !manualDeposit.amount) return;

        setProcessing('manual');
        try {
            await fetch('/api/admin/deposits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: manualDeposit.userId,
                    amount: parseFloat(manualDeposit.amount),
                    method: manualDeposit.method,
                    reference: manualDeposit.reference,
                })
            });
            setShowManualDeposit(false);
            setManualDeposit({ userId: '', amount: '', method: 'MOMO', reference: '' });
            setSearchUser('');
            fetchDeposits();
        } catch (error) {
            console.error('Failed to create deposit:', error);
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
                    <p className="text-zinc-400 text-sm">Valider les depots et ajouter des fonds manuellement</p>
                </div>
                <button
                    onClick={() => setShowManualDeposit(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium"
                >
                    <Plus className="w-4 h-4" /> Depot manuel
                </button>
            </div>

            {/* Manual Deposit Modal */}
            {showManualDeposit && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-4">Creer un depot manuel</h3>
                    <div className="space-y-4">
                        {/* User Search */}
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Rechercher l'utilisateur</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type="text"
                                    value={searchUser}
                                    onChange={(e) => setSearchUser(e.target.value)}
                                    placeholder="Email ou nom..."
                                    className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white"
                                />
                            </div>
                            {users.length > 0 && (
                                <div className="mt-2 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
                                    {users.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => {
                                                setManualDeposit({ ...manualDeposit, userId: u.id });
                                                setSearchUser(u.email);
                                                setUsers([]);
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-zinc-700 border-b border-zinc-700 last:border-0"
                                        >
                                            <p className="text-white">{u.name || 'Sans nom'}</p>
                                            <p className="text-xs text-zinc-500">{u.email}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {manualDeposit.userId && (
                                <p className="text-xs text-green-400 mt-1">Utilisateur selectionne</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Montant (FCFA)</label>
                                <input
                                    type="number"
                                    value={manualDeposit.amount}
                                    onChange={(e) => setManualDeposit({ ...manualDeposit, amount: e.target.value })}
                                    placeholder="10000"
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Methode</label>
                                <select
                                    value={manualDeposit.method}
                                    onChange={(e) => setManualDeposit({ ...manualDeposit, method: e.target.value })}
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white"
                                >
                                    <option value="MOMO">MTN MoMo</option>
                                    <option value="ORANGE">Orange Money</option>
                                    <option value="WAVE">Wave</option>
                                    <option value="BANK">Virement bancaire</option>
                                    <option value="ADMIN">Bonus Admin</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Reference (optionnel)</label>
                            <input
                                type="text"
                                value={manualDeposit.reference}
                                onChange={(e) => setManualDeposit({ ...manualDeposit, reference: e.target.value })}
                                placeholder="Numero de transaction..."
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleManualDeposit}
                                disabled={!manualDeposit.userId || !manualDeposit.amount || processing === 'manual'}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium disabled:opacity-50"
                            >
                                {processing === 'manual' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Crediter le compte
                            </button>
                            <button
                                onClick={() => {
                                    setShowManualDeposit(false);
                                    setManualDeposit({ userId: '', amount: '', method: 'MOMO', reference: '' });
                                    setSearchUser('');
                                }}
                                className="px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    {deposits.map((deposit) => (
                        <div
                            key={deposit.id}
                            className={`bg-zinc-900 border rounded-2xl p-6 ${
                                deposit.status === 'PENDING' ? 'border-green-600/50' : 'border-zinc-800'
                            }`}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-900/50 rounded-full flex items-center justify-center text-green-400 font-bold text-lg">
                                        {deposit.user.name?.charAt(0) || deposit.user.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{deposit.user.name || 'Sans nom'}</p>
                                        <div className="flex items-center gap-3 text-sm text-zinc-400">
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
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-green-400">+{deposit.amount.toLocaleString()} F</p>
                                        <p className="text-xs text-zinc-500">
                                            {deposit.method || 'N/A'} • {new Date(deposit.createdAt).toLocaleString('fr-FR')}
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
