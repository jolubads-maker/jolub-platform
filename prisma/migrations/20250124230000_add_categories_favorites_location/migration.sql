-- AlterTable: Agregar categoría y ubicación a los anuncios
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'Otros';
ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "location" TEXT;

-- CreateTable: Tabla de favoritos
CREATE TABLE IF NOT EXISTS "favorites" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "adId" INTEGER NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS "ads_category_idx" ON "ads"("category");
CREATE INDEX IF NOT EXISTS "ads_price_idx" ON "ads"("price");

-- CreateIndex: Restricción única para favoritos
CREATE UNIQUE INDEX IF NOT EXISTS "favorites_userId_adId_key" ON "favorites"("userId", "adId");

-- AddForeignKey: Relaciones de favoritos
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_adId_fkey" FOREIGN KEY ("adId") REFERENCES "ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

