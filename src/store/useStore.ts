import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PACKS, Pack } from '@/utils/packs';

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

interface UserState {
    balance: number; // Current withdrawable cash
    investedCapital: number; // Total active investment
    day: number; // Simulation day (starts at 1)
    farms: { packId: number; count: number }[]; // Owned packs
    transactions: { id: string; type: 'deposit' | 'withdraw' | 'invest' | 'gain' | 'bonus'; amount: number; date: string; description?: string }[];
    filleuls: Filleul[]; // Referrals
    referralCode: string; // User's referral code

    // Actions
    invest: (packId: number) => void;
    advanceDay: () => void;
    resetSimulation: () => void;
    addFunds: (amount: number) => void;
}

export const useStore = create<UserState>()(
    persist(
        (set, get) => ({
            balance: 3000, // Starting balance: welcome bonus (requires 2 referrals to unlock)
            investedCapital: 0,
            day: 1,
            farms: [],
            transactions: [],
            filleuls: [], // Empty by default - real data only
            referralCode: '', // Will be set from user email

            invest: (packId: number) => {
                const pack = PACKS.find((p) => p.id === packId);
                if (!pack) return;

                const { balance, investedCapital, farms, transactions } = get();

                // Check if balance is sufficient (simulating wallet payment)
                // In this demo, 'Investir' button simulates Mobile Money payment -> Adds to global capital
                // We assume the user creates funds on the fly or deducts from balance?
                // User request: "Pas de vrai paiement : Simuler Mobile Money avec un bouton 'Investir' qui ajoute directement au capital."
                // Let's assume infinite money source for investing OR we deduct from a pre-filled wallet?
                // Let's implement: Click Invest -> "Processing Payment..." -> Success -> Capital Increases. 
                // We won't deduct from 'balance' (which is earnings), unless we want to reinvest.
                // Let's simply ADD to investedCapital and assume external payment.

                set({
                    investedCapital: investedCapital + pack.price,
                    farms: [...farms, { packId, count: 1 }], // Simplified: just add new entry for now
                    transactions: [
                        { id: Date.now().toString(), type: 'invest', amount: pack.price, date: `Day ${get().day}` },
                        ...transactions
                    ]
                });
            },

            advanceDay: () => {
                const { investedCapital, balance, day } = get();
                // 8% daily compound gain
                // Formula: gain = investedCapital * 0.08
                // Or if capital itself grows: Capital = Capital * 1.08
                // User said: "gagne 8 % par jour composé sur son capital investi"
                // And "Compteur 'Gain aujourd'hui : +X FCFA'"
                // If it is compound, the gain is added to the Capital base?
                // Or added to Balance? 
                // If added to Balance (withdrawable), then Capital doesn't grow automatically unless reinvested.
                // "Plus l'investissement est élevé, plus les gains quotidiens ... explosent" -> matches Compound.
                // Let's assume the GAIN is liquid (balance) but the CAPITAL remains fixed unless we implement auto-compound.
                // WAIT. "Capital après 30 jours (composé)". This implies the gain STAYS in the capital.
                // So: Capital = Capital * 1.08.
                // The user can ONLY withdraw if they liquidate? Or "Retirer gains". 
                // Let's Split: 
                // - Active Capital (growing 8% daily).
                // - Wallet Balance (liquid cash).
                // "Retirer gains" -> likely moves (Capital - InitialInvest) to Wallet? Or just some available dividend?
                // Let's interpret "Gain journalier fixe" in the table vs "Calcul en JS (capital * Math.pow(1.08, jours))".
                // The table columns are inconsistent with 8% compound if the gain is "Fixe". 
                // Pack 1 (3000) -> Gain +240 (which is exactly 8% of 3000).
                // If it's fixed 240/day, it's NOT compound.
                // CHECK: 3000 * (1.08^30) = 30187. OK, the table value "30188" matches 3000 * 1.08^30.
                // So the "Gain Journalier" (+240) is just the FIRST day gain.
                // The gain GROWS every day.

                // Logic:
                // New Capital = Old Capital * 1.08
                // Daily Gain = New Capital - Old Capital.
                // We update Capital. We track accumulated "Profit" for display?

                // User request update: 3.5% daily compound.
                const growthRate = 1.035;
                const newCapital = Math.floor(investedCapital * growthRate);
                const dailyProfit = newCapital - investedCapital;

                set({
                    day: day + 1,
                    investedCapital: newCapital, // Capital COMPOSES automatically.
                    // We can also let user "Retirer" from Capital? 
                    // For now, let's just grow the capital.
                    transactions: [
                        { id: Date.now().toString(), type: 'gain', amount: dailyProfit, date: `Day ${day}` },
                        ...get().transactions
                    ]
                });
            },

            addFunds: (amount: number) => set((state) => ({ balance: state.balance + amount })),

            resetSimulation: () => set({ balance: 3000, investedCapital: 0, day: 1, farms: [], transactions: [], filleuls: [] }),
        }),
        {
            name: 'afriagri-storage', // unique name
        }
    )
);
