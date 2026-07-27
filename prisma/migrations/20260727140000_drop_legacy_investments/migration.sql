-- ============================================================================
-- Retrait du modele d'investissement agricole.
--
-- Cette migration DETRUIT des donnees. Elle doit etre precedee d'une
-- sauvegarde : voir backup-supabase/ a la racine du projet.
--
-- Ce qui disparait :
--   - la table "Investment" (achats de packs et leur taux quotidien)
--   - la colonne "User.investedCapital"
--
-- Ce qui est conserve :
--   - les utilisateurs, leurs transactions, leurs parrainages
--   - les soldes, repris ensuite dans le registre par backfill-ledger.ts
--
-- Les transactions de type INVESTMENT et GAIN restent dans l'historique. Elles
-- documentent ce qui s'est passe et ne doivent pas etre effacees.
-- ============================================================================

DROP TABLE IF EXISTS "Investment";

ALTER TABLE "User" DROP COLUMN IF EXISTS "investedCapital";

-- Le bonus de bienvenue n'est plus pose a la creation du compte : il est ecrit
-- au registre, en charge, par creditFromExpense().
ALTER TABLE "User" ALTER COLUMN "balance" SET DEFAULT 0;
