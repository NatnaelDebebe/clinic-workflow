
// src/lib/data/availableLabTests.ts

export interface AvailableLabTest {
  id: string;
  name: string;
  description?: string; // Optional description for the test
}

export const availableLabTests: AvailableLabTest[] = [
  { id: 'cbc', name: 'Complete Blood Count (CBC)', description: 'Measures different components of your blood.' },
  { id: 'bmp', name: 'Basic Metabolic Panel (BMP)', description: 'Checks levels of several substances in your blood.' },
  { id: 'lipid', name: 'Lipid Panel', description: 'Measures cholesterol and other fats in your blood.' },
  { id: 'ua', name: 'Urinalysis', description: 'Analyzes urine for various compounds.' },
  { id: 'thyroid', name: 'Thyroid Stimulating Hormone (TSH)', description: 'Checks thyroid gland function.' },
  { id: 'a1c', name: 'Hemoglobin A1c (HbA1c)', description: 'Measures average blood sugar levels over the past 2-3 months.' },
  { id: 'ptinr', name: 'Prothrombin Time (PT/INR)', description: 'Measures how quickly your blood clots.' },
  { id: 'vitd', name: 'Vitamin D Test', description: 'Checks the level of Vitamin D in your blood.' },
  { id: 'strep', name: 'Strep Test (Rapid)', description: 'Detects strep throat bacteria.' },
  { id: 'flu', name: 'Influenza Test (Rapid)', description: 'Detects influenza viruses.' },
];
