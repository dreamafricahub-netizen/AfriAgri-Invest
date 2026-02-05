export interface Pack {
  id: number;
  price: number;
  name: string;
  dailyGain: number;
  total30Days: number;
  profit30Days: number;
  message: string;
}

// Updated Rate: 3.5% daily.
// Total 30 Days Multiplier: approx 2.806x (1.035 ^ 30)
// Profit 30 Days Multiplier: approx 1.806x

export const PACKS: Pack[] = [
  {
    id: 1,
    price: 3000,
    name: "Petite Ferme Starter",
    dailyGain: 105,
    total30Days: 8420,
    profit30Days: 5420,
    message: "Débute ton aventure agricole"
  },
  {
    id: 2,
    price: 10000,
    name: "Ferme Familiale",
    dailyGain: 350,
    total30Days: 28060,
    profit30Days: 18060,
    message: "Une production locale solide"
  },
  {
    id: 3,
    price: 25000,
    name: "Exploitation Rurale",
    dailyGain: 875,
    total30Days: 70160,
    profit30Days: 45160,
    message: "L'agriculture commence à payer"
  },
  {
    id: 4,
    price: 50000,
    name: "Domaine Agricole",
    dailyGain: 1750,
    total30Days: 140330,
    profit30Days: 90330,
    message: "Des revenus quotidiens sérieux"
  },
  {
    id: 5,
    price: 100000,
    name: "Plantation Moderne",
    dailyGain: 3500,
    total30Days: 280670,
    profit30Days: 180670,
    message: "Modernisation et expansion"
  },
  {
    id: 6,
    price: 200000,
    name: "Agro-Industrie",
    dailyGain: 7000,
    total30Days: 561340,
    profit30Days: 361340,
    message: "Production à grande échelle"
  },
  {
    id: 7,
    price: 300000,
    name: "Empire Vert",
    dailyGain: 10500,
    total30Days: 842000,
    profit30Days: 542000,
    message: "Le géant de l'agrobusiness"
  },
  {
    id: 8,
    price: 500000,
    name: "Ferme Milliardaire",
    dailyGain: 17500,
    total30Days: 1403350,
    profit30Days: 903350,
    message: "Le sommet de la réussite"
  }
];
