
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
import { Wand2, Copy, Check, FileText, Download, Filter, BarChartHorizontalBig, PieChartIcon, CalendarIcon, Maximize, TrendingUp, Users, Package, LineChartIcon, PackageSearch, DollarSign, AlertTriangle, TableIcon } from 'lucide-react';
import { explainFinancialReport, ExplainFinancialReportInput, ExplainFinancialReportOutput } from '@/ai/flows/financial-report-assistant';
import { useToast } from '@/hooks/use-toast';
import { format, parse, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { arSA } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Pie, Cell, LineChart, Line, PieChart as RechartsPieChart, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { cn } from "@/lib/utils";

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
  topProductSales: { label: "مبيعات المنتج (ل.س)", color: "hsl(var(--chart-2))"},
  totalPurchases: { label: "إجمالي المشتريات (ل.س)", color: "hsl(var(--chart-3))" },
  totalGrossProfit: { label: "إجمالي الربح (ل.س)", color: "hsl(var(--chart-2))" },
} satisfies React.ComponentProps<typeof ChartContainer>["config"];

interface SalesSummaryData { name: string; sales: number; } 
// interface ProfitLossData { month: string; revenue: number; cogs: number; expenses: number; netProfit: number; } // Kept for future reference
interface InventoryStatusData { name: string; products: number; } 
// interface CustomerActivityData { date: string; newCustomers: number; activeCustomers: number; totalOrders: number; } // Kept for future reference
interface AverageOrderValueData { name: string; averageOrderValue: number; }
// interface TopSellingProductData { name: string; totalSales: number; } // Will be derived from gross_profit_report_view
interface LowStockProductsData { count: number; }

// For Advanced Reports (assuming Supabase Views/Functions)
interface GrossProfitReportItem { product_id: string; product_name: string; sale_date: string; total_quantity_sold: number; total_revenue: number; total_cost_of_goods_sold: number; gross_profit: number; }
interface MonthlyPerformanceReportItem { period_label: string; total_sales: number; total_purchases: number; total_expenses: number; gross_profit: number; }
interface DetailedStockReportItem { product_id: string; product_name: string; category: string; current_stock: number; min_stock_level: number; last_purchase_price: number | null; average_purchase_price: number | null; }


