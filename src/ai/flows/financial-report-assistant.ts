// 'use server';

/**
 * @fileOverview An AI assistant that simplifies complex financial report terminology and explains complex relationships within the report in natural language.
 *
 * - explainFinancialReport - A function that explains financial reports in simple terms.
 * - ExplainFinancialReportInput - The input type for the explainFinancialReport function.
 * - ExplainFinancialReportOutput - The return type for the explainFinancialReport function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainFinancialReportInputSchema = z.object({
  reportText: z
    .string()
    .describe("The text of the financial report to be explained."),
  userQuestion: z
    .string()
    .describe("The user's question about the report.")
});
export type ExplainFinancialReportInput = z.infer<typeof ExplainFinancialReportInputSchema>;

const ExplainFinancialReportOutputSchema = z.object({
  simplifiedExplanation: z
    .string()
    .describe("A simplified explanation of the financial report, addressing the user's question."),
});
export type ExplainFinancialReportOutput = z.infer<typeof ExplainFinancialReportOutputSchema>;

export async function explainFinancialReport(input: ExplainFinancialReportInput): Promise<ExplainFinancialReportOutput> {
  return explainFinancialReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainFinancialReportPrompt',
  input: {schema: ExplainFinancialReportInputSchema},
  output: {schema: ExplainFinancialReportOutputSchema},
  prompt: `You are an AI assistant that simplifies complex financial reports.

  The user will provide a financial report and ask a question about it.  Your job is to provide a simplified explanation that addresses the user's question in a way that is easy to understand, focusing on complex terminology and relationships within the report.

  Financial Report:
  {{reportText}}

  User Question:
  {{userQuestion}}
  `,
});

const explainFinancialReportFlow = ai.defineFlow(
  {
    name: 'explainFinancialReportFlow',
    inputSchema: ExplainFinancialReportInputSchema,
    outputSchema: ExplainFinancialReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
