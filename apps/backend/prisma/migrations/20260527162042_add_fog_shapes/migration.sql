-- CreateTable
CREATE TABLE "FogShape" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" JSONB NOT NULL,
    "isRevealed" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FogShape_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FogShape_roomId_idx" ON "FogShape"("roomId");

-- AddForeignKey
ALTER TABLE "FogShape" ADD CONSTRAINT "FogShape_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
