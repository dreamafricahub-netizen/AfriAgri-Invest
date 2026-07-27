-- ============================================================================
-- Garde-fous du registre et des paris.
--
-- Ces contraintes ne sont PAS exprimables dans schema.prisma : Prisma ne sait
-- pas declarer de CHECK, de trigger ni de vue. Elles doivent donc etre
-- appliquees separement, apres chaque `prisma db push` ou sur une base neuve.
--
--   npx tsx prisma/scripts/apply-guardrails.ts
--
-- Elles sont la partie qui compte. Sans elles, le schema autorise a crediter un
-- solde sans contrepartie, a modifier une ecriture passee, ou a payer plus que
-- l'encaisse disponible. Le reste n'est que des tables.
--
-- Le script est reentrant : on peut le rejouer sans effet de bord.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Registre : coherence de devise
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION assert_entry_currency() RETURNS TRIGGER AS $$
DECLARE
  account_currency TEXT;
BEGIN
  SELECT "currency" INTO account_currency FROM "Account" WHERE "id" = NEW."accountId";
  IF account_currency IS DISTINCT FROM NEW."currency" THEN
    RAISE EXCEPTION
      'Devise incoherente : ecriture en % sur un compte en %', NEW."currency", account_currency;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "LedgerEntry_currency_check" ON "LedgerEntry";
CREATE TRIGGER "LedgerEntry_currency_check"
  BEFORE INSERT ON "LedgerEntry"
  FOR EACH ROW EXECUTE FUNCTION assert_entry_currency();


-- ---------------------------------------------------------------------------
-- Registre : somme nulle par transaction et par devise.
-- Contrainte DIFFEREE — evaluee au COMMIT, apres insertion de toutes les lignes.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION assert_transaction_balanced() RETURNS TRIGGER AS $$
DECLARE
  imbalance RECORD;
BEGIN
  SELECT "currency", SUM("amountMinor") AS total
    INTO imbalance
    FROM "LedgerEntry"
   WHERE "transactionId" = NEW."transactionId"
   GROUP BY "currency"
  HAVING SUM("amountMinor") <> 0
   LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION
      'Transaction % desequilibree : ecart de % en %',
      NEW."transactionId", imbalance.total, imbalance."currency";
  END IF;
  RETURN NULL;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "LedgerEntry_balanced" ON "LedgerEntry";
CREATE CONSTRAINT TRIGGER "LedgerEntry_balanced"
  AFTER INSERT ON "LedgerEntry"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION assert_transaction_balanced();


-- ---------------------------------------------------------------------------
-- Registre : immuabilite
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION reject_mutation() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    'Les ecritures du registre sont immuables. Utilisez une contrepassation (reversesId).';
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "LedgerEntry_immutable" ON "LedgerEntry";
CREATE TRIGGER "LedgerEntry_immutable"
  BEFORE UPDATE OR DELETE ON "LedgerEntry"
  FOR EACH ROW EXECUTE FUNCTION reject_mutation();

DROP TRIGGER IF EXISTS "LedgerTransaction_immutable" ON "LedgerTransaction";
CREATE TRIGGER "LedgerTransaction_immutable"
  BEFORE UPDATE OR DELETE ON "LedgerTransaction"
  FOR EACH ROW EXECUTE FUNCTION reject_mutation();


-- ---------------------------------------------------------------------------
-- Lecture des soldes : le signe depend de la nature du compte.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION account_balance(p_account_id TEXT) RETURNS BIGINT AS $$
DECLARE
  k "AccountKind";
  s BIGINT;
BEGIN
  SELECT "kind" INTO k FROM "Account" WHERE "id" = p_account_id;
  SELECT COALESCE(SUM("amountMinor"), 0) INTO s
    FROM "LedgerEntry" WHERE "accountId" = p_account_id;

  IF k IN ('PSP_FLOAT', 'BANK', 'EXPENSE') THEN
    RETURN s;
  ELSE
    RETURN -s;
  END IF;
END $$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE VIEW "AccountBalance" AS
SELECT
  a."id"     AS "accountId",
  a."kind",
  a."userId",
  a."currency",
  CASE
    WHEN a."kind" IN ('PSP_FLOAT', 'BANK', 'EXPENSE')
      THEN  COALESCE(SUM(e."amountMinor"), 0)
    ELSE   -COALESCE(SUM(e."amountMinor"), 0)
  END AS "balanceMinor"
FROM "Account" a
LEFT JOIN "LedgerEntry" e ON e."accountId" = a."id"
GROUP BY a."id", a."kind", a."userId", a."currency";


