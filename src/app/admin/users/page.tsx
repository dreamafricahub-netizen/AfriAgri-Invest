'use client';

import { useEffect, useState } from 'react';
import {
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Shield,
    User,
    MoreVertical,
    Eye,
    Ban,
    CheckCircle
} from 'lucide-react';

interface UserData {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    city: string | null;
    role: string;
    balance: number;
    investedCapital: number;
    referralCode: string;
    createdAt: string;
    _count: {
        investments: number;
        transactions: number;
        referrals: number;
    };
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchUsers = async (page = 1) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users?page=${page}&search=${search}`);
            const data = await res.json();
            setUsers(data.users);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(1), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleMakeAdmin = async (userId: string) => {
        setActionLoading(true);
        try {
            await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: 'ADMIN' })
            });
            fetchUsers(pagination.page);
        } catch (error) {
            console.error('Failed to update user:', error);
        } finally {
            setActionLoading(false);
            setSelectedUser(null);
        }
    };

    const handleRemoveAdmin = async (userId: string) => {
        setActionLoading(true);
        try {
            await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: 'USER' })
            });
            fetchUsers(pagination.page);
        } catch (error) {
            console.error('Failed to update user:', error);
        } finally {
            setActionLoading(false);
            setSelectedUser(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
                <p className="text-zinc-400 text-sm">Gerer les comptes utilisateurs</p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par nom, email ou telephone..."
                    className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:border-red-500 outline-none"
                />
            </div>

            {/* Users Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center p-12">
                        <User className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400">Aucun utilisateur trouve</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-800 text-zinc-400 text-sm">
                                <tr>
                                    <th className="text-left px-6 py-4">Utilisateur</th>
                                    <th className="text-left px-6 py-4">Contact</th>
                                    <th className="text-right px-6 py-4">Solde</th>
                                    <th className="text-right px-6 py-4">Capital</th>
                                    <th className="text-center px-6 py-4">Stats</th>
                                    <th className="text-center px-6 py-4">Role</th>
                                    <th className="text-right px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-zinc-800/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center text-white font-bold">
                                                    {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{user.name || 'Sans nom'}</p>
                                                    <p className="text-xs text-zinc-500">{user.referralCode}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-white">{user.email}</p>
                                            <p className="text-xs text-zinc-500">{user.phone || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="font-medium text-green-400">{user.balance.toLocaleString()} F</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="font-medium text-white">{user.investedCapital.toLocaleString()} F</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2 text-xs">
                                                <span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded-full">{user._count.investments} inv.</span>
                                                <span className="px-2 py-1 bg-purple-900/50 text-purple-400 rounded-full">{user._count.referrals} fil.</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {user.role === 'ADMIN' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-900/50 text-red-400 rounded-full text-xs font-bold">
                                                    <Shield className="w-3 h-3" /> Admin
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-zinc-700 text-zinc-300 rounded-full text-xs">User</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="relative inline-block">
                                                <button
                                                    onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                                                    className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                                                >
                                                    <MoreVertical className="w-5 h-5 text-zinc-400" />
                                                </button>

                                                {selectedUser?.id === user.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-10 overflow-hidden">
                                                        <a href={`/admin/users/${user.id}`} className="w-full px-4 py-3 text-left text-sm text-white hover:bg-zinc-700 flex items-center gap-2">
                                                            <Eye className="w-4 h-4" /> Voir details
                                                        </a>
                                                        {user.role === 'ADMIN' ? (
                                                            <button
                                                                onClick={() => handleRemoveAdmin(user.id)}
                                                                disabled={actionLoading}
                                                                className="w-full px-4 py-3 text-left text-sm text-amber-400 hover:bg-zinc-700 flex items-center gap-2"
                                                            >
                                                                <Ban className="w-4 h-4" /> Retirer admin
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleMakeAdmin(user.id)}
                                                                disabled={actionLoading}
                                                                className="w-full px-4 py-3 text-left text-sm text-green-400 hover:bg-zinc-700 flex items-center gap-2"
                                                            >
                                                                <CheckCircle className="w-4 h-4" /> Rendre admin
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
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
                            {pagination.total} utilisateurs - Page {pagination.page} sur {pagination.pages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchUsers(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-white" />
                            </button>
                            <button
                                onClick={() => fetchUsers(pagination.page + 1)}
                                disabled={pagination.page === pagination.pages}
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
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
