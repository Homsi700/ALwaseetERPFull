
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
import { Wand2, Copy, Check, FileText, Download, Filter, BarChartHorizontalBig, PieChartIcon, CalendarIcon, Maximize, TrendingUp, Users, Package, LineChartIcon, PackageSearch, DollarSign } from 'lucide-react';
import { explainFinancialReport, ExplainFinancialReportInput, ExplainFinancialReportOutput } from '@/ai/flows/financial-report-assistant';
import { useToast } from '@/hooks/use-toast';
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Pie, Cell, LineChart, Line, PieChart as RechartsPieChart } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

const MOCK_PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
const ALL_ITEMS_FILTER_VALUE = "__ALL_ITEMS_FILTER_VALUE__";

const chartConfig = {
  sales: { label: "المبيعات (ل.س)", color: "hsl(var(--chart-1))" },
  profit: { label: "الأرباح (ل.س)", color: "hsl(var(--chart-2))" }, 
  costs: { label: "التكاليف (ل.س)", color: "hsl(var(--chart-3))" }, 
  revenue: { label: "الإيرادات (ل.س)", color: "hsl(var(--chart-1))" }, 
  cogs: { label: "تكلفة البضاعة المباعة (ل.س)", color: "hsl(var(--chart-2))" }, 
  expenses: { label: "المصروفات (ل.س)", color: "hsl(var(--chart-4))" }, 
  netProfit: { label: "صافي الربح (ل.س)", color: "hsl(var(--chart-5))" }, 
  inventoryValue: { label: "قيمة المخزون (ل.س)", color: "hsl(var(--chart-1))"},
  products: { label: "عدد المنتجات", color: "hsl(var(--chart-3))" }, 
  newCustomers: { label: "عملاء جدد", color: "hsl(var(--chart-1))"}, 
  activeCustomers: { label: "عملاء نشطون", color: "hsl(var(--chart-2))"}, 
  productCategory: {label: "فئة المنتج", color: "hsl(var(--chart-3))"},
  averageOrderValue: { label: "متوسط قيمة الطلب (ل.س)", color: "hsl(var(--chart-4))"},
} satisfies React.ComponentProps<typeof ChartContainer>["config"];

interface SalesSummaryData { name: string; sales: number; } 
interface ProfitLossData { month: string; revenue: number; cogs: number; expenses: number; netProfit: number; } 
interface InventoryStatusData { name: string; products: number; } 
interface CustomerActivityData { date: string; newCustomers: number; activeCustomers: number; totalOrders: number; } 
interface AverageOrderValueData { name: string; averageOrderValue: number; }


