'use client';

import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { PACKS } from '@/utils/packs';

interface Investment {
    id: string;
    packId: number;
    amount: number;
    dailyRate: number;
    status: string;
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

export default function AdminInvestmentsPage() {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
    const [loading, setLoading] = useState(true);

    const fetchInvestments = async (page = 1) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/investments?page=${page}`);
            const data = await res.json();
            setInvestments(data.investments || []);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Failed to fetch investments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvestments();
    }, []);

    const totalAmount = investments.reduce((sum, inv) => sum + inv.amount, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Investissements</h1>
                    <p className="text-zinc-400 text-sm">Tous les investissements de la plateforme</p>
                </div>
                <div className="px-4 py-2 bg-green-900/50 border border-green-700 rounded-xl">
                    <span className="text-green-400 font-bold">{totalAmount.toLocaleString()} F total</span>
                </div>
            </div>

            {/* Investments Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                    </div>
                ) : investments.length === 0 ? (
                    <div className="text-center p-12">
                        <TrendingUp className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400">Aucun investissement</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-800 text-zinc-400 text-sm">
                                <tr>
                                    <th className="text-left px-6 py-4">Utilisateur</th>
                                    <th className="text-left px-6 py-4">Pack</th>
                                    <th className="text-right px-6 py-4">Montant</th>
                                    <th className="text-right px-6 py-4">Taux</th>
                                    <th className="text-center px-6 py-4">Statut</th>
                                    <th className="text-right px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {investments.map((inv) => {
                                    const pack = PACKS.find(p => p.id === inv.packId);
                                    return (
                                        <tr key={inv.id} className="hover:bg-zinc-800/50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-white">{inv.user.name || 'Sans nom'}</p>
                                                    <p className="text-xs text-zinc-500">{inv.user.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">
                                                        {[1, 2].includes(inv.packId) ? '🌱' :
                                                         [3, 4].includes(inv.packId) ? '🌳' :
                                                         [5, 6].includes(inv.packId) ? '🏡' :
                                                         inv.packId === 7 ? '🌾' : '🏰'}
                                                    </span>
                                                    <span className="text-white">{pack?.name || `Pack ${inv.packId}`}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="font-bold text-green-400">{inv.amount.toLocaleString()} F</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-blue-400">{(inv.dailyRate * 100).toFixed(1)}%/j</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    inv.status === 'ACTIVE'
                                                        ? 'bg-green-900/50 text-green-400'
                                                        : 'bg-zinc-700 text-zinc-400'
                                                }`}>
                                                    {inv.status === 'ACTIVE' ? 'Actif' : inv.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-zinc-400 text-sm">
                                                {new Date(inv.createdAt).toLocaleDateString('fr-FR')}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
                        <p className="text-sm text-zinc-400">
                            {pagination.total} investissements - Page {pagination.page} sur {pagination.pages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchInvestments(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg"
                            >
                                <ChevronLeft className="w-5 h-5 text-white" />
                            </button>
                            <button
                                onClick={() => fetchInvestments(pagination.page + 1)}
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
