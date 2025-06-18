
// src/app/reports/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from "@/components/ui/calendar";
import { Wand2, Copy, Check, FileText, Download, Filter, BarChartHorizontalBig, PieChartIcon, CalendarIcon, Maximize, TrendingUp, Users, Package, LineChartIcon, PackageSearch } from 'lucide-react';
import { explainFinancialReport, ExplainFinancialReportInput, ExplainFinancialReportOutput } from '@/ai/flows/financial-report-assistant';
import { useToast } from '@/hooks/use-toast';
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Pie, Cell, LineChart, Line } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

const MOCK_PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const chartConfig = {
  sales: { label: "المبيعات", color: "hsl(var(--chart-1))" },
  profit: { label: "الأرباح", color: "hsl(var(--chart-2))" }, // Example, not directly fetched yet
  costs: { label: "التكاليف", color: "hsl(var(--chart-3))" }, // Example, not directly fetched yet
  revenue: { label: "الإيرادات", color: "hsl(var(--chart-1))" }, // Used for P&L example
  cogs: { label: "تكلفة البضاعة المباعة", color: "hsl(var(--chart-2))" }, // Used for P&L example
  expenses: { label: "المصروفات", color: "hsl(var(--chart-4))" }, // Used for P&L example
  netProfit: { label: "صافي الربح", color: "hsl(var(--chart-5))" }, // Used for P&L example
  inventoryValue: { label: "قيمة المخزون", color: "hsl(var(--chart-1))"}, // Example
  products: { label: "المنتجات", color: "hsl(var(--chart-3))" }, // For products by category
  newCustomers: { label: "عملاء جدد", color: "hsl(var(--chart-1))"}, // Example
  activeCustomers: { label: "عملاء نشطون", color: "hsl(var(--chart-2))"}, // Example
  productCategory: {label: "فئة المنتج", color: "hsl(var(--chart-3))"}
} satisfies React.ComponentProps<typeof ChartContainer>["config"];

interface SalesSummaryData { name: string; sales: number; /* profit: number; costs: number; */ } // Simplified for direct Supabase fetch
interface ProfitLossData { month: string; revenue: number; cogs: number; expenses: number; netProfit: number; } // Remains mock for now
interface InventoryStatusData { name: string; products: number; } // Changed to count products by category
interface CustomerActivityData { date: string; newCustomers: number; activeCustomers: number; totalOrders: number; } // Remains mock for now


