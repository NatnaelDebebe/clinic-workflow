// use server'
'use server';

/**
 * @fileOverview A flow to generate welcome packets for new patients.
 *
 * - generateWelcomePacket - A function that handles the welcome packet generation process.
 * - GenerateWelcomePacketInput - The input type for the generateWelcomePacket function.
 * - GenerateWelcomePacketOutput - The return type for the generateWelcomePacket function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWelcomePacketInputSchema = z.object({
  patientName: z.string().describe('The name of the new patient.'),
  clinicName: z.string().describe('The name of the clinic.'),
  doctorName: z.string().describe('The name of the doctor.'),
  appointmentDate: z.string().describe('The date of the first appointment.'),
  clinicPhoneNumber: z.string().describe('The clinic phone number.'),
  clinicAddress: z.string().describe('The clinic address.'),
});
export type GenerateWelcomePacketInput = z.infer<typeof GenerateWelcomePacketInputSchema>;

const GenerateWelcomePacketOutputSchema = z.object({
  welcomePacket: z.string().describe('The generated welcome packet content.'),
});
export type GenerateWelcomePacketOutput = z.infer<typeof GenerateWelcomePacketOutputSchema>;

export async function generateWelcomePacket(input: GenerateWelcomePacketInput): Promise<GenerateWelcomePacketOutput> {
  return generateWelcomePacketFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWelcomePacketPrompt',
  input: {schema: GenerateWelcomePacketInputSchema},
  output: {schema: GenerateWelcomePacketOutputSchema},
  prompt: `You are a helpful assistant that generates welcome packets for new patients.

  Use the following information to create a personalized and informative welcome packet for the new patient.

  Patient Name: {{{patientName}}}
  Clinic Name: {{{clinicName}}}
  Doctor Name: {{{doctorName}}}
  Appointment Date: {{{appointmentDate}}}
  Clinic Phone Number: {{{clinicPhoneNumber}}}
  Clinic Address: {{{clinicAddress}}}

  The welcome packet should include:
  - A warm welcome message to the clinic.
  - Information about the clinic, including its name, address, and phone number.
  - The doctor's name and a brief introduction.
  - The date and time of the first appointment.
  - Any other relevant information that would be helpful for a new patient.
  `,
});

const generateWelcomePacketFlow = ai.defineFlow(
  {
    name: 'generateWelcomePacketFlow',
    inputSchema: GenerateWelcomePacketInputSchema,
    outputSchema: GenerateWelcomePacketOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