const FinancialReportsPage = () => {
  const [reportText, setReportText] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: startOfMonth(subMonths(new Date(), 1)), 
    to: endOfMonth(new Date()),
  });
  const [reportType, setReportType] = useState<string>("gross_profit_report"); 
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>(ALL_ITEMS_FILTER_VALUE);
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>(ALL_ITEMS_FILTER_VALUE);
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>(ALL_ITEMS_FILTER_VALUE);
  
  const [isLoadingReportData, setIsLoadingReportData] = useState(false);
  const [salesSummaryData, setSalesSummaryData] = useState<SalesSummaryData[]>([]);
  const [inventoryStatusData, setInventoryStatusData] = useState<InventoryStatusData[]>([]);
  const [lowStockProductsData, setLowStockProductsData] = useState<LowStockProductsData | null>(null);
  const [averageOrderValueData, setAverageOrderValueData] = useState<AverageOrderValueData[]>([]);

  const [grossProfitReportData, setGrossProfitReportData] = useState<GrossProfitReportItem[]>([]);
  const [monthlyPerformanceData, setMonthlyPerformanceData] = useState<MonthlyPerformanceReportItem[]>([]);
  const [detailedStockReportData, setDetailedStockReportData] = useState<DetailedStockReportItem[]>([]);
  
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
    if (!user || !dateRange?.from) return;
    setIsLoadingReportData(true);
    setGrossProfitReportData([]);
    setMonthlyPerformanceData([]);
    setDetailedStockReportData([]);
    setSalesSummaryData([]);
    setInventoryStatusData([]);
    setLowStockProductsData(null);
    setAverageOrderValueData([]);
    
    const fromDateISO = dateRange.from.toISOString();
    const toDateISO = dateRange.to ? new Date(dateRange.to.setHours(23, 59, 59, 999)).toISOString() : new Date().toISOString();

    try {
      if (reportType === "gross_profit_report") {
        let query = supabase.from('gross_profit_per_product_view').select('*')
            .gte('sale_date', fromDateISO)
            .lte('sale_date', toDateISO);
        // Note: Category filter on this view would require the view to include product.category or join.
        // For now, this view as defined previously does not directly support category filtering without modification.
        const { data, error } = await query;
        if (error) throw error;
        setGrossProfitReportData(data || []);
        if (data?.length === 0) toast({ title: "لا توجد بيانات", description: "لم يتم العثور على بيانات لتقرير الربح الإجمالي للفترة المحددة."});
      } else if (reportType === "monthly_performance_summary") {
        const { data, error } = await supabase.from('monthly_performance_summary_view').select('*')
          .gte('period_label', format(dateRange.from, 'yyyy-MM')) 
          .lte('period_label', format(dateRange.to || new Date(), 'yyyy-MM'));
        if (error) throw error;
        setMonthlyPerformanceData(data || []);
        if (data?.length === 0) toast({ title: "لا توجد بيانات", description: "لم يتم العثور على بيانات لملخص الأداء الشهري للفترة المحددة."});
      } else if (reportType === "detailed_stock_report") {
        let query = supabase.from('detailed_stock_report_view').select('*');
        if (selectedCategoryFilter !== ALL_ITEMS_FILTER_VALUE) {
          query = query.eq('category', selectedCategoryFilter);
        }
        const { data, error } = await query;
        if (error) throw error;
        setDetailedStockReportData(data || []);
         if (data?.length === 0) toast({ title: "لا توجد بيانات", description: "لم يتم العثور على بيانات لتقرير المخزون التفصيلي."});
      } else if (reportType === "sales_summary_basic") { 
        let salesQuery = supabase.from('sales').select('sale_date, total_amount');
        if (fromDateISO) salesQuery = salesQuery.gte('sale_date', fromDateISO);
        if (toDateISO) salesQuery = salesQuery.lte('sale_date', toDateISO);
        if (selectedClientFilter !== ALL_ITEMS_FILTER_VALUE) {
            salesQuery = salesQuery.eq('client_id', selectedClientFilter);
        }
        const { data: salesResult, error: salesError } = await salesQuery;
        if (salesError) throw salesError;

        const monthlySales: {[key: string]: number} = {};
        salesResult?.forEach(sale => {
          const monthYearKey = format(new Date(sale.sale_date), "yyyy-MM");
          monthlySales[monthYearKey] = (monthlySales[monthYearKey] || 0) + sale.total_amount;
        });
        const formattedSalesData = Object.entries(monthlySales)
            .map(([monthYear, totalSales]) => ({
                name: format(parse(monthYear, "yyyy-MM", new Date()), "MMM yyyy", { locale: arSA }), 
                sales: totalSales,
            }))
            .sort((a,b) => parse(a.name, "MMM yyyy", new Date(), {locale: arSA}).getTime() - parse(b.name, "MMM yyyy", new Date(), {locale: arSA}).getTime()); 
        setSalesSummaryData(formattedSalesData);
        if (formattedSalesData.length === 0) toast({ title: "لا توجد بيانات مبيعات", description: "لم يتم العثور على مبيعات للفترة والمعايير المحددة."});
      } else if (reportType === "inventory_status_basic") { 
        let productsQuery = supabase.from('products').select('category, id');
        if (selectedCategoryFilter !== ALL_ITEMS_FILTER_VALUE) {
            productsQuery = productsQuery.eq('category', selectedCategoryFilter);
        }
        const { data: productsResult, error: productsError } = await productsQuery;
        if (productsError) throw productsError;

        const categoryData: {[key:string]: number} = {};
        productsResult?.forEach(p => {
            const cat = p.category || 'غير مصنف';
            categoryData[cat] = (categoryData[cat] || 0) + 1; 
        });
        setInventoryStatusData(Object.entries(categoryData).map(([name, count]) => ({name, products: count})));
        if (Object.keys(categoryData).length === 0) toast({ title: "لا توجد بيانات للمخزون", description: "لم يتم العثور على منتجات للمعايير المحددة."});

        const { data: lowStockResult, error: lowStockError, count: lowStockCount } = await supabase
            .from('products').select('id', { count: 'exact' }).lte('stock', supabase.sql`min_stock_level`);
        if(lowStockError) throw lowStockError;
        setLowStockProductsData({ count: lowStockCount || 0 });
      } else {
         toast({ title: "تنبيه", description: `التقرير المحدد (${reportTypeLabelMap[reportType as keyof typeof reportTypeLabelMap] || reportType}) قد يتطلب تكوين Views/Functions في Supabase لم يتم إنشاؤها بعد، أو أنه نوع تقرير أساسي سيتم تحميله الآن.`});
      }
    } catch (error: any) {
      toast({ title: `خطأ في جلب بيانات التقرير`, description: error.message, variant: 'destructive'});
    } finally {
      setIsLoadingReportData(false);
    }
  }, [user, reportType, dateRange, toast, selectedCategoryFilter, selectedClientFilter]); 

  useEffect(() => {
    if(user && dateRange?.from) fetchReportData();
  }, [fetchReportData, user, dateRange]);


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
      let headers: string[] = [];
      let fileName = `${reportType}_report_${format(new Date(), "yyyyMMddHHmmss")}.csv`;

      if (reportType === "gross_profit_report" && grossProfitReportData.length > 0) {
        dataToExport = grossProfitReportData;
        headers = ["اسم المنتج", "تاريخ البيع", "الكمية المباعة", "إجمالي الإيراد (ل.س)", "تكلفة البضاعة (ل.س)", "الربح الإجمالي (ل.س)"];
        dataToExport = grossProfitReportData.map(item => ({
          "اسم المنتج": item.product_name,
          "تاريخ البيع": format(new Date(item.sale_date), "yyyy/MM/dd"),
          "الكمية المباعة": item.total_quantity_sold,
          "إجمالي الإيراد (ل.س)": item.total_revenue.toFixed(2),
          "تكلفة البضاعة (ل.س)": item.total_cost_of_goods_sold.toFixed(2),
          "الربح الإجمالي (ل.س)": item.gross_profit.toFixed(2),
        }));
      } else if (reportType === "monthly_performance_summary" && monthlyPerformanceData.length > 0) {
        dataToExport = monthlyPerformanceData;
        headers = ["الفترة", "إجمالي المبيعات (ل.س)", "إجمالي المشتريات (ل.س)", "إجمالي المصروفات (ل.س)", "إجمالي الربح (ل.س)"];
         dataToExport = monthlyPerformanceData.map(item => ({
          "الفترة": item.period_label,
          "إجمالي المبيعات (ل.س)": item.total_sales.toFixed(2),
          "إجمالي المشتريات (ل.س)": item.total_purchases.toFixed(2),
          "إجمالي المصروفات (ل.س)": item.total_expenses.toFixed(2),
          "إجمالي الربح (ل.س)": item.gross_profit.toFixed(2),
        }));
      } else if (reportType === "detailed_stock_report" && detailedStockReportData.length > 0) {
        dataToExport = detailedStockReportData;
        headers = ["اسم المنتج", "الفئة", "المخزون الحالي", "الحد الأدنى", "آخر سعر شراء (ل.س)", "متوسط سعر شراء (ل.س)"];
         dataToExport = detailedStockReportData.map(item => ({
          "اسم المنتج": item.product_name,
          "الفئة": item.category,
          "المخزون الحالي": item.current_stock,
          "الحد الأدنى": item.min_stock_level,
          "آخر سعر شراء (ل.س)": item.last_purchase_price?.toFixed(2) ?? '-',
          "متوسط سعر شراء (ل.س)": item.average_purchase_price?.toFixed(2) ?? '-',
        }));
      } else if (reportType === "sales_summary_basic" && salesSummaryData.length > 0) {
        dataToExport = salesSummaryData;
        headers = ["الشهر", "إجمالي المبيعات (ل.س)"];
         dataToExport = salesSummaryData.map(item => ({
          "الشهر": item.name,
          "إجمالي المبيعات (ل.س)": item.sales.toFixed(2),
        }));
      } else if (reportType === "inventory_status_basic" && inventoryStatusData.length > 0) {
        dataToExport = inventoryStatusData; 
        headers = ["فئة المنتج", "عدد المنتجات"];
         dataToExport = inventoryStatusData.map(item => ({
          "فئة المنتج": item.name,
          "عدد المنتجات": item.products,
        }));
      }


      if (dataToExport.length > 0) {
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" // Added BOM for Excel UTF-8
            + headers.join(",") + "\n" 
            + dataToExport.map(row => headers.map(header => {
                const val = (row as any)[header]; // Use header directly as key
                return `"${String(val === null || val === undefined ? '' : val).replace(/"/g, '""')}"`;
            }).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
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
    gross_profit_report: "تقرير الربح الإجمالي (View)",
    monthly_performance_summary: "ملخص الأداء الشهري (View)",
    detailed_stock_report: "تقرير المخزون التفصيلي (View)",
    sales_summary_basic: "ملخص المبيعات (أساسي)",
    inventory_status_basic: "حالة المخزون (أساسي)",
  };

  const renderChartForReportType = () => {
    if (isLoadingReportData) {
      return <div className="flex justify-center items-center h-[350px]"><PackageSearch className="h-16 w-16 text-muted-foreground/30 animate-pulse" /></div>;
    }
    switch (reportType) {
      case "gross_profit_report":
        return grossProfitReportData.length > 0 ? (
          <ScrollArea className="h-[400px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المنتج</TableHead>
                  <TableHead>تاريخ البيع</TableHead>
                  <TableHead className="text-right">الكمية المباعة</TableHead>
                  <TableHead className="text-right">إجمالي الإيراد (ل.س)</TableHead>
                  <TableHead className="text-right">تكلفة البضاعة (ل.س)</TableHead>
                  <TableHead className="text-right">الربح الإجمالي (ل.س)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grossProfitReportData.map((item, index) => (
                  <TableRow key={`${item.product_id}-${item.sale_date}-${index}`}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{format(new Date(item.sale_date), "yyyy/MM/dd", { locale: arSA })}</TableCell>
                    <TableCell className="text-right">{item.total_quantity_sold}</TableCell>
                    <TableCell className="text-right">{item.total_revenue.toFixed(2)} ل.س</TableCell>
                    <TableCell className="text-right">{item.total_cost_of_goods_sold.toFixed(2)} ل.س</TableCell>
                    <TableCell className="text-right font-semibold">{item.gross_profit.toFixed(2)} ل.س</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : <p className="text-center text-muted-foreground p-4">لا توجد بيانات. تأكد من إنشاء الـ View المطلوب في Supabase (gross_profit_per_product_view).</p>;
      
      case "monthly_performance_summary":
        return monthlyPerformanceData.length > 0 ? (
           <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyPerformanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(value) => `${value.toLocaleString()} ل.س`} />
              <YAxis dataKey="period_label" type="category" width={100} />
              <Tooltip content={<ChartTooltipContent formatter={(value) => `${Number(value).toLocaleString()} ل.س`} />} />
              <Legend content={<ChartLegendContent />} />
              <Bar dataKey="total_sales" fill="var(--color-sales)" name={chartConfig.sales.label} radius={[0, 4, 4, 0]} />
              <Bar dataKey="gross_profit" fill="var(--color-totalGrossProfit)" name={chartConfig.totalGrossProfit.label} radius={[0, 4, 4, 0]} />
              <Bar dataKey="total_purchases" fill="var(--color-totalPurchases)" name={chartConfig.totalPurchases.label} radius={[0, 4, 4, 0]} />
              <Bar dataKey="total_expenses" fill="var(--color-expenses)" name={chartConfig.expenses.label} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-center text-muted-foreground p-4">لا توجد بيانات. تأكد من إنشاء الـ View المطلوب في Supabase (monthly_performance_summary_view).</p>;

      case "detailed_stock_report":
        return detailedStockReportData.length > 0 ? (
           <ScrollArea className="h-[400px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المنتج</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead className="text-right">المخزون الحالي</TableHead>
                  <TableHead className="text-right">الحد الأدنى</TableHead>
                  <TableHead className="text-right">آخر سعر شراء (ل.س)</TableHead>
                  <TableHead className="text-right">متوسط سعر شراء (ل.س)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailedStockReportData.map(item => (
                  <TableRow key={item.product_id}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">{item.current_stock}</TableCell>
                    <TableCell className="text-right">{item.min_stock_level}</TableCell>
                    <TableCell className="text-right">{item.last_purchase_price?.toFixed(2) ?? '-'} ل.س</TableCell>
                    <TableCell className="text-right">{item.average_purchase_price?.toFixed(2) ?? '-'} ل.س</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : <p className="text-center text-muted-foreground p-4">لا توجد بيانات. تأكد من إنشاء الـ View المطلوب في Supabase (detailed_stock_report_view).</p>;
      
      case "sales_summary_basic":
        return salesSummaryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesSummaryData} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
              <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => `${value.toLocaleString()} ل.س`}/>
              <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipContent formatter={(value) => `${Number(value).toLocaleString()} ل.س`} />} cursor={{fill: 'hsl(var(--muted))'}}/>
              <Legend content={<ChartLegendContent />}/>
              <Bar dataKey="sales" fill="var(--color-sales)" radius={[0, 4, 4, 0]} name={chartConfig.sales.label} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-center text-muted-foreground p-4">لا توجد بيانات لعرضها لملخص المبيعات للفترة والمعايير المحددة.</p>;
      
      case "inventory_status_basic":
        return (
            <div className="space-y-6">
                {inventoryStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                    <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie data={inventoryStatusData} dataKey="products" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {inventoryStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={MOCK_PIE_COLORS[index % MOCK_PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Legend content={<ChartLegendContent nameKey="name" />} />
                    </RechartsPieChart>
                </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground p-4">لا توجد بيانات لعرضها لتوزيع المنتجات حسب الفئة.</p>}
                {lowStockProductsData && (
                    <Card className="bg-destructive/10 border-destructive">
                        <CardHeader className="flex-row items-center justify-between pb-2">
                             <CardTitle className="text-lg font-headline text-destructive">منتجات منخفضة المخزون</CardTitle>
                             <AlertTriangle className="h-6 w-6 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-destructive text-center">
                                {lowStockProductsData.count}
                            </div>
                            <p className="text-xs text-destructive text-center mt-1">منتجات وصلت أو قلت عن الحد الأدنى للمخزون.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
      default:
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                <FileText className="w-20 h-20 mb-4 text-muted-foreground/30"/>
                <p className="text-lg">اختر نوع تقرير لعرض البيانات.</p>
                <p className="text-sm">إذا اخترت تقريراً متقدماً، تأكد من أنك قمت بإنشاء الـ Views أو Functions المطلوبة في Supabase كما هو موضح في التعليقات.</p>
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
           <Button variant="outline" onClick={handleExportReport} disabled={isLoadingReportData}>
            <Download className="ml-2 h-4 w-4" /> تصدير التقرير الحالي
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-foreground flex items-center"><Filter className="ml-2 h-5 w-5 text-primary"/>خيارات التصفية وعرض التقرير</CardTitle>
            <CardDescription>
              حدد نوع التقرير والفترة الزمنية. التقارير التي تستخدم (View) تستدعي طرق عرض مجهزة مسبقاً في Supabase.
            </CardDescription>
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
                    className={cn("w-full justify-start text-right font-normal mt-1 bg-input/50 hover:bg-input/70", !dateRange && "text-muted-foreground")}
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
            <Button onClick={fetchReportData} className="bg-primary hover:bg-primary/90 text-primary-foreground md:mt-0 mt-4 md:col-span-1 lg:col-span-1 self-end" disabled={isLoadingReportData || !dateRange?.from}>
              {isLoadingReportData ? "جاري التحميل..." : "تطبيق وعرض التقرير"}
            </Button>
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 border-t pt-4">
                <div>
                  <Label htmlFor="filterCategory">تصفية حسب الفئة (تؤثر على "تقرير المخزون" و "حالة المخزون الأساسي")</Label>
                  <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter} dir="rtl">
                    <SelectTrigger id="filterCategory" className="mt-1 bg-input/50 focus:bg-input"><SelectValue placeholder="كل الفئات" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_ITEMS_FILTER_VALUE}>كل الفئات</SelectItem>
                      {filterCategories.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filterClient">تصفية حسب العميل (تؤثر على "ملخص المبيعات الأساسي")</Label>
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
                  <Select value={selectedSupplierFilter} onValueChange={setSelectedSupplierFilter} dir="rtl" disabled>
                    <SelectTrigger id="filterSupplier" className="mt-1 bg-input/50 focus:bg-input"><SelectValue placeholder="كل الموردين" /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value={ALL_ITEMS_FILTER_VALUE}>كل الموردين</SelectItem>
                       {filterSuppliers.map(sup => <SelectItem key={sup.value} value={sup.value}>{sup.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="font-headline text-xl text-foreground flex items-center">
                {reportType.includes("summary_basic") && <BarChartHorizontalBig className="ml-2 h-5 w-5 text-primary"/>}
                {reportType.includes("profit") && <DollarSign className="ml-2 h-5 w-5 text-primary"/>}
                {reportType.includes("stock") && <Package className="ml-2 h-5 w-5 text-primary"/>}
                {reportType.includes("performance") && <TrendingUp className="ml-2 h-5 w-5 text-primary"/>}
                {!Object.keys(reportTypeLabelMap).includes(reportType) && <FileText className="ml-2 h-5 w-5 text-primary"/>}
                عرض التقرير: {reportTypeLabelMap[reportType as keyof typeof reportTypeLabelMap] || "الرجاء اختيار تقرير"}
            </CardTitle>
            <Button variant="ghost" size="icon"><Maximize className="h-5 w-5 text-muted-foreground"/></Button>
          </CardHeader>
          <CardContent className="min-h-[350px] p-2 pr-6">
            <ChartContainer config={chartConfig} className="w-full h-full">
              {renderChartForReportType()}
            </ChartContainer>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground border-t pt-3">
            البيانات المعروضة للفترة من {dateRange?.from ? format(dateRange.from, "PPP", {locale:arSA}) : "غير محدد"} إلى {dateRange?.to ? format(dateRange.to, "PPP", {locale:arSA}) : "غير محدد"}.
            {selectedCategoryFilter !== ALL_ITEMS_FILTER_VALUE && ` الفئة: ${filterCategories.find(c=>c.value===selectedCategoryFilter)?.label || selectedCategoryFilter}.`}
            {selectedClientFilter !== ALL_ITEMS_FILTER_VALUE && ` العميل: ${filterClients.find(c=>c.value===selectedClientFilter)?.label || selectedClientFilter}.`}
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
    
// SQL Views Reminder:
// gross_profit_per_product_view
// monthly_performance_summary_view
// detailed_stock_report_view
// Ensure these views are created in your Supabase project as previously discussed.
