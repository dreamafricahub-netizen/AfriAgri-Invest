'use client';

import { useEffect, useState } from 'react';

const PRENOMS = [
    'Amadou K.', 'Fatou D.', 'Kouame A.', 'Awa S.', 'Ibrahim T.',
    'Mariam B.', 'Seydou C.', 'Aissatou N.', 'Moussa D.', 'Kadiatou T.',
    'Ousmane B.', 'Aminata C.', 'Youssouf K.', 'Bintou S.', 'Abdoulaye M.',
    'Rokia D.', 'Cheick O.', 'Fatoumata K.', 'Mamadou S.', 'Djeneba T.',
    'Souleymane A.', 'Mariame K.', 'Adama B.', 'Oumou C.', 'Bakary D.',
];

const VILLES = [
    'Abidjan', 'Dakar', 'Douala', 'Bamako', 'Lome',
    'Cotonou', 'Ouagadougou', 'Conakry', 'Niamey', 'Kinshasa',
];

const ACTIONS = [
    { type: 'invest', amounts: [3000, 10000, 25000, 50000, 100000, 200000, 300000], icon: '🌱' },
    { type: 'withdraw', amounts: [5000, 12000, 28000, 45000, 75000, 150000], icon: '💸' },
    { type: 'gain', amounts: [1050, 3500, 8750, 17500, 35000], icon: '📈' },
];

function generateActivity() {
    const prenom = PRENOMS[Math.floor(Math.random() * PRENOMS.length)];
    const ville = VILLES[Math.floor(Math.random() * VILLES.length)];
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const montant = action.amounts[Math.floor(Math.random() * action.amounts.length)];
    const minutes = Math.floor(Math.random() * 55) + 1;

    let texte = '';
    if (action.type === 'invest') {
        texte = `${prenom} de ${ville} vient d'investir ${montant.toLocaleString()} F`;
    } else if (action.type === 'withdraw') {
        texte = `${prenom} de ${ville} a retire ${montant.toLocaleString()} F`;
    } else {
        texte = `${prenom} de ${ville} a gagne +${montant.toLocaleString()} F aujourd'hui`;
    }

    return { id: Math.random(), icon: action.icon, texte, minutes };
}

export function LiveTicker() {
    const [activities, setActivities] = useState<ReturnType<typeof generateActivity>[]>([]);

    useEffect(() => {
        // Generate initial batch
        const initial = Array.from({ length: 20 }, () => generateActivity());
        setActivities(initial);

        // Add new activity every 3 seconds
        const interval = setInterval(() => {
            setActivities(prev => {
                const next = [generateActivity(), ...prev];
                if (next.length > 30) next.pop();
                return next;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    if (activities.length === 0) return null;

    return (
        <div className="w-full overflow-hidden relative">
            <div className="flex flex-col animate-ticker-scroll">
                {/* Double the items for seamless loop */}
                {[...activities, ...activities].map((a, i) => (
                    <div
                        key={`${a.id}-${i}`}
                        className="flex items-center gap-2 px-4 py-2 whitespace-nowrap"
                    >
                        <span className="text-sm">{a.icon}</span>
                        <span className="text-xs text-zinc-400">
                            <span className="font-semibold text-zinc-300">{a.texte}</span>
                            {' '}<span className="text-zinc-500">il y a {a.minutes} min</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
