-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Asset_userId_type_idx" ON "Asset"("userId", "type");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
