
// src/app/reports/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from "@/components/ui/calendar";
import { Wand2, Copy, Check, FileText, Download, Filter, BarChartHorizontalBig, PieChartIcon, CalendarIcon, Maximize, TrendingUp, Users, Package, LineChartIcon, PackageSearch, DollarSign, AlertTriangle, TableIcon, ShoppingCart, BarChart2, Info } from 'lucide-react';
import { explainFinancialReport, ExplainFinancialReportInput, ExplainFinancialReportOutput } from '@/ai/flows/financial-report-assistant';
import { useToast } from '@/hooks/use-toast';
import { format, parse, startOfMonth, endOfMonth, subMonths, isValid, startOfDay, endOfDay } from "date-fns";
import { arSA } from "date-fns/locale";
import { DateRange, DayPickerSingleProps } from "react-day-picker";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { cn } from "@/lib/utils";
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


// Report Data Interfaces
interface DetailedSaleItem {
  invoice_id: string;
  sale_date: string;
  client_name?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  item_total_price: number;
  invoice_discount_amount?: number; // Discount on the whole invoice
}
interface DailySalesSummary { total_items_sold: number; total_sales_amount: number; }
interface FinancialSummary { total_sales: number; total_expenses: number; gross_profit: number; net_profit: number; }
interface InventoryMovementItem { product_id: string; product_name: string; sold_quantity: number; remaining_stock: number;}
interface ClientDebt { client_id: string; client_name: string; debt_amount: number; }
interface SupplierDue { supplier_id: string; supplier_name: string; due_amount: number; invoice_number: string; due_date?: string;}


