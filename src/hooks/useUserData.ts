'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface Investment {
    id: string;
    packId: number;
    amount: number;
    dailyRate: number;
    createdAt: string;
    status: string;
}

interface Transaction {
    id: string;
    type: string;
    amount: number;
    status: string;
    description?: string;
    createdAt: string;
}

interface Filleul {
    id: string;
    name: string;
    initials: string;
    city: string;
    joinedDate: string;
    totalInvested: number;
    myBonus: number;
    status: 'active' | 'pending';
}

interface UserData {
    id: string;
    email: string;
    name: string;
    phone: string;
    city: string;
    balance: number;
    investedCapital: number;
    referralCode: string;
    investments: Investment[];
    transactions: Transaction[];
    referralCount: number;
    activeReferrals: number;
    totalReferralBonus: number;
}

interface ReferralData {
    referralCode: string;
    filleuls: Filleul[];
    stats: {
        totalFilleuls: number;
        activeFilleuls: number;
        totalBonus: number;
        totalInvestedByFilleuls: number;
    };
}

export function useUserData() {
    const { data: session, status } = useSession();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUserData = useCallback(async () => {
        if (status !== 'authenticated') {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/user');
            if (!res.ok) {
                throw new Error('Erreur lors du chargement des donnees');
            }
            const data = await res.json();
            setUserData(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const invest = async (packId: number) => {
        try {
            const res = await fetch('/api/invest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packId }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message);
            }
            await fetchUserData(); // Refresh data
            return { success: true, message: data.message };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };

    const withdraw = async (amount: number, method: string = 'MOMO') => {
        try {
            const res = await fetch('/api/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, method }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message);
            }
            await fetchUserData(); // Refresh data
            return { success: true, message: data.message };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };

    return {
        userData,
        loading,
        error,
        refetch: fetchUserData,
        invest,
        withdraw,
        isAuthenticated: status === 'authenticated',
    };
}

export function useReferralData() {
    const { status } = useSession();
    const [referralData, setReferralData] = useState<ReferralData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReferralData = useCallback(async () => {
        if (status !== 'authenticated') {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/referrals');
            if (!res.ok) {
                throw new Error('Erreur lors du chargement des parrainages');
            }
            const data = await res.json();
            setReferralData(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        fetchReferralData();
    }, [fetchReferralData]);

    return {
        referralData,
        loading,
        error,
        refetch: fetchReferralData,
    };
}
