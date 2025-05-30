
// src/lib/data/labTests.ts

export interface AdminLabTest {
  id: string;
  name: string;
  price: number;
}

// Helper function to generate a slug-like ID from a name
const generateLabTestId = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

export const initialLabTestsData: { name: string; price: number }[] = [
  { "name": "Complete Blood Count (CBC)", "price": 100 },
  { "name": "Blood Glucose (Fasting)", "price": 80 },
  { "name": "Blood Glucose (Random)", "price": 80 },
  { "name": "Urinalysis", "price": 70 },
  { "name": "Lipid Profile", "price": 150 },
  { "name": "Liver Function Test (LFT)", "price": 160 },
  { "name": "Kidney Function Test (KFT)", "price": 140 },
  { "name": "Electrolyte Panel", "price": 130 },
  { "name": "Thyroid Function Test (TFT)", "price": 160 },
  { "name": "Hemoglobin A1c", "price": 110 },
  { "name": "Vitamin D", "price": 200 },
  { "name": "Vitamin B12", "price": 190 },
  { "name": "Calcium", "price": 90 },
  { "name": "Iron Studies", "price": 120 },
  { "name": "C-Reactive Protein (CRP)", "price": 100 },
  { "name": "Erythrocyte Sedimentation Rate (ESR)", "price": 70 },
  { "name": "HIV Test", "price": 120 },
  { "name": "Hepatitis B", "price": 130 },
  { "name": "Hepatitis C", "price": 130 },
  { "name": "Malaria Test", "price": 80 },
  { "name": "Dengue NS1 Antigen", "price": 140 },
  { "name": "COVID-19 PCR", "price": 250 },
  { "name": "COVID-19 Antigen", "price": 150 },
  { "name": "Widal Test", "price": 90 },
  { "name": "Stool Routine", "price": 85 },
  { "name": "Blood Urea", "price": 95 },
  { "name": "Serum Creatinine", "price": 100 },
  { "name": "Prothrombin Time (PT)", "price": 110 },
  { "name": "Blood Grouping & Rh Typing", "price": 70 },
  { "name": "Pregnancy Test (hCG)", "price": 90 }
];

export const initialLabTests: AdminLabTest[] = initialLabTestsData.map(test => ({
  ...test,
  id: generateLabTestId(test.name),
}));

const MANAGED_LAB_TESTS_STORAGE_KEY = 'managedLabTests';

export function getManagedLabTests(): AdminLabTest[] {
  if (typeof window !== 'undefined') {
    const storedTests = localStorage.getItem(MANAGED_LAB_TESTS_STORAGE_KEY);
    if (storedTests) {
      try {
        return JSON.parse(storedTests) as AdminLabTest[];
      } catch (e) {
        console.error("Error parsing managed lab tests from localStorage", e);
        localStorage.setItem(MANAGED_LAB_TESTS_STORAGE_KEY, JSON.stringify(initialLabTests));
        return initialLabTests;
      }
    } else {
      localStorage.setItem(MANAGED_LAB_TESTS_STORAGE_KEY, JSON.stringify(initialLabTests));
      return initialLabTests;
    }
  }
  return initialLabTests; // Fallback for SSR
}

export function saveManagedLabTests(tests: AdminLabTest[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MANAGED_LAB_TESTS_STORAGE_KEY, JSON.stringify(tests));
  }
}
export { generateLabTestId };