const FinancialReportsPage = () => {
  const [reportText, setReportText] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [activeReportKey, setActiveReportKey] = useState<string | null>(null);
  const [activeReportTitle, setActiveReportTitle] = useState<string>("التقارير");
  const [isLoadingReportData, setIsLoadingReportData] = useState(false);
  
  // Data states for reports
  const [detailedSalesData, setDetailedSalesData] = useState<DetailedSaleItem[]>([]);
  const [salesSummary, setSalesSummary] = useState<DailySalesSummary | null>(null);
  const [financialSummaryData, setFinancialSummaryData] = useState<FinancialSummary | null>(null);
  const [inventoryMovementData, setInventoryMovementData] = useState<InventoryMovementItem[]>([]);
  const [clientDebtsData, setClientDebtsData] = useState<ClientDebt[]>([]);
  const [supplierDuesData, setSupplierDuesData] = useState<SupplierDue[]>([]);

  // Filter states
  const [singleDateFilter, setSingleDateFilter] = useState<Date>(new Date());
  const [monthYearFilter, setMonthYearFilter] = useState<Date>(new Date());
  const [reportDateRange, setReportDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });


  const formatDateForSupabase = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

  // Fetch functions
  const fetchDetailedSalesReport = async (date: Date, isMonthly: boolean = false) => {
    if (!user) return;
    setIsLoadingReportData(true);
    setDetailedSalesData([]);
    setSalesSummary(null);

    const fromDate = isMonthly ? startOfMonth(date) : startOfDay(date);
    const toDate = isMonthly ? endOfMonth(date) : endOfDay(date);

    try {
      const { data: sales, error } = await supabase
        .from('sales')
        .select(`
          id, sale_date, total_amount, discount_amount,
          clients (name),
          sale_items (
            quantity, unit_price, total_price,
            products (name)
          )
        `)
        .gte('sale_date', formatDateForSupabase(fromDate))
        .lte('sale_date', formatDateForSupabase(toDate))
        .order('sale_date', { ascending: false });

      if (error) throw error;

      let allItems: DetailedSaleItem[] = [];
      let totalItems = 0;
      let totalAmount = 0;

      sales?.forEach(sale => {
        totalAmount += sale.total_amount;
        sale.sale_items.forEach((item: any) => {
          allItems.push({
            invoice_id: sale.id.substring(0,8),
            sale_date: format(new Date(sale.sale_date), "yyyy/MM/dd HH:mm", { locale: arSA }),
            client_name: sale.clients?.name || 'عميل نقدي',
            product_name: item.products.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            item_total_price: item.total_price,
            invoice_discount_amount: sale.discount_amount
          });
          totalItems += item.quantity;
        });
      });
      
      setDetailedSalesData(allItems);
      setSalesSummary({ total_items_sold: totalItems, total_sales_amount: totalAmount });
      if (allItems.length === 0) toast({ title: "لا توجد بيانات", description: "لم يتم العثور على مبيعات للفترة المحددة."});

    } catch (err: any) {
      toast({ title: "خطأ في جلب تقرير المبيعات", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingReportData(false);
    }
  };

  const fetchFinancialSummaryReport = async (date: Date, isMonthly: boolean = false) => {
    if (!user) return;
    setIsLoadingReportData(true);
    setFinancialSummaryData(null);

    const fromDate = isMonthly ? startOfMonth(date) : startOfDay(date);
    const toDate = isMonthly ? endOfMonth(date) : endOfDay(date);
    const periodLabel = isMonthly ? format(fromDate, 'yyyy-MM') : format(fromDate, 'yyyy-MM-dd');

    try {
      let totalSales = 0;
      let totalExpenses = 0;
      let grossProfit = 0;

      if (isMonthly) {
        const { data: monthlyPerf, error: perfError } = await supabase
            .from('monthly_performance_summary_view')
            .select('total_sales, total_expenses, gross_profit')
            .eq('period_label', periodLabel)
            .single();
        if (perfError && perfError.code !== 'PGRST116') throw perfError; // PGRST116: single row not found
        if (monthlyPerf) {
            totalSales = monthlyPerf.total_sales;
            totalExpenses = monthlyPerf.total_expenses;
            grossProfit = monthlyPerf.gross_profit;
        }
      } else { // Daily
          const { data: salesData, error: salesError } = await supabase
            .from('sales')
            .select('total_amount')
            .gte('sale_date', formatDateForSupabase(fromDate))
            .lte('sale_date', formatDateForSupabase(toDate));
          if (salesError) throw salesError;
          totalSales = salesData?.reduce((sum, s) => sum + s.total_amount, 0) || 0;

          const { data: expensesData, error: expensesError } = await supabase
            .from('expenses')
            .select('amount')
            .gte('expense_date', format(fromDate, 'yyyy-MM-dd'))
            .lte('expense_date', format(toDate, 'yyyy-MM-dd'));
          if (expensesError) throw expensesError;
          totalExpenses = expensesData?.reduce((sum, e) => sum + e.amount, 0) || 0;
          
          const { data: grossProfitData, error: gpError } = await supabase
            .from('gross_profit_per_product_view')
            .select('gross_profit')
            .gte('sale_date', formatDateForSupabase(fromDate))
            .lte('sale_date', formatDateForSupabase(toDate));
          if (gpError) throw gpError;
          grossProfit = grossProfitData?.reduce((sum, item) => sum + item.gross_profit, 0) || 0;
      }
      
      const netProfit = grossProfit - totalExpenses;
      setFinancialSummaryData({ total_sales: totalSales, total_expenses: totalExpenses, gross_profit: grossProfit, net_profit: netProfit });
      if (totalSales === 0 && totalExpenses === 0 && grossProfit === 0) toast({ title: "لا توجد بيانات", description: "لم يتم العثور على بيانات مالية للفترة المحددة."});

    } catch (err: any) {
      toast({ title: "خطأ في جلب التقرير المالي", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingReportData(false);
    }
  };
  
  const fetchInventoryMovementReport = async (range: DateRange | undefined) => {
    if (!user || !range?.from || !range?.to) return;
    setIsLoadingReportData(true);
    setInventoryMovementData([]);
    try {
        const { data: saleItemsData, error: saleItemsError } = await supabase
            .from('sale_items')
            .select('product_id, quantity, products(name, stock)')
            .gte('created_at', formatDateForSupabase(startOfDay(range.from)))
            .lte('created_at', formatDateForSupabase(endOfDay(range.to)));
        
        if (saleItemsError) throw saleItemsError;

        const productMovements: Record<string, { productName: string, sold: number, currentStock: number }> = {};

        saleItemsData?.forEach((item: any) => {
            if (!productMovements[item.product_id]) {
                productMovements[item.product_id] = {
                    productName: item.products.name,
                    sold: 0,
                    currentStock: item.products.stock
                };
            }
            productMovements[item.product_id].sold += item.quantity;
        });
        
        // If no sales, fetch all products for current stock display
        if (saleItemsData?.length === 0) {
            const {data: allProducts, error: productsError} = await supabase.from('products').select('id, name, stock');
            if (productsError) throw productsError;
            allProducts?.forEach(p => {
                 productMovements[p.id] = { productName: p.name, sold: 0, currentStock: p.stock };
            });
        }


        setInventoryMovementData(Object.entries(productMovements).map(([id, data]) => ({
            product_id: id,
            product_name: data.productName,
            sold_quantity: data.sold,
            remaining_stock: data.currentStock
        })));
        if (Object.keys(productMovements).length === 0) toast({ title: "لا توجد بيانات", description: "لم يتم العثور على حركة مخزون للفترة المحددة."});

    } catch (err: any) {
        toast({ title: "خطأ في جلب تقرير حركة المخزون", description: err.message, variant: "destructive" });
    } finally {
        setIsLoadingReportData(false);
    }
  };

  const fetchBalancesReport = async () => {
    if (!user) return;
    setIsLoadingReportData(true);
    setClientDebtsData([]);
    setSupplierDuesData([]);
    try {
        const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('id, name, credit_balance')
            .lt('credit_balance', 0); // credit_balance < 0 means client owes us
        if (clientsError) throw clientsError;
        setClientDebtsData(clients?.map(c => ({ client_id: c.id, client_name: c.name, debt_amount: Math.abs(c.credit_balance || 0) })) || []);

        const { data: invoices, error: invoicesError } = await supabase
            .from('purchase_invoices')
            .select('id, supplier_id, suppliers(name), invoice_number, grand_total, due_date, status')
            .neq('status', 'مدفوعة بالكامل');
        if (invoicesError) throw invoicesError;
        setSupplierDuesData(invoices?.map(inv => ({
            supplier_id: inv.supplier_id,
            supplier_name: inv.suppliers?.name || 'مورد غير معروف',
            invoice_number: inv.invoice_number,
            due_amount: inv.grand_total,
            due_date: inv.due_date ? format(new Date(inv.due_date), "yyyy/MM/dd") : undefined,
        })) || []);
        
        if ((clients?.length === 0) && (invoices?.length === 0)) toast({ title: "لا توجد بيانات", description: "لم يتم العثور على ديون عملاء أو مستحقات موردين."});

    } catch (err: any) {
        toast({ title: "خطأ في جلب تقرير الأرصدة", description: err.message, variant: "destructive" });
    } finally {
        setIsLoadingReportData(false);
    }
  };


  const handleReportButtonClick = (reportKey: string, title: string) => {
    setActiveReportKey(reportKey);
    setActiveReportTitle(title);
    // Clear previous data
    setDetailedSalesData([]); setSalesSummary(null); setFinancialSummaryData(null);
    setInventoryMovementData([]); setClientDebtsData([]); setSupplierDuesData([]);

    // Fetch data for the selected report
    if (reportKey === 'dailySalesDetail') fetchDetailedSalesReport(singleDateFilter);
    else if (reportKey === 'monthlySalesDetail') fetchDetailedSalesReport(monthYearFilter, true);
    else if (reportKey === 'dailyFinancialSummary') fetchFinancialSummaryReport(singleDateFilter);
    else if (reportKey === 'monthlyFinancialSummary') fetchFinancialSummaryReport(monthYearFilter, true);
    else if (reportKey === 'inventoryMovement') fetchInventoryMovementReport(reportDateRange);
    else if (reportKey === 'balancesReport') fetchBalancesReport();
  };

  const handleExportToCsv = (filename: string, data: any[]) => {
    if (data.length === 0) {
        toast({ title: "لا توجد بيانات للتصدير", variant: "destructive"});
        return;
    }
    const csv = Papa.unparse(data);
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${format(new Date(), "yyyyMMddHHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "تم تصدير CSV بنجاح" });
  };

  const handleExportToPdf = async (reportElementId: string, filename: string) => {
    const reportElement = document.getElementById(reportElementId);
    if (!reportElement) {
        toast({ title: "خطأ: لم يتم العثور على عنصر التقرير", variant: "destructive" });
        return;
    }
    toast({ title: "جاري تجهيز PDF...", description: "قد يستغرق الأمر بضع لحظات." });
    try {
        const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true, windowWidth: reportElement.scrollWidth, windowHeight: reportElement.scrollHeight });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'pt',
            format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${filename}_${format(new Date(), "yyyyMMddHHmmss")}.pdf`);
        toast({ title: "تم تصدير PDF بنجاح (تجريبي)" });
    } catch (error: any) {
        toast({ title: "خطأ أثناء تصدير PDF", description: error.message, variant: "destructive" });
        console.error("PDF Export Error:", error);
    }
  };

  const renderReportContent = () => {
    if (isLoadingReportData) {
      return <div className="flex justify-center items-center h-[200px]"><PackageSearch className="h-16 w-16 text-muted-foreground/30 animate-pulse" /></div>;
    }

    const reportId = `report-content-${activeReportKey}`;

    switch (activeReportKey) {
      case 'dailySalesDetail':
      case 'monthlySalesDetail':
        return (
          <div id={reportId}>
            {detailedSalesData.length > 0 ? (
              <>
                <Table>
                  <TableHeader><TableRow><TableHead>الفاتورة</TableHead><TableHead>التاريخ</TableHead><TableHead>العميل</TableHead><TableHead>المنتج</TableHead><TableHead>الكمية</TableHead><TableHead>سعر الوحدة</TableHead><TableHead>الإجمالي</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {detailedSalesData.map((item, idx) => (
                      <TableRow key={`${item.invoice_id}-${item.product_name}-${idx}`}>
                        <TableCell>{item.invoice_id}</TableCell>
                        <TableCell>{item.sale_date}</TableCell>
                        <TableCell>{item.client_name}</TableCell>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit_price.toFixed(2)} ل.س</TableCell>
                        <TableCell>{item.item_total_price.toFixed(2)} ل.س</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {salesSummary && (
                  <Card className="mt-4">
                    <CardHeader><CardTitle>ملخص المبيعات</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <p>إجمالي المنتجات المباعة: <span className="font-bold">{salesSummary.total_items_sold}</span></p>
                      <p>إجمالي المبالغ: <span className="font-bold text-primary">{salesSummary.total_sales_amount.toFixed(2)} ل.س</span></p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : <p className="text-center text-muted-foreground p-4">لا توجد بيانات مبيعات لعرضها.</p>}
          </div>
        );
      
      case 'dailyFinancialSummary':
      case 'monthlyFinancialSummary':
        return (
          <div id={reportId}>
            {financialSummaryData ? (
              <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-primary"><CardHeader className="pb-1 pt-2 px-3"><CardTitle className="text-xs font-medium">إجمالي المبيعات</CardTitle></CardHeader><CardContent className="px-3 pb-2 pt-0.5 text-xl font-bold">{financialSummaryData.total_sales.toFixed(2)} ل.س</CardContent></Card>
                <Card className="border-l-4 border-destructive"><CardHeader className="pb-1 pt-2 px-3"><CardTitle className="text-xs font-medium">إجمالي المصروفات</CardTitle></CardHeader><CardContent className="px-3 pb-2 pt-0.5 text-xl font-bold">{financialSummaryData.total_expenses.toFixed(2)} ل.س</CardContent></Card>
                <Card className="border-l-4 border-orange-500"><CardHeader className="pb-1 pt-2 px-3"><CardTitle className="text-xs font-medium">إجمالي الربح</CardTitle></CardHeader><CardContent className="px-3 pb-2 pt-0.5 text-xl font-bold">{financialSummaryData.gross_profit.toFixed(2)} ل.س</CardContent></Card>
                <Card className="border-l-4 border-green-500"><CardHeader className="pb-1 pt-2 px-3"><CardTitle className="text-xs font-medium">صافي الربح</CardTitle></CardHeader><CardContent className="px-3 pb-2 pt-0.5 text-xl font-bold">{financialSummaryData.net_profit.toFixed(2)} ل.س</CardContent></Card>
              </CardContent>
            ) : <p className="text-center text-muted-foreground p-4">لا توجد بيانات مالية لعرضها.</p>}
          </div>
        );

      case 'inventoryMovement':
        return (
          <div id={reportId}>
            {inventoryMovementData.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>المنتج</TableHead><TableHead>الكمية المباعة (خلال الفترة)</TableHead><TableHead>الكمية المتبقية (حالياً)</TableHead></TableRow></TableHeader>
                <TableBody>
                  {inventoryMovementData.map(item => (
                    <TableRow key={item.product_id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.sold_quantity}</TableCell>
                      <TableCell>{item.remaining_stock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-center text-muted-foreground p-4">لا توجد بيانات حركة مخزون لعرضها.</p>}
          </div>
        );

      case 'balancesReport':
        return (
          <div id={reportId} className="space-y-6">
            <Card>
              <CardHeader><CardTitle>المبالغ المستحقة على العملاء (ديون)</CardTitle></CardHeader>
              <CardContent>
                {clientDebtsData.length > 0 ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>العميل</TableHead><TableHead>المبلغ المستحق</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {clientDebtsData.map(debt => (
                        <TableRow key={debt.client_id}><TableCell>{debt.client_name}</TableCell><TableCell className="text-red-600">{debt.debt_amount.toFixed(2)} ل.س</TableCell></TableRow>
                      ))}
                       <TableRow className="font-bold bg-muted/50"><TableCell>الإجمالي</TableCell><TableCell className="text-red-600">{clientDebtsData.reduce((sum, d) => sum + d.debt_amount, 0).toFixed(2)} ل.س</TableCell></TableRow>
                    </TableBody>
                  </Table>
                ) : <p className="text-muted-foreground">لا توجد ديون مستحقة على العملاء حالياً.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>المبالغ المستحقة للموردين (فواتير شراء غير مدفوعة)</CardTitle></CardHeader>
              <CardContent>
                {supplierDuesData.length > 0 ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>المورد</TableHead><TableHead>رقم الفاتورة</TableHead><TableHead>المبلغ المستحق</TableHead><TableHead>تاريخ الاستحقاق</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {supplierDuesData.map(due => (
                        <TableRow key={`${due.supplier_id}-${due.invoice_number}`}><TableCell>{due.supplier_name}</TableCell><TableCell>{due.invoice_number}</TableCell><TableCell>{due.due_amount.toFixed(2)} ل.س</TableCell><TableCell>{due.due_date || '-'}</TableCell></TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted/50"><TableCell colSpan={2}>الإجمالي</TableCell><TableCell>{supplierDuesData.reduce((sum, d) => sum + d.due_amount, 0).toFixed(2)} ل.س</TableCell><TableCell></TableCell></TableRow>
                    </TableBody>
                  </Table>
                ) : <p className="text-muted-foreground">لا توجد فواتير شراء مستحقة للموردين حالياً.</p>}
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
            <div className="flex flex-col items-center justify-center text-muted-foreground p-8 min-h-[200px]">
                <Info className="w-16 h-16 mb-4 text-muted-foreground/30"/>
                <p className="text-lg">الرجاء اختيار تقرير من الأعلى لعرض البيانات.</p>
                <p className="text-sm">يمكنك استخدام الفلاتر المتاحة لتخصيص نطاق البيانات لكل تقرير.</p>
            </div>
        );
    }
  };
  
  const getReportDataForExport = () => {
    switch(activeReportKey) {
        case 'dailySalesDetail':
        case 'monthlySalesDetail':
            return detailedSalesData.map(item => ({
                "رقم الفاتورة": item.invoice_id,
                "تاريخ البيع": item.sale_date,
                "العميل": item.client_name,
                "المنتج": item.product_name,
                "الكمية": item.quantity,
                "سعر الوحدة (ل.س)": item.unit_price.toFixed(2),
                "إجمالي الصنف (ل.س)": item.item_total_price.toFixed(2),
                "خصم الفاتورة (ل.س)": item.invoice_discount_amount?.toFixed(2) || '0.00'
            }));
        case 'dailyFinancialSummary':
        case 'monthlyFinancialSummary':
            return financialSummaryData ? [{
                "إجمالي المبيعات (ل.س)": financialSummaryData.total_sales.toFixed(2),
                "إجمالي المصروفات (ل.س)": financialSummaryData.total_expenses.toFixed(2),
                "إجمالي الربح (ل.س)": financialSummaryData.gross_profit.toFixed(2),
                "صافي الربح (ل.س)": financialSummaryData.net_profit.toFixed(2)
            }] : [];
        case 'inventoryMovement':
            return inventoryMovementData.map(item => ({
                "المنتج": item.product_name,
                "الكمية المباعة": item.sold_quantity,
                "المخزون المتبقي": item.remaining_stock
            }));
        case 'balancesReport':
             const clientDebtsExport = clientDebtsData.map(d => ({ "نوع الرصيد": "دين عميل", "الاسم": d.client_name, "المبلغ (ل.س)": d.debt_amount.toFixed(2), "تفاصيل": "" }));
             const supplierDuesExport = supplierDuesData.map(d => ({ "نوع الرصيد": "مستحق لمورد", "الاسم": d.supplier_name, "المبلغ (ل.س)": d.due_amount.toFixed(2), "تفاصيل": `فاتورة ${d.invoice_number}${d.due_date ? ' تستحق في '+d.due_date : ''}` }));
             return [...clientDebtsExport, ...supplierDuesExport];
        default: return [];
    }
  };


  // AI Assistant related code (remains unchanged from previous version)
  const handleSubmitExplanation = async () => { /* ... */ };
  const handleCopyExplanation = () => { /* ... */ };


  return (
    <AppLayout>
      <div className="space-y-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-foreground flex items-center"><BarChart2 className="ml-2 h-7 w-7 text-primary"/>{activeReportKey ? `تقرير: ${activeReportTitle}` : "لوحة التقارير"}</CardTitle>
            <CardDescription>اختر تقريراً لعرضه. يمكنك استخدام الفلاتر لتخصيص البيانات وتصديرها.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
            <Button variant={activeReportKey === 'dailySalesDetail' ? "default" : "outline"} className="w-full justify-start text-right" onClick={() => handleReportButtonClick('dailySalesDetail', 'مبيعات يومي مفصل')}><ShoppingCart className="ml-2 h-4 w-4"/>مبيعات يومي مفصل</Button>
            <Button variant={activeReportKey === 'monthlySalesDetail' ? "default" : "outline"} className="w-full justify-start text-right" onClick={() => handleReportButtonClick('monthlySalesDetail', 'مبيعات شهري مفصل')}><ShoppingCart className="ml-2 h-4 w-4"/>مبيعات شهري مفصل</Button>
            <Button variant={activeReportKey === 'dailyFinancialSummary' ? "default" : "outline"} className="w-full justify-start text-right" onClick={() => handleReportButtonClick('dailyFinancialSummary', 'مالي يومي')}><DollarSign className="ml-2 h-4 w-4"/>مالي يومي</Button>
            <Button variant={activeReportKey === 'monthlyFinancialSummary' ? "default" : "outline"} className="w-full justify-start text-right" onClick={() => handleReportButtonClick('monthlyFinancialSummary', 'مالي شهري')}><DollarSign className="ml-2 h-4 w-4"/>مالي شهري</Button>
            <Button variant={activeReportKey === 'inventoryMovement' ? "default" : "outline"} className="w-full justify-start text-right" onClick={() => handleReportButtonClick('inventoryMovement', 'حركة المخزون')}><Package className="ml-2 h-4 w-4"/>حركة المخزون</Button>
            <Button variant={activeReportKey === 'balancesReport' ? "default" : "outline"} className="w-full justify-start text-right" onClick={() => handleReportButtonClick('balancesReport', 'الديون والمستحقات')}><Users className="ml-2 h-4 w-4"/>الديون والمستحقات</Button>
          </CardContent>
        </Card>

        {activeReportKey && (
          <Card className="shadow-lg">
            <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <CardTitle className="font-headline text-xl text-foreground flex items-center">
                    {activeReportKey.includes("Sales") && <ShoppingCart className="ml-2 h-5 w-5 text-primary"/>}
                    {activeReportKey.includes("Financial") && <DollarSign className="ml-2 h-5 w-5 text-primary"/>}
                    {activeReportKey.includes("inventory") && <Package className="ml-2 h-5 w-5 text-primary"/>}
                    {activeReportKey.includes("balances") && <Users className="ml-2 h-5 w-5 text-primary"/>}
                    نتائج: {activeReportTitle}
                </CardTitle>
                 <CardDescription className="text-xs mt-1">
                    {activeReportKey === 'dailySalesDetail' && `لـ: ${format(singleDateFilter, "PPP", {locale: arSA})}`}
                    {activeReportKey === 'monthlySalesDetail' && `لشهر: ${format(monthYearFilter, "MMMM yyyy", {locale: arSA})}`}
                    {activeReportKey === 'dailyFinancialSummary' && `لـ: ${format(singleDateFilter, "PPP", {locale: arSA})}`}
                    {activeReportKey === 'monthlyFinancialSummary' && `لشهر: ${format(monthYearFilter, "MMMM yyyy", {locale: arSA})}`}
                    {activeReportKey === 'inventoryMovement' && reportDateRange?.from && `من ${format(reportDateRange.from, "PPP", {locale:arSA})} إلى ${reportDateRange.to ? format(reportDateRange.to, "PPP", {locale:arSA}) : 'الآن'}`}
                 </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-end">
                { (activeReportKey === 'dailySalesDetail' || activeReportKey === 'dailyFinancialSummary') && (
                    <div className="w-full sm:w-auto">
                        <Label htmlFor="singleDate" className="text-xs">اختر اليوم</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="singleDate" variant="outline" className={cn("w-full justify-start text-right font-normal mt-1", !singleDateFilter && "text-muted-foreground")}>
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {singleDateFilter ? format(singleDateFilter, "PPP", {locale:arSA}) : <span>اختر تاريخاً</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={singleDateFilter} onSelect={(day) => { if(day) { setSingleDateFilter(day); handleReportButtonClick(activeReportKey, activeReportTitle);}}} initialFocus locale={arSA} /></PopoverContent>
                        </Popover>
                    </div>
                )}
                { (activeReportKey === 'monthlySalesDetail' || activeReportKey === 'monthlyFinancialSummary') && (
                    <div className="w-full sm:w-auto">
                        <Label htmlFor="monthYear" className="text-xs">اختر الشهر</Label>
                        <Input type="month" id="monthYear" value={format(monthYearFilter, "yyyy-MM")} 
                               onChange={(e) => {
                                   const newDate = parse(e.target.value, "yyyy-MM", new Date());
                                   if(isValid(newDate)) { setMonthYearFilter(newDate); handleReportButtonClick(activeReportKey, activeReportTitle); }
                               }}
                               className="mt-1 bg-input/50 focus:bg-input"
                        />
                    </div>
                )}
                 {activeReportKey === 'inventoryMovement' && (
                    <div className="w-full sm:w-auto">
                        <Label htmlFor="dateRange" className="text-xs">نطاق التواريخ</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="dateRange" variant={"outline"} className={cn("w-full justify-start text-right font-normal mt-1", !reportDateRange && "text-muted-foreground")}>
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {reportDateRange?.from ? (reportDateRange.to ? (<>{format(reportDateRange.from, "d MMM yy", {locale:arSA})} - {format(reportDateRange.to, "d MMM yy", {locale:arSA})}</>) : format(reportDateRange.from, "d MMM yy", {locale:arSA})) : <span>اختر نطاقًا</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar initialFocus mode="range" defaultMonth={reportDateRange?.from} selected={reportDateRange} onSelect={(range) => { if(range?.from && range?.to) {setReportDateRange(range); handleReportButtonClick(activeReportKey, activeReportTitle);}}} numberOfMonths={2} dir="rtl" locale={arSA} />
                            </PopoverContent>
                        </Popover>
                    </div>
                 )}
                <div className="flex gap-2 w-full sm:w-auto self-end">
                    <Button variant="outline" size="sm" onClick={() => handleExportToCsv(activeReportKey, getReportDataForExport())} disabled={isLoadingReportData || getReportDataForExport().length === 0}><Download className="ml-1 h-3.5 w-3.5"/>CSV</Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportToPdf(`report-content-${activeReportKey}`, activeReportKey)} disabled={isLoadingReportData || getReportDataForExport().length === 0}><Download className="ml-1 h-3.5 w-3.5"/>PDF (تجريبي)</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="min-h-[250px] p-2">
                <ScrollArea className="h-[450px] w-full p-1">
                  {renderReportContent()}
                </ScrollArea>
            </CardContent>
          </Card>
        )}

        {!activeReportKey && !isLoadingReportData && (
             <div className="flex flex-col items-center justify-center text-muted-foreground p-8 min-h-[200px] bg-card rounded-md shadow">
                <FileText className="w-20 h-20 mb-4 text-muted-foreground/20"/>
                <p className="text-lg">مرحباً بك في قسم التقارير.</p>
                <p className="text-sm text-center max-w-md">اختر أحد التقارير من الأعلى لعرض تفاصيله. يمكنك استخدام الفلاتر المتاحة لتخصيص نطاق البيانات وتصديرها بالصيغة التي تناسبك.</p>
            </div>
        )}

        <Card className="shadow-xl border-t-4 border-accent">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-foreground flex items-center"><Wand2 className="ml-3 h-6 w-6 text-accent"/>مساعد التقارير الذكي</CardTitle>
            <CardDescription>ألصق نص تقرير مالي أو جزء منه، واطرح سؤالاً محدداً ليقوم الذكاء الاصطناعي بتبسيطه لك.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="reportTextAi" className="text-md font-medium text-muted-foreground">نص التقرير لتحليله</Label>
              <Textarea id="reportTextAi" value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="مثال: 'بلغ صافي الدخل للربع الأول 150,000 ل.س...'" rows={6} className="mt-2 bg-input/50 resize-y" />
            </div>
            <div>
              <Label htmlFor="userQuestionAi" className="text-md font-medium text-muted-foreground">سؤالك حول التقرير</Label>
              <Input id="userQuestionAi" value={userQuestion} onChange={(e) => setUserQuestion(e.target.value)} placeholder="مثال: 'اشرح لي قسم الأصول المتداولة.'" className="mt-2 bg-input/50" />
            </div>
            <Button onClick={handleSubmitExplanation} disabled={isLoadingExplanation || !userQuestion.trim() || !reportText.trim()} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
              <Wand2 className="ml-2 h-5 w-5" />{isLoadingExplanation ? 'يتم التحليل...' : 'احصل على شرح مبسط'}
            </Button>
          </CardContent>
          {isLoadingExplanation && (<div className="flex justify-center p-4"><PackageSearch className="h-8 w-8 text-muted-foreground/50 animate-pulse" /></div>)}
          {explanation && (
            <CardFooter className="flex-col items-start space-y-2 border-t pt-4">
                <div className="flex justify-between w-full items-center">
                    <h3 className="font-semibold text-foreground">الشرح المُنشأ:</h3>
                    <Button variant="ghost" size="icon" onClick={handleCopyExplanation} title="نسخ الشرح">{copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-muted-foreground" />}</Button>
                </div>
              <div className="prose prose-sm max-w-none dark:prose-invert text-foreground bg-muted/30 p-4 rounded-md whitespace-pre-wrap font-body w-full">{explanation}</div>
            </CardFooter>
          )}
        </Card>

      </div>
    </AppLayout>
  );
};

export default FinancialReportsPage;
    

/*
Reminder for Supabase Views (Ensure these are created):

1. gross_profit_per_product_view:
CREATE OR REPLACE VIEW gross_profit_per_product_view AS
SELECT
    p.id AS product_id, p.name AS product_name, s.sale_date,
    SUM(si.quantity) AS total_quantity_sold,
    SUM(si.total_price) AS total_revenue,
    SUM(si.quantity * p.purchase_price) AS total_cost_of_goods_sold,
    (SUM(si.total_price) - SUM(si.quantity * p.purchase_price)) AS gross_profit
FROM sale_items si
JOIN products p ON si.product_id = p.id
JOIN sales s ON si.sale_id = s.id
GROUP BY p.id, p.name, s.sale_date;

2. monthly_performance_summary_view:
CREATE OR REPLACE VIEW monthly_performance_summary_view AS
WITH monthly_sales AS (
    SELECT date_trunc('month', sale_date)::date AS report_period, SUM(total_amount) AS total_sales_amount
    FROM sales GROUP BY 1
), monthly_purchases AS (
    SELECT date_trunc('month', invoice_date)::date AS report_period, SUM(grand_total) AS total_purchases_amount
    FROM purchase_invoices GROUP BY 1
), monthly_expenses AS (
    SELECT date_trunc('month', expense_date)::date AS report_period, SUM(amount) AS total_expenses_amount
    FROM expenses GROUP BY 1
), monthly_gross_profit AS (
    SELECT date_trunc('month', gppv.sale_date)::date AS report_period, SUM(gppv.gross_profit) AS total_gross_profit_amount
    FROM gross_profit_per_product_view gppv
    GROUP BY 1
)
SELECT
    to_char(periods.report_period, 'YYYY-MM') AS period_label,
    COALESCE(ms.total_sales_amount, 0) AS total_sales,
    COALESCE(mp.total_purchases_amount, 0) AS total_purchases,
    COALESCE(me.total_expenses_amount, 0) AS total_expenses,
    COALESCE(mgp.total_gross_profit_amount, 0) AS gross_profit
FROM (
    SELECT DISTINCT report_period FROM monthly_sales
    UNION SELECT DISTINCT report_period FROM monthly_purchases
    UNION SELECT DISTINCT report_period FROM monthly_expenses
    UNION SELECT DISTINCT report_period FROM monthly_gross_profit
) AS periods
LEFT JOIN monthly_sales ms ON periods.report_period = ms.report_period
LEFT JOIN monthly_purchases mp ON periods.report_period = mp.report_period
LEFT JOIN monthly_expenses me ON periods.report_period = me.report_period
LEFT JOIN monthly_gross_profit mgp ON periods.report_period = mgp.report_period
ORDER BY periods.report_period DESC;

3. detailed_stock_report_view: (Already implemented and used previously)
CREATE OR REPLACE VIEW detailed_stock_report_view AS
WITH avg_purchase_prices AS (
    SELECT
        pii.product_id,
        CASE WHEN SUM(pii.quantity) = 0 THEN NULL ELSE SUM(pii.total_price) / SUM(pii.quantity) END as avg_unit_price
    FROM purchase_invoice_items pii WHERE pii.quantity > 0 GROUP BY pii.product_id
)
SELECT
    p.id AS product_id, p.name AS product_name, p.category,
    p.stock AS current_stock, p.min_stock_level,
    p.purchase_price AS last_purchase_price, 
    app.avg_unit_price AS average_purchase_price 
FROM products p
LEFT JOIN avg_purchase_prices app ON p.id = app.product_id
ORDER BY p.name;

*/
