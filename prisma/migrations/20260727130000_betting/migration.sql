-- ============================================================================
-- Paris : matchs, mises, scores ecartes.
--
-- Aucun montant en double precision. Les mises sont des BIGINT en francs, les
-- cotes des entiers en milliemes, les taux des entiers en points de base.
-- ============================================================================

CREATE TYPE "FixtureKind"   AS ENUM ('REAL', 'VIRTUAL');
CREATE TYPE "FixtureStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED');
CREATE TYPE "BetStatus"     AS ENUM ('OPEN', 'WON', 'LOST', 'VOID');

CREATE TABLE "Fixture" (
  "id"          TEXT            NOT NULL,
  "kind"        "FixtureKind"   NOT NULL,
  "competition" TEXT            NOT NULL,
  "homeTeam"    TEXT            NOT NULL,
  "awayTeam"    TEXT            NOT NULL,
  "kickoffAt"   TIMESTAMP(3)    NOT NULL,
  "status"      "FixtureStatus" NOT NULL DEFAULT 'SCHEDULED',
  "lambdaHome"  DOUBLE PRECISION NOT NULL,
  "lambdaAway"  DOUBLE PRECISION NOT NULL,
  "homeGoals"   INTEGER,
  "awayGoals"   INTEGER,
  "settledAt"   TIMESTAMP(3),
  -- Tirage scelle : la graine est fixee avant la premiere mise, seule son
  -- empreinte est publiee. Elle n'est revelee qu'au coup de sifflet final.
  "resultSeed"       TEXT,
  "resultCommitment" TEXT,
  "createdAt"   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Fixture_pkey" PRIMARY KEY ("id"),
  -- Un match virtuel ouvert aux mises doit porter son engagement.
  CONSTRAINT "Fixture_virtual_is_committed" CHECK (
    "kind" <> 'VIRTUAL' OR "resultCommitment" IS NOT NULL
  ),
  CONSTRAINT "Fixture_lambda_positive"
    CHECK ("lambdaHome" > 0 AND "lambdaAway" > 0),
  CONSTRAINT "Fixture_goals_nonneg"
    CHECK (("homeGoals" IS NULL OR "homeGoals" >= 0)
       AND ("awayGoals" IS NULL OR "awayGoals" >= 0)),
  -- Un match termine porte un score ; un match non termine n'en porte pas.
  CONSTRAINT "Fixture_score_matches_status" CHECK (
    ("status" = 'FINISHED' AND "homeGoals" IS NOT NULL AND "awayGoals" IS NOT NULL)
    OR ("status" <> 'FINISHED' AND "homeGoals" IS NULL AND "awayGoals" IS NULL)
  )
);

CREATE INDEX "Fixture_status_kickoffAt_idx" ON "Fixture"("status", "kickoffAt");
CREATE INDEX "Fixture_kind_kickoffAt_idx"   ON "Fixture"("kind", "kickoffAt");

CREATE TABLE "Bet" (
  "id"                TEXT        NOT NULL,
  "userId"            TEXT        NOT NULL,
  "fixtureId"         TEXT        NOT NULL,
  "stakeMinor"        BIGINT      NOT NULL,
  "oddsMilli"         INTEGER     NOT NULL,
  "potentialWinMinor" BIGINT      NOT NULL,
  "cashbackRateBp"    INTEGER     NOT NULL DEFAULT 0,
  "status"            "BetStatus" NOT NULL DEFAULT 'OPEN',
  "placedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "settledAt"         TIMESTAMP(3),
  CONSTRAINT "Bet_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Bet_stake_positive"   CHECK ("stakeMinor" > 0),
  -- Une cote inferieure ou egale a 1 rendrait moins que la mise.
  CONSTRAINT "Bet_odds_above_one"   CHECK ("oddsMilli" > 1000),
  CONSTRAINT "Bet_cashback_range"   CHECK ("cashbackRateBp" BETWEEN 0 AND 10000),
  CONSTRAINT "Bet_payout_covers_stake" CHECK ("potentialWinMinor" >= "stakeMinor"),
  CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Bet_fixtureId_fkey" FOREIGN KEY ("fixtureId")
    REFERENCES "Fixture"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Bet_userId_placedAt_idx"  ON "Bet"("userId", "placedAt");
CREATE INDEX "Bet_fixtureId_status_idx" ON "Bet"("fixtureId", "status");

CREATE TABLE "BetSelection" (
  "id"        TEXT    NOT NULL,
  "betId"     TEXT    NOT NULL,
  "homeGoals" INTEGER NOT NULL,
  "awayGoals" INTEGER NOT NULL,
  CONSTRAINT "BetSelection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BetSelection_within_grid"
    CHECK ("homeGoals" BETWEEN 0 AND 5 AND "awayGoals" BETWEEN 0 AND 5),
  CONSTRAINT "BetSelection_betId_fkey" FOREIGN KEY ("betId")
    REFERENCES "Bet"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Un meme score ne peut pas etre ecarte deux fois sur le meme pari : sans ca,
-- le risque cumule serait compte double et la cote serait fausse.
CREATE UNIQUE INDEX "BetSelection_betId_homeGoals_awayGoals_key"
  ON "BetSelection"("betId", "homeGoals", "awayGoals");
