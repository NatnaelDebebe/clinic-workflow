// src/ai/flows/generate-payment-reminders.ts
'use server';

/**
 * @fileOverview AI-powered tool to generate personalized payment reminder messages for receptionists.
 *
 * - generatePaymentReminder - A function that generates payment reminder messages.
 * - GeneratePaymentReminderInput - The input type for the generatePaymentReminder function.
 * - GeneratePaymentReminderOutput - The return type for the generatePaymentReminder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePaymentReminderInputSchema = z.object({
  patientName: z.string().describe('The name of the patient.'),
  amountDue: z.number().describe('The amount due for the patient.'),
  dueDate: z.string().describe('The due date for the payment.'),
  clinicName: z.string().describe('The name of the clinic.'),
});
export type GeneratePaymentReminderInput = z.infer<typeof GeneratePaymentReminderInputSchema>;

const GeneratePaymentReminderOutputSchema = z.object({
  paymentReminder: z.string().describe('The generated payment reminder message.'),
});
export type GeneratePaymentReminderOutput = z.infer<typeof GeneratePaymentReminderOutputSchema>;

export async function generatePaymentReminder(input: GeneratePaymentReminderInput): Promise<GeneratePaymentReminderOutput> {
  return generatePaymentReminderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePaymentReminderPrompt',
  input: {schema: GeneratePaymentReminderInputSchema},
  output: {schema: GeneratePaymentReminderOutputSchema},
  prompt: `You are a helpful assistant for a clinic receptionist. Your task is to generate a personalized and professional payment reminder message for a patient.

  Use the following information to create the payment reminder:

  Patient Name: {{{patientName}}}
  Amount Due: {{{amountDue}}}
  Due Date: {{{dueDate}}}
  Clinic Name: {{{clinicName}}}

  The message should be professional, persuasive, and include all necessary information for the patient to make a payment. The message should also be brief, no more than 2 sentences. The message should not ask for any personal information from the patient.
`,
});

const generatePaymentReminderFlow = ai.defineFlow(
  {
    name: 'generatePaymentReminderFlow',
    inputSchema: GeneratePaymentReminderInputSchema,
    outputSchema: GeneratePaymentReminderOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
