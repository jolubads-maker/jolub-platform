-- AlterTable: Agregar campo uniqueId a la tabla users
ALTER TABLE "users" ADD COLUMN "uniqueId" TEXT;

-- CreateIndex: Agregar índice único para uniqueId
CREATE UNIQUE INDEX "users_uniqueId_key" ON "users"("uniqueId");

-- Generar uniqueId para usuarios existentes (si los hay)
UPDATE "users" SET "uniqueId" = 'USER-' || CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT) || CAST(id AS TEXT) WHERE "uniqueId" IS NULL;

