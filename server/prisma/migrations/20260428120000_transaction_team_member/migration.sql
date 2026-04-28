ALTER TABLE "Transaction" ADD COLUMN "teamMemberId" TEXT;

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Transaction_teamMemberId_idx" ON "Transaction"("teamMemberId");
