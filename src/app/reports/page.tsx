// src/app/reports/page.tsx
"use client";

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Copy, Check } from 'lucide-react';
import { explainFinancialReport, ExplainFinancialReportInput, ExplainFinancialReportOutput } from '@/ai/flows/financial-report-assistant';
import { useToast } from '@/hooks/use-toast';

const FinancialReportsPage = () => {
  const [reportText, setReportText] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reportText.trim() || !userQuestion.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both the financial report text and your question.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setExplanation(null);

    try {
      const input: ExplainFinancialReportInput = { reportText, userQuestion };
      const result: ExplainFinancialReportOutput = await explainFinancialReport(input);
      setExplanation(result.simplifiedExplanation);
      toast({
        title: "Explanation Generated",
        description: "The AI has provided an explanation for your report.",
      });
    } catch (error) {
      console.error("Error generating explanation:", error);
      toast({
        title: "Error",
        description: "Failed to generate explanation. Please try again.",
        variant: "destructive",
      });
      setExplanation("An error occurred while processing your request.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (explanation) {
      navigator.clipboard.writeText(explanation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Explanation copied to clipboard." });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-headline font-semibold text-foreground">Financial Report Assistant</h1>
          <p className="text-muted-foreground mt-2">
            Simplify complex financial report terminology and understand intricate relationships within your reports using AI.
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-foreground">Analyze Your Report</CardTitle>
            <CardDescription>Paste your financial report text and ask a specific question about it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="reportText" className="text-lg font-medium text-muted-foreground">Financial Report Text</Label>
              <Textarea
                id="reportText"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Paste the content of your financial report here..."
                rows={10}
                className="mt-2 bg-input/50 focus:bg-input resize-y"
              />
            </div>
            <div>
              <Label htmlFor="userQuestion" className="text-lg font-medium text-muted-foreground">Your Question</Label>
              <Input
                id="userQuestion"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                placeholder="e.g., 'Explain the P&L statement in simple terms.' or 'What does EBITDA mean?'"
                className="mt-2 bg-input/50 focus:bg-input"
              />
            </div>
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              <Wand2 className="mr-2 h-5 w-5" />
              {isLoading ? 'Analyzing...' : 'Get Explanation'}
            </Button>
          </CardContent>
        </Card>

        {explanation && (
          <Card className="shadow-xl animate-fadeIn">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="font-headline text-2xl text-foreground">AI Generated Explanation</CardTitle>
                <CardDescription>Here's a simplified explanation based on your report and question.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy explanation">
                {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert text-foreground bg-muted/30 p-4 rounded-md whitespace-pre-wrap font-body">
                {explanation}
              </div>
            </CardContent>
          </Card>
        )}
         {isLoading && !explanation && (
          <div className="flex justify-center items-center p-10">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-4 text-muted-foreground">AI is thinking...</p>
          </div>
        )}
      </div>
       <style jsx global>{`
          .prose h1, .prose h2, .prose h3, .prose h4 { font-family: 'Playfair Display', serif; }
          .prose p, .prose li, .prose blockquote { font-family: 'PT Sans', sans-serif; }
          .prose code { font-family: 'Source Code Pro', monospace; }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-in-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
    </AppLayout>
  );
};

export default FinancialReportsPage;