const FinancialReportsPage = () => {
  const [reportText, setReportText] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() -1 , 1), 
    to: new Date(),
  });
  const [reportType, setReportType] = useState<string>("sales_summary");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("");
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>("");
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>("");
  
  const [isLoadingReportData, setIsLoadingReportData] = useState(false);
  const [salesSummaryData, setSalesSummaryData] = useState<SalesSummaryData[]>([]);
  const [profitLossData, setProfitLossData] = useState<ProfitLossData[]>([]); 
  const [inventoryStatusData, setInventoryStatusData] = useState<InventoryStatusData[]>([]);
  const [customerActivityData, setCustomerActivityData] = useState<CustomerActivityData[]>([]); 
  const [averageOrderValueData, setAverageOrderValueData] = useState<AverageOrderValueData[]>([]);
  
  const [filterCategories, setFilterCategories] = useState<{value: string, label: string}[]>([]);
  const [filterClients, setFilterClients] = useState<{value: string, label: string}[]>([]);
  const [filterSuppliers, setFilterSuppliers] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    const fetchFilterData = async () => {
      if (!user) return;
      try {
        const { data: categoriesData, error: catError } = await supabase.from('products').select('category').distinct();
        if (catError) throw catError;
        setFilterCategories(categoriesData.map((c:any) => ({ value: c.category, label: c.category })));

        const { data: clientsData, error: cliError } = await supabase.from('clients').select('id, name');
        if (cliError) throw cliError;
        setFilterClients(clientsData.map((c:any) => ({ value: c.id, label: c.name })));
        
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
        let query = supabase.from('sales').select('sale_date, total_amount');
        if (dateRange?.from) query = query.gte('sale_date', fromDate);
        if (dateRange?.to) query = query.lte('sale_date', toDate);
        
        // Apply client filter if selected and not "ALL"
        if (selectedClientFilter && selectedClientFilter !== ALL_ITEMS_FILTER_VALUE) {
            query = query.eq('client_id', selectedClientFilter);
        }

        const { data, error } = await query;
        if (error) throw error;

        const monthlySales: {[key: string]: number} = {};
        data?.forEach(sale => {
          const month = format(new Date(sale.sale_date), "yyyy-MM", { locale: arSA });
          monthlySales[month] = (monthlySales[month] || 0) + sale.total_amount;
        });
        
        const formattedSalesData = Object.entries(monthlySales)
            .map(([monthYear, totalSales]) => ({
                name: format(new Date(monthYear + '-01'), "MMM yyyy", { locale: arSA }), 
                sales: totalSales,
            }))
            .sort((a,b) => new Date(a.name.split(" ")[1] + "-" + (arSA.localize?.month(arSA.localize.monthName({width:'abbreviated'}).indexOf(a.name.split(" ")[0])) || 0) + "-01").getTime() - new Date(b.name.split(" ")[1] + "-" + (arSA.localize?.month(arSA.localize.monthName({width:'abbreviated'}).indexOf(b.name.split(" ")[0])) || 0) + "-01").getTime()); 

        setSalesSummaryData(formattedSalesData);
        if (formattedSalesData.length === 0) {
            toast({ title: "لا توجد بيانات مبيعات", description: "لم يتم العثور على مبيعات للفترة والمعايير المحددة."});
        }
      } catch (error: any) {
        toast({ title: `خطأ في جلب ملخص المبيعات`, description: error.message, variant: 'destructive'});
        setSalesSummaryData([]);
      }
    } else if (reportType === "inventory_status") {
       try {
        let query = supabase.from('products').select('category, id');
        if (selectedCategoryFilter && selectedCategoryFilter !== ALL_ITEMS_FILTER_VALUE) {
            query = query.eq('category', selectedCategoryFilter);
        }
        const { data, error } = await query;
        
        if (error) throw error;
        const categoryData: {[key:string]: number} = {};
        data?.forEach(p => {
            const cat = p.category || 'غير مصنف';
            categoryData[cat] = (categoryData[cat] || 0) + 1; 
        });
        setInventoryStatusData(Object.entries(categoryData).map(([name, count]) => ({name, products: count})));
        if (Object.keys(categoryData).length === 0) {
             toast({ title: "لا توجد بيانات للمخزون", description: "لم يتم العثور على منتجات للمعايير المحددة."});
        }
       } catch (error: any) {
        toast({ title: `خطأ في جلب حالة المخزون`, description: error.message, variant: 'destructive'});
        setInventoryStatusData([]);
       }
    } else if (reportType === "average_order_value") {
        try {
            let query = supabase.from('sales').select('sale_date, total_amount');
            if (dateRange?.from) query = query.gte('sale_date', fromDate);
            if (dateRange?.to) query = query.lte('sale_date', toDate);
            
            if (selectedClientFilter && selectedClientFilter !== ALL_ITEMS_FILTER_VALUE) {
                query = query.eq('client_id', selectedClientFilter);
            }

            const { data, error } = await query;
            if (error) throw error;

            if (data && data.length > 0) {
                const totalSalesAmount = data.reduce((sum, sale) => sum + sale.total_amount, 0);
                const numberOfSales = data.length;
                const avgOrderValue = totalSalesAmount / numberOfSales;
                setAverageOrderValueData([{ name: "الفترة المحددة", averageOrderValue: avgOrderValue}]);
            } else {
                setAverageOrderValueData([]);
                 toast({ title: "لا توجد بيانات لحساب متوسط قيمة الطلب", description: "لم يتم العثور على مبيعات للفترة والمعايير المحددة."});
            }
        } catch (error: any) {
            toast({ title: `خطأ في جلب متوسط قيمة الطلب`, description: error.message, variant: 'destructive'});
            setAverageOrderValueData([]);
        }
    } else {
        // Mock data for other report types, with a toast indicating they are under development
        setProfitLossData([ 
            { month: 'يناير', revenue: 5000, cogs: 2000, expenses: 1000, netProfit: 2000 },
            { month: 'فبراير', revenue: 6000, cogs: 2500, expenses: 1200, netProfit: 2300 },
        ]);
        setCustomerActivityData([ 
            { date: '2024-01-01', newCustomers: 5, activeCustomers: 50, totalOrders: 70 },
            { date: '2024-02-01', newCustomers: 8, activeCustomers: 55, totalOrders: 80 },
        ]);
        if(reportType !== "sales_summary") setSalesSummaryData([]);
        if(reportType !== "inventory_status") setInventoryStatusData([]);
        if(reportType !== "average_order_value") setAverageOrderValueData([]);
        toast({ title: "التقرير قيد التطوير", description: `التقارير المتقدمة مثل "${reportTypeLabelMap[reportType as keyof typeof reportTypeLabelMap]}" تتطلب تجميع بيانات معقد. يتم عرض بيانات وهمية أو مبسطة حالياً.`});
    }

    setIsLoadingReportData(false);
  }, [user, reportType, dateRange, toast, selectedCategoryFilter, selectedClientFilter, selectedSupplierFilter]); // Added selectedClientFilter and selectedSupplierFilter

  useEffect(() => {
    if(user) fetchReportData();
  }, [fetchReportData, user]);


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
    toast({ title: "بدء تصدير التقرير", description: `جاري تجهيز تقرير "${reportTypeLabelMap[reportType as keyof typeof reportTypeLabelMap] || reportType}" للتصدير...` });
    setTimeout(() => {
      let dataToExport: any[] = [];
      if (reportType === "sales_summary") dataToExport = salesSummaryData;
      else if (reportType === "inventory_status") dataToExport = inventoryStatusData;
      else if (reportType === "average_order_value") dataToExport = averageOrderValueData;
      else if (reportType === "profit_loss") dataToExport = profitLossData; // Example for mock data export
      else if (reportType === "customer_activity") dataToExport = customerActivityData; // Example for mock data export


      if (dataToExport.length > 0) {
        const csvContent = "data:text/csv;charset=utf-8," 
            + Object.keys(dataToExport[0]).join(",") + "\n" 
            + dataToExport.map(e => Object.values(e).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${reportType}_report.csv`);
        document.body.appendChild(link); 
        link.click();
        document.body.removeChild(link);
        toast({ title: "اكتمل التصدير", description: "تم تصدير التقرير كملف CSV." });
      } else {
        toast({ title: "فشل التصدير", description: "لا توجد بيانات لتصديرها لهذا التقرير.", variant: "destructive" });
      }
    }, 1000);
  };

  const reportTypeLabelMap: {[key: string]: string} = {
    sales_summary: "ملخص المبيعات",
    profit_loss: "الأرباح والخسائر (مثال)",
    inventory_status: "حالة المخزون (حسب الفئة)",
    customer_activity: "نشاط العملاء (مثال)",
    average_order_value: "متوسط قيمة الطلب"
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
            </BarChart>
          </ChartContainer>
        ) : <p className="text-center text-muted-foreground p-4">لا توجد بيانات لعرضها لملخص المبيعات للفترة والمعايير المحددة.</p>;
      case "profit_loss":
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
        ) : <p className="text-center text-muted-foreground p-4">مثال لتقرير الأرباح والخسائر. (يتطلب تجميع بيانات متقدم من الخلفية)</p>;
      case "inventory_status":
        return inventoryStatusData.length > 0 ? (
          <ChartContainer config={chartConfig} className="w-full h-full">
            <RechartsPieChart>
              <Tooltip content={<ChartTooltipContent nameKey="name" />} />
              <Pie data={inventoryStatusData} dataKey="products" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                 {inventoryStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={MOCK_PIE_COLORS[index % MOCK_PIE_COLORS.length]} />
                 ))}
              </Pie>
              <Legend content={<ChartLegendContent nameKey="name" />} />
            </RechartsPieChart>
          </ChartContainer>
        ) : <p className="text-center text-muted-foreground p-4">لا توجد بيانات لعرضها لحالة المخزون للمعايير المحددة.</p>;
      case "customer_activity":
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
        ) : <p className="text-center text-muted-foreground p-4">مثال لتقرير نشاط العملاء. (يتطلب تجميع بيانات متقدم من الخلفية)</p>;
      case "average_order_value":
        return averageOrderValueData.length > 0 ? (
            <Card className="text-center p-6">
                <CardTitle className="text-xl font-headline text-primary mb-2">متوسط قيمة الطلب</CardTitle>
                <div className="text-4xl font-bold text-foreground">
                    {averageOrderValueData[0].averageOrderValue.toFixed(2)} ل.س
                </div>
                <CardDescription className="mt-1">خلال الفترة والمعايير المحددة</CardDescription>
            </Card>
        ) : <p className="text-center text-muted-foreground p-4">لا توجد بيانات كافية لعرض متوسط قيمة الطلب للفترة والمعايير المحددة.</p>;
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
            <Download className="ml-2 h-4 w-4" /> تصدير التقرير الحالي
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
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 border-t pt-4">
                <div>
                  <Label htmlFor="filterCategory">تصفية حسب الفئة (تؤثر على تقرير حالة المخزون)</Label>
                  <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter} dir="rtl">
                    <SelectTrigger id="filterCategory" className="mt-1 bg-input/50 focus:bg-input"><SelectValue placeholder="كل الفئات" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_ITEMS_FILTER_VALUE}>كل الفئات</SelectItem>
                      {filterCategories.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filterClient">تصفية حسب العميل (تؤثر على ملخص المبيعات ومتوسط قيمة الطلب)</Label>
                  <Select value={selectedClientFilter} onValueChange={setSelectedClientFilter} dir="rtl">
                    <SelectTrigger id="filterClient" className="mt-1 bg-input/50 focus:bg-input"><SelectValue placeholder="كل العملاء" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_ITEMS_FILTER_VALUE}>كل العملاء</SelectItem>
                      {filterClients.map(client => <SelectItem key={client.value} value={client.value}>{client.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filterSupplier">تصفية حسب المورد (واجهة فقط حالياً)</Label>
                  <Select value={selectedSupplierFilter} onValueChange={setSelectedSupplierFilter} dir="rtl">
                    <SelectTrigger id="filterSupplier" className="mt-1 bg-input/50 focus:bg-input"><SelectValue placeholder="كل الموردين" /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value={ALL_ITEMS_FILTER_VALUE}>كل الموردين</SelectItem>
                       {filterSuppliers.map(sup => <SelectItem key={sup.value} value={sup.value}>{sup.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
            </div>
             <p className="text-xs text-muted-foreground lg:col-span-3 pt-2">ملاحظة: تصفية المورد هي واجهة فقط حالياً. تفعيل التصفية الكاملة يتطلب ربطها بمنطق تجميع بيانات في الواجهة الخلفية.</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="font-headline text-xl text-foreground flex items-center">
                {reportType === "sales_summary" && <BarChartHorizontalBig className="ml-2 h-5 w-5 text-primary"/>}
                {reportType === "profit_loss" && <LineChartIcon className="ml-2 h-5 w-5 text-primary"/>}
                {reportType === "inventory_status" && <Package className="ml-2 h-5 w-5 text-primary"/>}
                {reportType === "customer_activity" && <Users className="ml-2 h-5 w-5 text-primary"/>}
                {reportType === "average_order_value" && <DollarSign className="ml-2 h-5 w-5 text-primary"/>}
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
            {selectedCategoryFilter && selectedCategoryFilter !== ALL_ITEMS_FILTER_VALUE && ` الفئة: ${filterCategories.find(c=>c.value===selectedCategoryFilter)?.label || selectedCategoryFilter}.`}
            {selectedClientFilter && selectedClientFilter !== ALL_ITEMS_FILTER_VALUE && ` العميل: ${filterClients.find(c=>c.value===selectedClientFilter)?.label || selectedClientFilter}.`}
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
    

