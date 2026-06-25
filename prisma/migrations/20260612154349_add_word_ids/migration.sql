-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "score" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "wordsCount" INTEGER NOT NULL DEFAULT 20,
    "wordIds" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_DailySession" ("completed", "completedAt", "createdAt", "date", "id", "score", "timeSpent", "wordsCount") SELECT "completed", "completedAt", "createdAt", "date", "id", "score", "timeSpent", "wordsCount" FROM "DailySession";
DROP TABLE "DailySession";
ALTER TABLE "new_DailySession" RENAME TO "DailySession";
CREATE UNIQUE INDEX "DailySession_date_key" ON "DailySession"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
