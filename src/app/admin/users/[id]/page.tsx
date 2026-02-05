'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Loader2,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Ban,
    CheckCircle,
    Shield,
    Users,
    TrendingUp,
    DollarSign,
    Gift,
    AlertTriangle,
    Plus,
    Copy
} from 'lucide-react';
import Link from 'next/link';
import { PACKS } from '@/utils/packs';

interface UserDetail {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    city: string | null;
    role: string;
    status: string;
    balance: number;
    investedCapital: number;
    referralCode: string;
    referredBy: string | null;
    createdAt: string;
    investments: any[];
    transactions: any[];
}

interface TeamStats {
    directFilleuls: number;
    directInvested: number;
    level2Filleuls: number;
    level2Invested: number;
    totalTeamInvested: number;
    totalTeamMembers: number;
}

interface UserStats {
    totalGains: number;
    totalWithdrawn: number;
    totalDeposited: number;
    referralBonus: number;
}

export default function AdminUserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<{
        user: UserDetail;
        teamStats: TeamStats;
        userStats: UserStats;
        filleuls: any[];
        level2Filleuls: any[];
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showAddBalance, setShowAddBalance] = useState(false);
    const [addBalanceAmount, setAddBalanceAmount] = useState('');
    const [copied, setCopied] = useState(false);

    const fetchUser = async () => {
        try {
            const res = await fetch(`/api/admin/users/${params.id}`);
            const result = await res.json();
            if (res.ok) {
                setData(result);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [params.id]);

    const handleAction = async (action: string) => {
        setActionLoading(true);
        try {
            await fetch(`/api/admin/users/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            fetchUser();
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddBalance = async () => {
        if (!addBalanceAmount || parseFloat(addBalanceAmount) <= 0) return;

        setActionLoading(true);
        try {
            await fetch(`/api/admin/users/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ addBalance: parseFloat(addBalanceAmount) })
            });
            setShowAddBalance(false);
            setAddBalanceAmount('');
            fetchUser();
        } catch (error) {
            console.error('Add balance failed:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleMakeAdmin = async () => {
        setActionLoading(true);
        try {
            await fetch(`/api/admin/users/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: data?.user.role === 'ADMIN' ? 'USER' : 'ADMIN' })
            });
            fetchUser();
        } catch (error) {
            console.error('Role change failed:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const copyReferralCode = () => {
        navigator.clipboard.writeText(data?.user.referralCode || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-zinc-400">Utilisateur non trouve</p>
                <Link href="/admin/users" className="text-red-400 hover:underline mt-2 inline-block">
                    Retour a la liste
                </Link>
            </div>
        );
    }

    const { user, teamStats, userStats, filleuls, level2Filleuls } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">{user.name || 'Sans nom'}</h1>
                    <p className="text-zinc-400 text-sm">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                    {user.status === 'BANNED' && (
                        <span className="px-3 py-1 bg-red-900/50 text-red-400 rounded-full text-sm font-bold">BANNI</span>
                    )}
                    {user.role === 'ADMIN' && (
                        <span className="px-3 py-1 bg-purple-900/50 text-purple-400 rounded-full text-sm font-bold flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Admin
                        </span>
                    )}
                </div>
            </div>

            {/* User Info Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-zinc-400" /> Informations
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="w-4 h-4 text-zinc-500" />
                            <span className="text-zinc-300">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Phone className="w-4 h-4 text-zinc-500" />
                            <span className="text-zinc-300">{user.phone || 'Non renseigne'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <MapPin className="w-4 h-4 text-zinc-500" />
                            <span className="text-zinc-300">{user.city || 'Non renseigne'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="w-4 h-4 text-zinc-500" />
                            <span className="text-zinc-300">Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Gift className="w-4 h-4 text-zinc-500" />
                            <span className="text-zinc-300 flex items-center gap-2">
                                Code: <strong>{user.referralCode}</strong>
                                <button onClick={copyReferralCode} className="p-1 hover:bg-zinc-700 rounded">
                                    {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                            </span>
                        </div>
                        {user.referredBy && (
                            <div className="flex items-center gap-3 text-sm">
                                <Users className="w-4 h-4 text-zinc-500" />
                                <span className="text-zinc-300">Parraine par: <strong>{user.referredBy}</strong></span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Financial Stats */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-zinc-400" /> Finances
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Solde disponible</span>
                            <span className="text-green-400 font-bold text-lg">{user.balance.toLocaleString()} F</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Capital investi</span>
                            <span className="text-white font-bold">{user.investedCapital.toLocaleString()} F</span>
                        </div>
                        <div className="h-px bg-zinc-800"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Total gains</span>
                            <span className="text-green-400 font-bold">+{userStats.totalGains.toLocaleString()} F</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Bonus parrainage</span>
                            <span className="text-purple-400 font-bold">+{userStats.referralBonus.toLocaleString()} F</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Total retire</span>
                            <span className="text-red-400 font-bold">-{userStats.totalWithdrawn.toLocaleString()} F</span>
                        </div>
                    </div>
                </div>

                {/* Team Stats */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-zinc-400" /> Equipe
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Filleuls directs</span>
                            <span className="text-white font-bold">{teamStats.directFilleuls}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Investi par directs</span>
                            <span className="text-blue-400 font-bold">{teamStats.directInvested.toLocaleString()} F</span>
                        </div>
                        <div className="h-px bg-zinc-800"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Filleuls niveau 2</span>
                            <span className="text-white font-bold">{teamStats.level2Filleuls}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Investi niveau 2</span>
                            <span className="text-blue-400 font-bold">{teamStats.level2Invested.toLocaleString()} F</span>
                        </div>
                        <div className="h-px bg-zinc-800"></div>
                        <div className="flex justify-between items-center bg-zinc-800 p-3 rounded-xl -mx-2">
                            <span className="text-white font-medium">Total equipe</span>
                            <span className="text-green-400 font-bold text-lg">{teamStats.totalTeamInvested.toLocaleString()} F</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4">Actions</h3>
                <div className="flex flex-wrap gap-3">
                    {user.status === 'BANNED' ? (
                        <button
                            onClick={() => handleAction('UNBAN')}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium disabled:opacity-50"
                        >
                            <CheckCircle className="w-4 h-4" /> Debannir
                        </button>
                    ) : (
                        <button
                            onClick={() => handleAction('BAN')}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium disabled:opacity-50"
                        >
                            <Ban className="w-4 h-4" /> Bannir
                        </button>
                    )}

                    <button
                        onClick={handleMakeAdmin}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium disabled:opacity-50"
                    >
                        <Shield className="w-4 h-4" /> {user.role === 'ADMIN' ? 'Retirer admin' : 'Rendre admin'}
                    </button>

                    <button
                        onClick={() => setShowAddBalance(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
                    >
                        <Plus className="w-4 h-4" /> Ajouter solde
                    </button>
                </div>

                {/* Add Balance Modal */}
                {showAddBalance && (
                    <div className="mt-4 p-4 bg-zinc-800 rounded-xl">
                        <p className="text-white font-medium mb-3">Ajouter au solde</p>
                        <div className="flex gap-3">
                            <input
                                type="number"
                                value={addBalanceAmount}
                                onChange={(e) => setAddBalanceAmount(e.target.value)}
                                placeholder="Montant en FCFA"
                                className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white"
                            />
                            <button
                                onClick={handleAddBalance}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ajouter'}
                            </button>
                            <button
                                onClick={() => setShowAddBalance(false)}
                                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Filleuls List */}
            {filleuls.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-4">Filleuls directs ({filleuls.length})</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-800 text-zinc-400 text-sm">
                                <tr>
                                    <th className="text-left px-4 py-3">Utilisateur</th>
                                    <th className="text-right px-4 py-3">Capital</th>
                                    <th className="text-right px-4 py-3">Solde</th>
                                    <th className="text-center px-4 py-3">Statut</th>
                                    <th className="text-right px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {filleuls.map((f: any) => (
                                    <tr key={f.id} className="hover:bg-zinc-800/50">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-white">{f.name || 'Sans nom'}</p>
                                            <p className="text-xs text-zinc-500">{f.email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right text-white">{f.investedCapital.toLocaleString()} F</td>
                                        <td className="px-4 py-3 text-right text-green-400">{f.balance.toLocaleString()} F</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                f.status === 'ACTIVE' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                                            }`}>
                                                {f.status === 'ACTIVE' ? 'Actif' : 'Banni'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/admin/users/${f.id}`} className="text-blue-400 hover:underline text-sm">
                                                Voir
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Investments */}
            {user.investments.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-4">Investissements ({user.investments.length})</h3>
                    <div className="space-y-2">
                        {user.investments.map((inv: any) => {
                            const pack = PACKS.find(p => p.id === inv.packId);
                            return (
                                <div key={inv.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">
                                            {[1, 2].includes(inv.packId) ? '🌱' :
                                             [3, 4].includes(inv.packId) ? '🌳' :
                                             [5, 6].includes(inv.packId) ? '🏡' :
                                             inv.packId === 7 ? '🌾' : '🏰'}
                                        </span>
                                        <div>
                                            <p className="text-white font-medium">{pack?.name || `Pack ${inv.packId}`}</p>
                                            <p className="text-xs text-zinc-500">{new Date(inv.createdAt).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                    </div>
                                    <p className="text-green-400 font-bold">{inv.amount.toLocaleString()} F</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent Transactions */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4">Transactions recentes</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {user.transactions.length === 0 ? (
                        <p className="text-zinc-500 text-center py-4">Aucune transaction</p>
                    ) : (
                        user.transactions.map((tx: any) => (
                            <div key={tx.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                        tx.type === 'GAIN' ? 'bg-green-900/50 text-green-400' :
                                        tx.type === 'WITHDRAWAL' ? 'bg-red-900/50 text-red-400' :
                                        tx.type === 'INVESTMENT' ? 'bg-amber-900/50 text-amber-400' :
                                        tx.type === 'REFERRAL_BONUS' ? 'bg-purple-900/50 text-purple-400' :
                                        'bg-blue-900/50 text-blue-400'
                                    }`}>
                                        {tx.type === 'GAIN' ? '📈' :
                                         tx.type === 'WITHDRAWAL' ? '💸' :
                                         tx.type === 'INVESTMENT' ? '🌱' :
                                         tx.type === 'REFERRAL_BONUS' ? '👥' : '🎁'}
                                    </div>
                                    <div>
                                        <p className="text-white text-sm">{tx.description || tx.type}</p>
                                        <p className="text-xs text-zinc-500">{new Date(tx.createdAt).toLocaleString('fr-FR')}</p>
                                    </div>
                                </div>
                                <p className={`font-bold ${
                                    ['GAIN', 'REFERRAL_BONUS', 'BONUS', 'DEPOSIT'].includes(tx.type) ? 'text-green-400' : 'text-red-400'
                                }`}>
                                    {['GAIN', 'REFERRAL_BONUS', 'BONUS', 'DEPOSIT'].includes(tx.type) ? '+' : '-'}
                                    {tx.amount.toLocaleString()} F
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