const FinancialReportsPage = () => {
  const [reportText, setReportText] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });
  const [reportType, setReportType] = useState<string>("sales_summary");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("");
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>("");
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>("");
  
  const [isLoadingReportData, setIsLoadingReportData] = useState(false);
  const [salesSummaryData, setSalesSummaryData] = useState<SalesSummaryData[]>([]);
  const [profitLossData, setProfitLossData] = useState<ProfitLossData[]>([]); // Mock data for P&L
  const [inventoryStatusData, setInventoryStatusData] = useState<InventoryStatusData[]>([]);
  const [customerActivityData, setCustomerActivityData] = useState<CustomerActivityData[]>([]); // Mock data for Customer Activity
  
  const [filterCategories, setFilterCategories] = useState<{value: string, label: string}[]>([]);
  const [filterClients, setFilterClients] = useState<{value: string, label: string}[]>([]);
  const [filterSuppliers, setFilterSuppliers] = useState<{value: string, label: string}[]>([]);

  // Fetch data for filters
  useEffect(() => {
    const fetchFilterData = async () => {
      if (!user) return;
      try {
        // Fetch distinct categories from products
        const { data: categoriesData, error: catError } = await supabase.from('products').select('category').distinct();
        if (catError) throw catError;
        setFilterCategories(categoriesData.map((c:any) => ({ value: c.category, label: c.category })));

        // Fetch clients
        const { data: clientsData, error: cliError } = await supabase.from('clients').select('id, name');
        if (cliError) throw cliError;
        setFilterClients(clientsData.map((c:any) => ({ value: c.id, label: c.name })));
        
        // Fetch suppliers
        const { data: suppliersData, error: supError } = await supabase.from('suppliers').select('id, name');
        if (supError) throw supError;
        setFilterSuppliers(suppliersData.map((s:any) => ({ value: s.id, label: s.name })));

      } catch (error: any) {
        toast({ title: "خطأ في جلب بيانات التصفية", description: "فشل جلب بيانات الفئات أو العملاء أو الموردين. " + error.message, variant: "destructive"});
      }
    };
    if(user) fetchFilterData();
  }, [user, toast]);


  const fetchReportData = useCallback(async () => {
    if (!user) return;
    setIsLoadingReportData(true);
    
    const fromDate = dateRange?.from?.toISOString() || new Date(0).toISOString();
    const toDate = dateRange?.to?.toISOString() || new Date().toISOString();

    if (reportType === "sales_summary") {
      try {
        const { data, error } = await supabase
          .from('sales')
          .select('sale_date, total_amount')
          .gte('sale_date', fromDate)
          .lte('sale_date', toDate);
        if (error) throw error;

        const monthlySales: {[key: string]: number} = {};
        data?.forEach(sale => {
          const month = format(new Date(sale.sale_date), "yyyy-MM", { locale: arSA }); // Format to 'YYYY-MM' for consistent grouping
          monthlySales[month] = (monthlySales[month] || 0) + sale.total_amount;
        });
        
        const formattedSalesData = Object.entries(monthlySales)
            .map(([monthYear, totalSales]) => ({
                name: format(new Date(monthYear + '-01'), "MMM yyyy", { locale: arSA }), // Display format
                sales: totalSales,
            }))
            .sort((a,b) => new Date(a.name.split(" ")[1] + "-" + Date.parse(a.name.split(" ")[0] + " 1, 2000")).getTime() - new Date(b.name.split(" ")[1] + "-" + Date.parse(b.name.split(" ")[0] + " 1, 2000")).getTime()); // Basic sort by month/year

        setSalesSummaryData(formattedSalesData);
        if (formattedSalesData.length === 0) {
            toast({ title: "لا توجد بيانات مبيعات", description: "لم يتم العثور على مبيعات للفترة المحددة."});
        }
      } catch (error: any) {
        toast({ title: `خطأ في جلب ملخص المبيعات`, description: error.message, variant: 'destructive'});
        setSalesSummaryData([]);
      }
    } else if (reportType === "inventory_status") {
       try {
        // This fetches count of products per category. More advanced inventory valuation would require purchase_price.
        const { data, error } = await supabase
          .from('products')
          .select('category, id'); // Select 'id' for counting or 'purchase_price, stock' for valuation
        
        if (error) throw error;
        const categoryData: {[key:string]: number} = {};
        data?.forEach(p => {
            const cat = p.category || 'غير مصنف';
            categoryData[cat] = (categoryData[cat] || 0) + 1; // Count products per category
        });
        setInventoryStatusData(Object.entries(categoryData).map(([name, count]) => ({name, products: count})));
        if (Object.keys(categoryData).length === 0) {
             toast({ title: "لا توجد بيانات للمخزون", description: "لم يتم العثور على منتجات لعرض حالة المخزون."});
        }
       } catch (error: any) {
        toast({ title: `خطأ في جلب حالة المخزون`, description: error.message, variant: 'destructive'});
        setInventoryStatusData([]);
       }
    } else {
        // For other report types like profit_loss or customer_activity, advanced backend aggregation is needed.
        // We'll clear/mock these for now.
        setProfitLossData([ // Mock data example
            { month: 'يناير', revenue: 5000, cogs: 2000, expenses: 1000, netProfit: 2000 },
            { month: 'فبراير', revenue: 6000, cogs: 2500, expenses: 1200, netProfit: 2300 },
        ]);
        setCustomerActivityData([ // Mock data example
            { date: '2024-01-01', newCustomers: 5, activeCustomers: 50, totalOrders: 70 },
            { date: '2024-02-01', newCustomers: 8, activeCustomers: 55, totalOrders: 80 },
        ]);
        if(reportType !== "sales_summary") setSalesSummaryData([]);
        if(reportType !== "inventory_status") setInventoryStatusData([]);
        toast({ title: "التقرير قيد التطوير", description: `التقارير المتقدمة مثل "${reportTypeLabelMap[reportType]}" تتطلب تجميع بيانات معقد في الواجهة الخلفية (Supabase Views/Functions). يتم عرض بيانات وهمية أو مبسطة حالياً.`});
    }

    setIsLoadingReportData(false);
  }, [user, reportType, dateRange, toast]);

  useEffect(() => {
    if(user) fetchReportData();
  }, [fetchReportData, user]); // Added user dependency


  const handleSubmitExplanation = async () => {
    if (!reportText.trim() || !userQuestion.trim()) {
      toast({ title: "معلومات ناقصة", description: "يرجى تقديم نص التقرير المالي وسؤالك.", variant: "destructive" });
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
  
  const handleExportReport = () => {
    // This remains a mock export function
    toast({ title: "بدء تصدير التقرير", description: `جاري تجهيز تقرير "${reportTypeLabelMap[reportType as keyof typeof reportTypeLabelMap] || reportType}" للتصدير...` });
    setTimeout(() => {
      toast({ title: "اكتمل التصدير (وهمي)", description: "تم إكمال عملية التصدير الوهمية بنجاح." });
    }, 2000);
  };

  const reportTypeLabelMap: {[key: string]: string} = {
    sales_summary: "ملخص المبيعات",
    profit_loss: "الأرباح والخسائر (وهمي)",
    inventory_status: "حالة المخزون (حسب الفئة)",
    customer_activity: "نشاط العملاء (وهمي)"
  };

  const renderChartForReportType = () => {
    if (isLoadingReportData) {
      return <div className="flex justify-center items-center h-[350px]"><PackageSearch className="h-16 w-16 text-muted-foreground/30 animate-pulse" /></div>;
    }
    switch (reportType) {
      case "sales_summary":
        return salesSummaryData.length > 0 ? (
          <ChartContainer config={chartConfig} className="w-full h-full">
            <BarChart data={salesSummaryData} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
              <XAxis type="number" axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipContent />} cursor={{fill: 'hsl(var(--muted))'}}/>
              <Legend content={<ChartLegendContent />}/>
              <Bar dataKey="sales" fill="var(--color-sales)" radius={[0, 4, 4, 0]} name={chartConfig.sales.label} />
              {/* Removed profit and costs as they are not directly fetched from Supabase sales data */}
            </BarChart>
          </ChartContainer>
        ) : <p className="text-center text-muted-foreground p-4">لا توجد بيانات لعرضها لملخص المبيعات للفترة المحددة.</p>;
      case "profit_loss":
         // Renders mock data as complex P&L requires backend aggregation
        return profitLossData.length > 0 ? (
          <ChartContainer config={chartConfig} className="w-full h-full">
            <LineChart data={profitLossData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<ChartTooltipContent indicator="line" />} />
              <Legend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} name={chartConfig.revenue.label}/>
              <Line type="monotone" dataKey="cogs" stroke="var(--color-cogs)" strokeWidth={2} name={chartConfig.cogs.label}/>
              <Line type="monotone" dataKey="netProfit" stroke="var(--color-netProfit)" strokeWidth={3} name={chartConfig.netProfit.label}/>
            </LineChart>
          </ChartContainer>
        ) : <p className="text-center text-muted-foreground p-4">لا توجد بيانات لعرضها لتقرير الأرباح والخسائر. (بيانات وهمية، يتطلب تجميع من الخلفية)</p>;
      case "inventory_status":
        // Renders count of products by category
        return inventoryStatusData.length > 0 ? (
          <ChartContainer config={chartConfig} className="w-full h-full">
            <PieChart>
              <Tooltip content={<ChartTooltipContent nameKey="name" />} />
              <Pie data={inventoryStatusData} dataKey="products" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                 {inventoryStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={MOCK_PIE_COLORS[index % MOCK_PIE_COLORS.length]} />
                 ))}
              </Pie>
              <Legend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
        ) : <p className="text-center text-muted-foreground p-4">لا توجد بيانات لعرضها لحالة المخزون (حسب الفئة).</p>;
      case "customer_activity":
         // Renders mock data as this requires backend aggregation
         return customerActivityData.length > 0 ? (
          <ChartContainer config={chartConfig} className="w-full h-full">
            <BarChart data={customerActivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG', { month: 'short' })} />
              <YAxis />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend content={<ChartLegendContent />} />
              <Bar dataKey="newCustomers" fill="var(--color-newCustomers)" name={chartConfig.newCustomers.label} radius={[4, 4, 0, 0]} />
              <Bar dataKey="activeCustomers" fill="var(--color-activeCustomers)" name={chartConfig.activeCustomers.label} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : <p className="text-center text-muted-foreground p-4">لا توجد بيانات لعرضها لنشاط العملاء. (بيانات وهمية، يتطلب تجميع من الخلفية)</p>;
      default:
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                <BarChartHorizontalBig className="w-20 h-20 mb-4 text-muted-foreground/30"/>
                <p className="text-lg">اختر نوع تقرير لعرض البيانات.</p>
                <p className="text-sm">سيتم عرض الرسوم البيانية التفاعلية هنا بناءً على اختيارك.</p>
            </div>
        );
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
           <Button variant="outline" onClick={handleExportReport}>
            <Download className="ml-2 h-4 w-4" /> تصدير الكل (وهمي)
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-foreground flex items-center"><Filter className="ml-2 h-5 w-5 text-primary"/>خيارات التصفية وعرض التقرير</CardTitle>
            <CardDescription>حدد نوع التقرير والفترة الزمنية. التقارير المتقدمة تتطلب منطق تجميع في الواجهة الخلفية (Supabase Views/Functions) لعرض بيانات دقيقة وفعالة.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="reportType">نوع التقرير</Label>
              <Select value={reportType} onValueChange={setReportType} dir="rtl">
                <SelectTrigger id="reportType" className="mt-1 bg-input/50 focus:bg-input">
                  <SelectValue placeholder="اختر نوع التقرير" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(reportTypeLabelMap).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
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
                          {format(dateRange.from, "d MMM yy", { locale: arSA })} - {" "}
                          {format(dateRange.to, "d MMM yy", { locale: arSA })}
                        </>
                      ) : (
                        format(dateRange.from, "d MMM yy", { locale: arSA })
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
            <Button onClick={fetchReportData} className="bg-primary hover:bg-primary/90 text-primary-foreground md:mt-0 mt-4 md:col-span-1 lg:col-span-1 self-end" disabled={isLoadingReportData}>
              {isLoadingReportData ? "جاري التحميل..." : "تطبيق وعرض التقرير"}
            </Button>
            {/* Filters below are UI only for now and don't affect Supabase fetched data directly without backend logic */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 border-t pt-4">
                <div>
                  <Label htmlFor="filterCategory">تصفية حسب الفئة (واجهة فقط)</Label>
                  <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter} dir="rtl">
                    <SelectTrigger id="filterCategory" className="mt-1 bg-input/50 focus:bg-input"><SelectValue placeholder="كل الفئات" /></SelectTrigger>
                    <SelectContent><SelectItem value="">كل الفئات</SelectItem>{filterCategories.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filterClient">تصفية حسب العميل (واجهة فقط)</Label>
                  <Select value={selectedClientFilter} onValueChange={setSelectedClientFilter} dir="rtl">
                    <SelectTrigger id="filterClient" className="mt-1 bg-input/50 focus:bg-input"><SelectValue placeholder="كل العملاء" /></SelectTrigger>
                    <SelectContent><SelectItem value="">كل العملاء</SelectItem>{filterClients.map(client => <SelectItem key={client.value} value={client.value}>{client.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filterSupplier">تصفية حسب المورد (واجهة فقط)</Label>
                  <Select value={selectedSupplierFilter} onValueChange={setSelectedSupplierFilter} dir="rtl">
                    <SelectTrigger id="filterSupplier" className="mt-1 bg-input/50 focus:bg-input"><SelectValue placeholder="كل الموردين" /></SelectTrigger>
                    <SelectContent><SelectItem value="">كل الموردين</SelectItem>{filterSuppliers.map(sup => <SelectItem key={sup.value} value={sup.value}>{sup.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
            </div>
             <p className="text-xs text-muted-foreground lg:col-span-3 pt-2">ملاحظة: خيارات التصفية المتقدمة (حسب الفئة، العميل، المورد) هي واجهة فقط حالياً. تفعيلها بشكل كامل يتطلب ربطها بمنطق تجميع بيانات في الواجهة الخلفية.</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="font-headline text-xl text-foreground flex items-center">
                {reportType === "sales_summary" && <BarChartHorizontalBig className="ml-2 h-5 w-5 text-primary"/>}
                {reportType === "profit_loss" && <LineChartIcon className="ml-2 h-5 w-5 text-primary"/>}
                {reportType === "inventory_status" && <Package className="ml-2 h-5 w-5 text-primary"/>}
                {reportType === "customer_activity" && <Users className="ml-2 h-5 w-5 text-primary"/>}
                {!reportTypeLabelMap[reportType as keyof typeof reportTypeLabelMap] && <FileText className="ml-2 h-5 w-5 text-primary"/>}
                عرض التقرير: {reportTypeLabelMap[reportType as keyof typeof reportTypeLabelMap] || "الرجاء اختيار تقرير"}
            </CardTitle>
            <Button variant="ghost" size="icon"><Maximize className="h-5 w-5 text-muted-foreground"/></Button>
          </CardHeader>
          <CardContent className="min-h-[350px] p-2 pr-6">
            {renderChartForReportType()}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground border-t pt-3">
            البيانات المعروضة للفترة من {dateRange?.from ? format(dateRange.from, "PPP", {locale:arSA}) : "غير محدد"} إلى {dateRange?.to ? format(dateRange.to, "PPP", {locale:arSA}) : "غير محدد"}.
          </CardFooter>
        </Card>

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
                placeholder="مثال: 'بلغ صافي الدخل للربع الأول 150,000 ل.س مع إجمالي أصول 1.2 مليون ل.س...'"
                rows={6}
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
            <Button onClick={handleSubmitExplanation} disabled={isLoadingExplanation || !userQuestion.trim() || !reportText.trim()} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
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
    
