-- ============================================================================
-- Baseline PostgreSQL.
--
-- Cette migration decrit la structure telle qu'elle existe deja en production.
-- Elle remplace l'ancien fichier, ecrit en SQLite (REAL, DATETIME), heritage du
-- demarrage du projet sur SQLite avant la bascule vers Supabase — bascule faite
-- par `db push`, donc sans regeneration de l'historique.
--
-- Sur une base VIDE : elle s'applique normalement.
-- Sur la base EXISTANTE : ne pas la rejouer. La marquer comme deja appliquee :
--     npx prisma migrate resolve --applied 20260204134547_init
-- ============================================================================

CREATE TABLE "User" (
    "id"              TEXT             NOT NULL,
    "email"           TEXT             NOT NULL,
    "password"        TEXT             NOT NULL,
    "name"            TEXT,
    "phone"           TEXT,
    "city"            TEXT,
    "role"            TEXT             NOT NULL DEFAULT 'USER',
    "status"          TEXT             NOT NULL DEFAULT 'ACTIVE',
    "balance"         DOUBLE PRECISION NOT NULL DEFAULT 3000,
    "investedCapital" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "referralCode"    TEXT             NOT NULL,
    "referredBy"      TEXT,
    "createdAt"       TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3)     NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key"        ON "User"("email");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

CREATE TABLE "Investment" (
    "id"           TEXT             NOT NULL,
    "userId"       TEXT             NOT NULL,
    "packId"       INTEGER          NOT NULL,
    "amount"       DOUBLE PRECISION NOT NULL,
    "dailyRate"    DOUBLE PRECISION NOT NULL,
    "createdAt"    TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastGainDate" TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status"       TEXT             NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Investment_userId_fkey" FOREIGN KEY ("userId")
      REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Transaction" (
    "id"              TEXT             NOT NULL,
    "userId"          TEXT             NOT NULL,
    "type"            TEXT             NOT NULL,
    "amount"          DOUBLE PRECISION NOT NULL,
    "status"          TEXT             NOT NULL DEFAULT 'COMPLETED',
    "method"          TEXT,
    "reference"       TEXT,
    "description"     TEXT,
    "proofImage"      TEXT,
    "packId"          INTEGER,
    "withdrawAddress" TEXT,
    "createdAt"       TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3)     NOT NULL,
    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId")
      REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Referral" (
    "id"            TEXT             NOT NULL,
    "sponsorId"     TEXT             NOT NULL,
    "referredId"    TEXT             NOT NULL,
    "totalInvested" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalBonus"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)     NOT NULL,
    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Referral_sponsorId_fkey" FOREIGN KEY ("sponsorId")
      REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId")
      REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Referral_referredId_key" ON "Referral"("referredId");

CREATE TABLE "Settings" (
    "id"        TEXT         NOT NULL,
    "key"       TEXT         NOT NULL,
    "value"     TEXT         NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");
