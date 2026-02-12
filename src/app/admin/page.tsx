'use client';

import { useEffect, useState } from 'react';
import {
    Users,
    TrendingUp,
    CreditCard,
    ArrowDownToLine,
    DollarSign,
    Activity,
    UserPlus,
    Loader2,
    RefreshCw,
    Play,
    CheckCircle
} from 'lucide-react';

interface Stats {
    totalUsers: number;
    newUsersToday: number;
    totalInvestments: number;
    totalTransactions: number;
    pendingWithdrawals: number;
    totalBalance: number;
    totalInvestedCapital: number;
    totalGainsPaid: number;
    investmentsTodayCount: number;
    investmentsTodayAmount: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingGains, setProcessingGains] = useState(false);
    const [gainsResult, setGainsResult] = useState<{ processed: number; amount: number } | null>(null);
    const [gainsError, setGainsError] = useState<string | null>(null);
    const [resettingFarms, setResettingFarms] = useState(false);
    const [resetResult, setResetResult] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const handleProcessGains = async () => {
        setProcessingGains(true);
        setGainsResult(null);
        setGainsError(null);
        try {
            const res = await fetch('/api/cron/daily-gains', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setGainsResult({
                    processed: data.processedInvestments,
                    amount: data.totalGainsDistributed
                });
                fetchStats();
            } else {
                setGainsError(data.message || `Erreur ${res.status}`);
            }
        } catch (error) {
            setGainsError('Erreur de connexion au serveur');
        } finally {
            setProcessingGains(false);
        }
    };

    const handleResetFarms = async () => {
        setResettingFarms(true);
        setResetResult(null);
        try {
            const res = await fetch('/api/admin/reset-farms', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setResetResult(data.message);
            }
        } catch (error) {
            console.error('Failed to reset farms:', error);
        } finally {
            setResettingFarms(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-zinc-400 text-sm">Vue d'ensemble de la plateforme</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Actualiser
                </button>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Utilisateurs"
                    value={stats?.totalUsers || 0}
                    subtitle={`+${stats?.newUsersToday || 0} aujourd'hui`}
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    title="Capital Total"
                    value={`${(stats?.totalInvestedCapital || 0).toLocaleString()} F`}
                    subtitle={`${stats?.totalInvestments || 0} investissements`}
                    icon={TrendingUp}
                    color="green"
                />
                <StatCard
                    title="Solde Total"
                    value={`${(stats?.totalBalance || 0).toLocaleString()} F`}
                    subtitle="Disponible pour retrait"
                    icon={DollarSign}
                    color="amber"
                />
                <StatCard
                    title="Retraits en attente"
                    value={stats?.pendingWithdrawals || 0}
                    subtitle="A traiter"
                    icon={ArrowDownToLine}
                    color="red"
                    alert={stats?.pendingWithdrawals ? stats.pendingWithdrawals > 0 : false}
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-900/50 rounded-xl flex items-center justify-center">
                            <Activity className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">Transactions totales</p>
                            <p className="text-xl font-bold text-white">{stats?.totalTransactions || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-900/50 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">Gains distribues</p>
                            <p className="text-xl font-bold text-white">{(stats?.totalGainsPaid || 0).toLocaleString()} F</p>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-900/50 rounded-xl flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">Investissements aujourd'hui</p>
                            <p className="text-xl font-bold text-white">
                                {stats?.investmentsTodayCount || 0} ({(stats?.investmentsTodayAmount || 0).toLocaleString()} F)
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Process Daily Gains */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Gains Journaliers</h2>
                        <p className="text-zinc-400 text-sm">Crediter les gains des investissements actifs</p>
                    </div>
                    <button
                        onClick={handleProcessGains}
                        disabled={processingGains}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                        {processingGains ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Play className="w-5 h-5" />
                        )}
                        Distribuer les gains
                    </button>
                </div>
                {gainsResult && (
                    <div className="mt-4 p-4 bg-green-900/20 border border-green-800 rounded-xl flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div>
                            <p className="text-green-400 font-bold">Gains distribues avec succes!</p>
                            <p className="text-green-300 text-sm">
                                {gainsResult.processed} investissement(s) traite(s) - {gainsResult.amount.toLocaleString()} F distribues
                            </p>
                        </div>
                    </div>
                )}
                {gainsError && (
                    <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-xl flex items-center gap-3">
                        <Activity className="w-5 h-5 text-red-400" />
                        <p className="text-red-400 font-medium">{gainsError}</p>
                    </div>
                )}

                {/* Reset Farms Button */}
                <div className="mt-4 pt-4 border-t border-zinc-700 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-zinc-400">Reinitialiser les fermes</p>
                        <p className="text-xs text-zinc-500">Rendre toutes les fermes prates a recolter</p>
                    </div>
                    <button
                        onClick={handleResetFarms}
                        disabled={resettingFarms}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        {resettingFarms ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        Reinitialiser
                    </button>
                </div>
                {resetResult && (
                    <div className="mt-2 p-3 bg-amber-900/20 border border-amber-800 rounded-xl">
                        <p className="text-amber-400 text-sm">{resetResult}</p>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Actions rapides</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <a href="/admin/withdrawals" className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-center transition-colors">
                        <ArrowDownToLine className="w-6 h-6 text-red-400 mx-auto mb-2" />
                        <p className="text-sm text-white font-medium">Traiter retraits</p>
                        {stats?.pendingWithdrawals ? (
                            <span className="text-xs text-red-400">{stats.pendingWithdrawals} en attente</span>
                        ) : (
                            <span className="text-xs text-zinc-500">Aucun en attente</span>
                        )}
                    </a>
                    <a href="/admin/users" className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-center transition-colors">
                        <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <p className="text-sm text-white font-medium">Voir utilisateurs</p>
                        <span className="text-xs text-zinc-500">{stats?.totalUsers || 0} inscrits</span>
                    </a>
                    <a href="/admin/investments" className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-center transition-colors">
                        <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                        <p className="text-sm text-white font-medium">Investissements</p>
                        <span className="text-xs text-zinc-500">{stats?.totalInvestments || 0} actifs</span>
                    </a>
                    <a href="/admin/transactions" className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-center transition-colors">
                        <CreditCard className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                        <p className="text-sm text-white font-medium">Transactions</p>
                        <span className="text-xs text-zinc-500">{stats?.totalTransactions || 0} total</span>
                    </a>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, subtitle, icon: Icon, color, alert }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    color: 'blue' | 'green' | 'amber' | 'red' | 'purple';
    alert?: boolean;
}) {
    const colors = {
        blue: 'bg-blue-900/50 text-blue-400',
        green: 'bg-green-900/50 text-green-400',
        amber: 'bg-amber-900/50 text-amber-400',
        red: 'bg-red-900/50 text-red-400',
        purple: 'bg-purple-900/50 text-purple-400',
    };

    return (
        <div className={`bg-zinc-900 border rounded-2xl p-6 ${alert ? 'border-red-600 animate-pulse' : 'border-zinc-800'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                </div>
                {alert && (
                    <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">Action requise</span>
                )}
            </div>
            <p className="text-zinc-400 text-sm mb-1">{title}</p>
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            <p className="text-zinc-500 text-xs">{subtitle}</p>
        </div>
    );
}
