
// src/app/api/lab-tests/route.ts
import { NextResponse } from 'next/server';

const labTests = [
  { "id": "complete-blood-count-cbc", "test": "Complete Blood Count (CBC)", "price": 100 },
  { "id": "blood-glucose-fasting", "test": "Blood Glucose (Fasting)", "price": 80 },
  { "id": "blood-glucose-random", "test": "Blood Glucose (Random)", "price": 80 },
  { "id": "urinalysis", "test": "Urinalysis", "price": 70 },
  { "id": "lipid-profile", "test": "Lipid Profile", "price": 150 },
  { "id": "liver-function-test-lft", "test": "Liver Function Test (LFT)", "price": 160 },
  { "id": "kidney-function-test-kft", "test": "Kidney Function Test (KFT)", "price": 140 },
  { "id": "electrolyte-panel", "test": "Electrolyte Panel", "price": 130 },
  { "id": "thyroid-function-test-tft", "test": "Thyroid Function Test (TFT)", "price": 160 },
  { "id": "hemoglobin-a1c", "test": "Hemoglobin A1c", "price": 110 },
  { "id": "vitamin-d", "test": "Vitamin D", "price": 200 },
  { "id": "vitamin-b12", "test": "Vitamin B12", "price": 190 },
  { "id": "calcium", "test": "Calcium", "price": 90 },
  { "id": "iron-studies", "test": "Iron Studies", "price": 120 },
  { "id": "c-reactive-protein-crp", "test": "C-Reactive Protein (CRP)", "price": 100 },
  { "id": "erythrocyte-sedimentation-rate-esr", "test": "Erythrocyte Sedimentation Rate (ESR)", "price": 70 },
  { "id": "hiv-test", "test": "HIV Test", "price": 120 },
  { "id": "hepatitis-b", "test": "Hepatitis B", "price": 130 },
  { "id": "hepatitis-c", "test": "Hepatitis C", "price": 130 },
  { "id": "malaria-test", "test": "Malaria Test", "price": 80 },
  { "id": "dengue-ns1-antigen", "test": "Dengue NS1 Antigen", "price": 140 },
  { "id": "covid-19-pcr", "test": "COVID-19 PCR", "price": 250 },
  { "id": "covid-19-antigen", "test": "COVID-19 Antigen", "price": 150 },
  { "id": "widal-test", "test": "Widal Test", "price": 90 },
  { "id": "stool-routine", "test": "Stool Routine", "price": 85 },
  { "id": "blood-urea", "test": "Blood Urea", "price": 95 },
  { "id": "serum-creatinine", "test": "Serum Creatinine", "price": 100 },
  { "id": "prothrombin-time-pt", "test": "Prothrombin Time (PT)", "price": 110 },
  { "id": "blood-grouping-rh-typing", "test": "Blood Grouping & Rh Typing", "price": 70 },
  { "id": "pregnancy-test-hcg", "test": "Pregnancy Test (hCG)", "price": 90 }
];

export async function GET() {
  return NextResponse.json(labTests);
}
