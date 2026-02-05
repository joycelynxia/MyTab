-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "receiptId" TEXT;

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "imageData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
