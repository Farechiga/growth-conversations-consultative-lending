-- CreateTable
CREATE TABLE "_RecommendationRespondsToSignal" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RecommendationRespondsToSignal_A_fkey" FOREIGN KEY ("A") REFERENCES "Recommendation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RecommendationRespondsToSignal_B_fkey" FOREIGN KEY ("B") REFERENCES "Signal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_RecommendationRespondsToSignal_AB_unique" ON "_RecommendationRespondsToSignal"("A", "B");

-- CreateIndex
CREATE INDEX "_RecommendationRespondsToSignal_B_index" ON "_RecommendationRespondsToSignal"("B");
