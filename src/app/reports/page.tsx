
// src/app/reports/page.tsx
"use client";

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from "@/components/ui/calendar";
import { Wand2, Copy, Check, FileText, Download, Filter, BarChartHorizontalBig, PieChart, CalendarIcon, Maximize } from 'lucide-react';
import { explainFinancialReport, ExplainFinancialReportInput, ExplainFinancialReportOutput } from '@/ai/flows/financial-report-assistant';
import { useToast } from '@/hooks/use-toast';
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Cell } from 'recharts';


const mockChartData = [
  { name: 'يناير', مبيعات: 4000, أرباح: 2400 },
  { name: 'فبراير', مبيعات: 3000, أرباح: 1398 },
  { name: 'مارس', مبيعات: 5000, أرباح: 3800 },
  { name: 'أبريل', مبيعات: 2780, أرباح: 1908 },
];
const mockPieData = [
  { name: 'فواكه', value: 400 },
  { name: 'مخبوزات', value: 300 },
  { name: 'ألبان', value: 300 },
  { name: 'لحوم', value: 200 },
];
const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];


const FinancialReportsPage = () => {
  const [reportText, setReportText] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [reportType, setReportType] = useState<string>("sales_summary");

  const handleSubmitExplanation = async () => {
    if (!reportText.trim() || !userQuestion.trim()) {
      toast({
        title: "معلومات ناقصة",
        description: "يرجى تقديم نص التقرير المالي وسؤالك.",
        variant: "destructive",
      });
      return;
    }
    setIsLoadingExplanation(true);
    setExplanation(null);
    try {
      const input: ExplainFinancialReportInput = { reportText, userQuestion };
      const result: ExplainFinancialReportOutput = await explainFinancialReport(input);
      setExplanation(result.simplifiedExplanation);
      toast({ title: "تم إنشاء الشرح", description: "قدم الذكاء الاصطناعي شرحًا لتقريرك." });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في إنشاء الشرح.", variant: "destructive" });
      setExplanation("حدث خطأ أثناء معالجة طلبك.");
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  const handleCopyExplanation = () => {
    if (explanation) {
      navigator.clipboard.writeText(explanation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "تم النسخ!", description: "تم نسخ الشرح إلى الحافظة." });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
            <FileText className="ml-3 h-8 w-8 text-primary" />
            التقارير المالية والتحليلات
          </h1>
           <Button variant="outline">
            <Download className="ml-2 h-4 w-4" /> تصدير (PDF/Excel)
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-foreground flex items-center"><Filter className="ml-2 h-5 w-5 text-primary"/>خيارات التصفية وعرض التقرير</CardTitle>
            <CardDescription>حدد نوع التقرير والفترة الزمنية لعرض البيانات المطلوبة.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="reportType">نوع التقرير</Label>
              <Select value={reportType} onValueChange={setReportType} dir="rtl">
                <SelectTrigger id="reportType" className="mt-1 bg-input/50 focus:bg-input">
                  <SelectValue placeholder="اختر نوع التقرير" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_summary">ملخص المبيعات</SelectItem>
                  <SelectItem value="profit_loss">الأرباح والخسائر</SelectItem>
                  <SelectItem value="inventory_status">حالة المخزون</SelectItem>
                  <SelectItem value="customer_activity">نشاط العملاء</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateRange">النطاق الزمني</Label>
               <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dateRange"
                    variant={"outline"}
                    className="w-full justify-start text-right font-normal mt-1 bg-input/50 hover:bg-input/70"
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "d MMM yyyy", { locale: arSA })} - {" "}
                          {format(dateRange.to, "d MMM yyyy", { locale: arSA })}
                        </>
                      ) : (
                        format(dateRange.from, "d MMM yyyy", { locale: arSA })
                      )
                    ) : (
                      <span>اختر تاريخًا</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    dir="rtl"
                    locale={arSA}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground md:mt-0 mt-4">
              تطبيق وعرض التقرير
            </Button>
          </CardContent>
        </Card>

        {/* Placeholder for Interactive Charts & Data Display based on filters */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="font-headline text-xl text-foreground">عرض التقرير: {reportType.replace("_", " ").toLocaleUpperCase()}</CardTitle>
            <Button variant="ghost" size="icon"><Maximize className="h-5 w-5 text-muted-foreground"/></Button>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            {reportType === "sales_summary" && (
               <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip cursor={{fill: 'hsl(var(--muted))'}}/>
                  <Legend />
                  <Bar dataKey="مبيعات" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="أرباح" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
             {reportType === "inventory_status" && (
               <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={mockPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label fill="hsl(var(--chart-1))">
                     {mockPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
            {(reportType !== "sales_summary" && reportType !== "inventory_status") && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <BarChartHorizontalBig className="w-16 h-16 mb-2 text-muted-foreground/50"/>
                    <p>سيتم عرض البيانات التفاعلية هنا بناءً على اختيارك.</p>
                </div>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            البيانات المعروضة للفترة من {dateRange?.from ? format(dateRange.from, "PPP", {locale:arSA}) : ""} إلى {dateRange?.to ? format(dateRange.to, "PPP", {locale:arSA}) : ""}.
          </CardFooter>
        </Card>

        {/* AI Assistant Section */}
        <Card className="shadow-xl border-t-4 border-accent">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-foreground flex items-center">
                <Wand2 className="ml-3 h-6 w-6 text-accent"/>مساعد التقارير الذكي
            </CardTitle>
            <CardDescription>ألصق نص تقرير مالي أو جزء منه، واطرح سؤالاً محدداً ليقوم الذكاء الاصطناعي بتبسيطه لك.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="reportTextAi" className="text-md font-medium text-muted-foreground">نص التقرير لتحليله</Label>
              <Textarea
                id="reportTextAi"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="ألصق محتوى التقرير هنا..."
                rows={8}
                className="mt-2 bg-input/50 focus:bg-input resize-y"
              />
            </div>
            <div>
              <Label htmlFor="userQuestionAi" className="text-md font-medium text-muted-foreground">سؤالك حول التقرير</Label>
              <Input
                id="userQuestionAi"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                placeholder="مثال: 'اشرح لي قسم الأصول المتداولة.' أو 'ماذا يعني صافي الربح بعد الضريبة؟'"
                className="mt-2 bg-input/50 focus:bg-input"
              />
            </div>
            <Button onClick={handleSubmitExplanation} disabled={isLoadingExplanation} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
              <Wand2 className="ml-2 h-5 w-5" />
              {isLoadingExplanation ? 'يتم التحليل...' : 'احصل على شرح مبسط'}
            </Button>
          </CardContent>
        
          {isLoadingExplanation && !explanation && (
            <div className="flex justify-center items-center p-6">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              <p className="mr-3 text-muted-foreground">الذكاء الاصطناعي يعالج طلبك...</p>
            </div>
          )}

          {explanation && (
            <CardFooter className="flex-col items-start space-y-2 border-t pt-4">
                <div className="flex justify-between w-full items-center">
                    <h3 className="font-semibold text-foreground">الشرح المُنشأ بواسطة الذكاء الاصطناعي:</h3>
                    <Button variant="ghost" size="icon" onClick={handleCopyExplanation} title="نسخ الشرح">
                        {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
                    </Button>
                </div>
              <div className="prose prose-sm max-w-none dark:prose-invert text-foreground bg-muted/30 p-4 rounded-md whitespace-pre-wrap font-body w-full">
                {explanation}
              </div>
            </CardFooter>
          )}
        </Card>

      </div>
       <style jsx global>{`
          .prose h1, .prose h2, .prose h3, .prose h4 { font-family: 'Playfair Display', serif; }
          .prose p, .prose li, .prose blockquote { font-family: 'PT Sans', sans-serif; }
          .prose code { font-family: 'Source Code Pro', monospace; }
        `}</style>
    </AppLayout>
  );
};

export default FinancialReportsPage;

    