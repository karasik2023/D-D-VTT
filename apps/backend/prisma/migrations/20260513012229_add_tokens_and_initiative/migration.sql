-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "color" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "layer" TEXT NOT NULL DEFAULT 'tokens',
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InitiativeEntry" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "initiative" INTEGER,
    "tokenId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InitiativeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Token_roomId_idx" ON "Token"("roomId");

-- CreateIndex
CREATE INDEX "InitiativeEntry_roomId_idx" ON "InitiativeEntry"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "InitiativeEntry_roomId_tokenId_key" ON "InitiativeEntry"("roomId", "tokenId");

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeEntry" ADD CONSTRAINT "InitiativeEntry_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
