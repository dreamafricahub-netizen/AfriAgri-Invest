-- ============================================================================
-- Registre en partie double
--
-- Cette migration ajoute le registre et les garde-fous qui le rendent fiable.
-- Les contraintes sont posees dans la base : le code applicatif ne peut pas
-- les contourner, meme par erreur, meme depuis un script d'administration.
-- ============================================================================

CREATE TYPE "AccountKind" AS ENUM (
  'USER_WALLET', 'PENDING_PAYOUT', 'UNSETTLED_BETS', 'PSP_FLOAT', 'BANK',
  'REVENUE', 'EXPENSE', 'ROUNDING', 'OPENING_BALANCE'
);

CREATE TABLE "Account" (
  "id"        TEXT          NOT NULL,
  "kind"      "AccountKind" NOT NULL,
  "currency"  TEXT          NOT NULL DEFAULT 'XOF',
  "userId"    TEXT,
  "label"     TEXT,
  "createdAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Un seul portefeuille par utilisateur et par devise.
CREATE UNIQUE INDEX "Account_kind_currency_userId_label_key"
  ON "Account"("kind", "currency", COALESCE("userId", ''), COALESCE("label", ''));
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

CREATE TABLE "LedgerTransaction" (
  "id"             TEXT         NOT NULL,
  "type"           TEXT         NOT NULL,
  "idempotencyKey" TEXT         NOT NULL,
  "reversesId"     TEXT,
  "metadata"       JSONB        NOT NULL DEFAULT '{}',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LedgerTransaction_reversesId_fkey" FOREIGN KEY ("reversesId")
    REFERENCES "LedgerTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- La cle d'idempotence porte l'unicite en base. C'est elle qui absorbe les
-- doublons de callback, pas un SELECT prealable cote application.
CREATE UNIQUE INDEX "LedgerTransaction_idempotencyKey_key"
  ON "LedgerTransaction"("idempotencyKey");
CREATE INDEX "LedgerTransaction_type_createdAt_idx"
  ON "LedgerTransaction"("type", "createdAt");

CREATE TABLE "LedgerEntry" (
  "id"            TEXT   NOT NULL,
  "transactionId" TEXT   NOT NULL,
  "accountId"     TEXT   NOT NULL,
  "amountMinor"   BIGINT NOT NULL,
  "currency"      TEXT   NOT NULL DEFAULT 'XOF',
  CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LedgerEntry_amountMinor_nonzero" CHECK ("amountMinor" <> 0),
  CONSTRAINT "LedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId")
    REFERENCES "LedgerTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId")
    REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "LedgerEntry_accountId_id_idx" ON "LedgerEntry"("accountId", "id");
CREATE INDEX "LedgerEntry_transactionId_idx" ON "LedgerEntry"("transactionId");


-- ---------------------------------------------------------------------------
-- Garde-fou 1 : la devise de l'ecriture doit etre celle du compte.
-- XOF et XAF ont la meme parite mais ne sont pas fongibles.
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

CREATE TRIGGER "LedgerEntry_currency_check"
  BEFORE INSERT ON "LedgerEntry"
  FOR EACH ROW EXECUTE FUNCTION assert_entry_currency();


-- ---------------------------------------------------------------------------
-- Garde-fou 2 : somme nulle par transaction et par devise.
--
-- Contrainte DIFFEREE : elle s'evalue a la validation de la transaction SQL,
-- donc apres l'insertion de toutes les lignes. C'est ce qui rend
-- structurellement impossible de crediter un solde sans contrepartie.
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

CREATE CONSTRAINT TRIGGER "LedgerEntry_balanced"
  AFTER INSERT ON "LedgerEntry"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION assert_transaction_balanced();


-- ---------------------------------------------------------------------------
-- Garde-fou 3 : immuabilite.
-- Une ecriture passee ne se modifie ni ne se supprime. Une erreur se corrige
-- par une transaction de contrepassation qui reference l'originale.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION reject_mutation() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    'Les ecritures du registre sont immuables. Utilisez une contrepassation (reversesId).';
END $$ LANGUAGE plpgsql;

CREATE TRIGGER "LedgerEntry_immutable"
  BEFORE UPDATE OR DELETE ON "LedgerEntry"
  FOR EACH ROW EXECUTE FUNCTION reject_mutation();

CREATE TRIGGER "LedgerTransaction_immutable"
  BEFORE UPDATE OR DELETE ON "LedgerTransaction"
  FOR EACH ROW EXECUTE FUNCTION reject_mutation();


-- ---------------------------------------------------------------------------
-- Lecture des soldes.
--
-- Le sens du solde depend de la nature du compte :
--   - solde debiteur normal  (actifs, charges) : balance =  SUM(ecritures)
--   - solde crediteur normal (passifs, produits, capitaux) : balance = -SUM
--
-- Appliquer le meme signe partout donnerait un encaisse PSP negatif.
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
-- Garde-fou 4 : interdiction du decouvert.
--
-- L'equilibre en partie double garantit la TRACABILITE : tout credit possede
-- une contrepartie nommee. Il ne garantit PAS la solvabilite — on pourrait
-- equilibrer un credit en debitant un compte de charges a l'infini.
--
-- Cette contrainte ferme la porte sur les comptes qui representent de l'argent
-- reellement detenu ou reellement du :
--   USER_WALLET — un utilisateur ne peut pas etre debiteur
--   PSP_FLOAT   — on ne reverse pas plus que ce qui est encaisse chez le PSP
--   BANK        — idem sur la tresorerie propre
--
-- Les comptes de resultat (REVENUE, EXPENSE, OPENING_BALANCE, ROUNDING) restent
-- libres : c'est leur role d'absorber les contreparties. Toute creation de
-- valeur sans origine s'y accumule donc a decouvert, visible et nommee.
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
        'Decouvert interdit : le compte % (%) tomberait a %',
        NEW."accountId", k, bal;
    END IF;
  END IF;

  RETURN NULL;
END $$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER "LedgerEntry_no_overdraft"
  AFTER INSERT ON "LedgerEntry"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION assert_no_overdraft();
