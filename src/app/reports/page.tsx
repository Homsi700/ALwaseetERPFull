
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
        title: "معلومات ناقصة",
        description: "يرجى تقديم نص التقرير المالي وسؤالك.",
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
        title: "تم إنشاء الشرح",
        description: "قدم الذكاء الاصطناعي شرحًا لتقريرك.",
      });
    } catch (error) {
      console.error("خطأ في إنشاء الشرح:", error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الشرح. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
      setExplanation("حدث خطأ أثناء معالجة طلبك.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (explanation) {
      navigator.clipboard.writeText(explanation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "تم النسخ!", description: "تم نسخ الشرح إلى الحافظة." });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-headline font-semibold text-foreground">مساعد التقارير المالية</h1>
          <p className="text-muted-foreground mt-2">
            بسّط مصطلحات التقارير المالية المعقدة وافهم العلاقات المعقدة داخل تقاريرك باستخدام الذكاء الاصطناعي.
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-foreground">حلل تقريرك</CardTitle>
            <CardDescription>ألصق نص تقريرك المالي واطرح سؤالاً محدداً حوله.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="reportText" className="text-lg font-medium text-muted-foreground">نص التقرير المالي</Label>
              <Textarea
                id="reportText"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="ألصق محتوى تقريرك المالي هنا..."
                rows={10}
                className="mt-2 bg-input/50 focus:bg-input resize-y"
              />
            </div>
            <div>
              <Label htmlFor="userQuestion" className="text-lg font-medium text-muted-foreground">سؤالك</Label>
              <Input
                id="userQuestion"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                placeholder="مثال: 'اشرح بيان الأرباح والخسائر بعبارات بسيطة.' أو 'ماذا يعني EBITDA؟'"
                className="mt-2 bg-input/50 focus:bg-input"
              />
            </div>
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              <Wand2 className="ml-2 h-5 w-5" />
              {isLoading ? 'يتم التحليل...' : 'احصل على الشرح'}
            </Button>
          </CardContent>
        </Card>

        {explanation && (
          <Card className="shadow-xl animate-fadeIn">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="font-headline text-2xl text-foreground">شرح مُنشأ بواسطة الذكاء الاصطناعي</CardTitle>
                <CardDescription>إليك شرح مبسط بناءً على تقريرك وسؤالك.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCopy} title="نسخ الشرح">
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
            <p className="mr-4 text-muted-foreground">الذكاء الاصطناعي يفكر...</p>
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