-- ---------------------------------------------------------------------------
-- Registre : interdiction du decouvert.
--
-- La partie double garantit la tracabilite, pas la solvabilite : on pourrait
-- equilibrer un credit en debitant un compte de charges a l'infini. Cette
-- contrainte ferme la porte sur les comptes qui representent de l'argent
-- reellement detenu ou reellement du.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION assert_no_overdraft() RETURNS TRIGGER AS $$
DECLARE
  k   "AccountKind";
  bal BIGINT;
BEGIN
  SELECT "kind" INTO k FROM "Account" WHERE "id" = NEW."accountId";

  IF k IN ('USER_WALLET', 'PENDING_PAYOUT', 'UNSETTLED_BETS', 'PSP_FLOAT', 'BANK') THEN
    bal := account_balance(NEW."accountId");
    IF bal < 0 THEN
      RAISE EXCEPTION
        'Decouvert interdit : le compte % (%) tomberait a %', NEW."accountId", k, bal;
    END IF;
  END IF;
  RETURN NULL;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "LedgerEntry_no_overdraft" ON "LedgerEntry";
CREATE CONSTRAINT TRIGGER "LedgerEntry_no_overdraft"
  AFTER INSERT ON "LedgerEntry"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION assert_no_overdraft();


-- ---------------------------------------------------------------------------
-- Contraintes de validite. Prisma ne sait pas les declarer.
-- ---------------------------------------------------------------------------

ALTER TABLE "LedgerEntry" DROP CONSTRAINT IF EXISTS "LedgerEntry_amountMinor_nonzero";
ALTER TABLE "LedgerEntry" ADD  CONSTRAINT "LedgerEntry_amountMinor_nonzero"
  CHECK ("amountMinor" <> 0);

ALTER TABLE "Fixture" DROP CONSTRAINT IF EXISTS "Fixture_lambda_positive";
ALTER TABLE "Fixture" ADD  CONSTRAINT "Fixture_lambda_positive"
  CHECK ("lambdaHome" > 0 AND "lambdaAway" > 0);

-- Un match termine porte un score ; un match non termine n'en porte pas.
ALTER TABLE "Fixture" DROP CONSTRAINT IF EXISTS "Fixture_score_matches_status";
ALTER TABLE "Fixture" ADD  CONSTRAINT "Fixture_score_matches_status" CHECK (
  ("status" = 'FINISHED' AND "homeGoals" IS NOT NULL AND "awayGoals" IS NOT NULL)
  OR ("status" <> 'FINISHED' AND "homeGoals" IS NULL AND "awayGoals" IS NULL)
);

-- Un match virtuel ouvert aux mises doit porter son engagement scelle.
ALTER TABLE "Fixture" DROP CONSTRAINT IF EXISTS "Fixture_virtual_is_committed";
ALTER TABLE "Fixture" ADD  CONSTRAINT "Fixture_virtual_is_committed"
  CHECK ("kind" <> 'VIRTUAL' OR "resultCommitment" IS NOT NULL);

ALTER TABLE "Bet" DROP CONSTRAINT IF EXISTS "Bet_stake_positive";
ALTER TABLE "Bet" ADD  CONSTRAINT "Bet_stake_positive" CHECK ("stakeMinor" > 0);

-- Une cote inferieure ou egale a 1 rendrait moins que la mise.
ALTER TABLE "Bet" DROP CONSTRAINT IF EXISTS "Bet_odds_above_one";
ALTER TABLE "Bet" ADD  CONSTRAINT "Bet_odds_above_one" CHECK ("oddsMilli" > 1000);

ALTER TABLE "Bet" DROP CONSTRAINT IF EXISTS "Bet_cashback_range";
ALTER TABLE "Bet" ADD  CONSTRAINT "Bet_cashback_range"
  CHECK ("cashbackRateBp" BETWEEN 0 AND 10000);

ALTER TABLE "Bet" DROP CONSTRAINT IF EXISTS "Bet_payout_covers_stake";
ALTER TABLE "Bet" ADD  CONSTRAINT "Bet_payout_covers_stake"
  CHECK ("potentialWinMinor" >= "stakeMinor");

ALTER TABLE "BetSelection" DROP CONSTRAINT IF EXISTS "BetSelection_within_grid";
ALTER TABLE "BetSelection" ADD  CONSTRAINT "BetSelection_within_grid"
  CHECK ("homeGoals" BETWEEN 0 AND 5 AND "awayGoals" BETWEEN 0 AND 5);
