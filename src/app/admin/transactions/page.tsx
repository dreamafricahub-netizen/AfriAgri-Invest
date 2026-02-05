'use client';

import { useEffect, useState } from 'react';
import { Loader2, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';

interface Transaction {
    id: string;
    type: string;
    amount: number;
    status: string;
    description: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

const typeLabels: Record<string, string> = {
    INVESTMENT: 'Investissement',
    GAIN: 'Gain journalier',
    REFERRAL_BONUS: 'Bonus parrainage',
    BONUS: 'Bonus',
    WITHDRAWAL: 'Retrait',
    DEPOSIT: 'Depot',
};

const typeColors: Record<string, string> = {
    INVESTMENT: 'bg-amber-900/50 text-amber-400',
    GAIN: 'bg-green-900/50 text-green-400',
    REFERRAL_BONUS: 'bg-purple-900/50 text-purple-400',
    BONUS: 'bg-blue-900/50 text-blue-400',
    WITHDRAWAL: 'bg-red-900/50 text-red-400',
    DEPOSIT: 'bg-teal-900/50 text-teal-400',
};

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 30, total: 0, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    const fetchTransactions = async (page = 1) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/transactions?page=${page}&type=${filter}`);
            const data = await res.json();
            setTransactions(data.transactions || []);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions(1);
    }, [filter]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Transactions</h1>
                <p className="text-zinc-400 text-sm">Historique de toutes les transactions</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {['ALL', 'INVESTMENT', 'GAIN', 'REFERRAL_BONUS', 'WITHDRAWAL', 'BONUS'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                            filter === type
                                ? 'bg-red-600 text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                    >
                        {type === 'ALL' ? 'Toutes' : typeLabels[type]}
                    </button>
                ))}
            </div>

            {/* Transactions Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center p-12">
                        <CreditCard className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400">Aucune transaction</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-800 text-zinc-400 text-sm">
                                <tr>
                                    <th className="text-left px-6 py-4">Utilisateur</th>
                                    <th className="text-left px-6 py-4">Type</th>
                                    <th className="text-right px-6 py-4">Montant</th>
                                    <th className="text-center px-6 py-4">Statut</th>
                                    <th className="text-left px-6 py-4">Description</th>
                                    <th className="text-right px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-zinc-800/50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-white">{tx.user.name || 'Sans nom'}</p>
                                                <p className="text-xs text-zinc-500">{tx.user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${typeColors[tx.type] || 'bg-zinc-700 text-zinc-300'}`}>
                                                {typeLabels[tx.type] || tx.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className={`font-bold ${
                                                ['GAIN', 'REFERRAL_BONUS', 'BONUS', 'DEPOSIT'].includes(tx.type)
                                                    ? 'text-green-400'
                                                    : ['WITHDRAWAL'].includes(tx.type)
                                                    ? 'text-red-400'
                                                    : 'text-amber-400'
                                            }`}>
                                                {['GAIN', 'REFERRAL_BONUS', 'BONUS', 'DEPOSIT'].includes(tx.type) ? '+' : '-'}
                                                {tx.amount.toLocaleString()} F
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                tx.status === 'COMPLETED'
                                                    ? 'bg-green-900/50 text-green-400'
                                                    : tx.status === 'PENDING'
                                                    ? 'bg-amber-900/50 text-amber-400'
                                                    : 'bg-red-900/50 text-red-400'
                                            }`}>
                                                {tx.status === 'COMPLETED' ? 'OK' : tx.status === 'PENDING' ? 'En cours' : 'Echec'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400 text-sm">
                                            {tx.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-zinc-400 text-sm">
                                            {new Date(tx.createdAt).toLocaleString('fr-FR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
                        <p className="text-sm text-zinc-400">
                            {pagination.total} transactions - Page {pagination.page} sur {pagination.pages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchTransactions(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg"
                            >
                                <ChevronLeft className="w-5 h-5 text-white" />
                            </button>
                            <button
                                onClick={() => fetchTransactions(pagination.page + 1)}
                                disabled={pagination.page === pagination.pages}
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg"
                            >
                                <ChevronRight className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
