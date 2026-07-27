/**
 * Chargement des variables d'environnement pour les scripts.
 *
 * Next.js lit `.env.local` automatiquement, mais pas `dotenv` seul : il ne
 * charge que `.env`. Les scripts lances par tsx doivent donc le demander
 * explicitement, sinon DATABASE_URL semble absent alors qu'il est bien la.
 *
 * Ordre de priorite, du plus fort au plus faible :
 *   .env.local  (secrets de la machine, gitignore)
 *   .env        (valeurs communes, versionnees)
 *
 * A importer en PREMIERE ligne de chaque script.
 */

import { config } from 'dotenv';

config({ path: '.env.local' });
config();
