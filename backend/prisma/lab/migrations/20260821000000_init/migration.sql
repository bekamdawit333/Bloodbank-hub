-- CreateTable
CREATE TABLE "lab_medical_records" (
    "id" TEXT NOT NULL,
    "faydaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "bloodType" TEXT NOT NULL,
    "diseases" TEXT NOT NULL,
    "hemoglobin" TEXT NOT NULL,
    "platelets" TEXT NOT NULL,
    "allergies" TEXT NOT NULL,
    "otherNotes" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lab_medical_records_faydaId_key" ON "lab_medical_records"("faydaId");

