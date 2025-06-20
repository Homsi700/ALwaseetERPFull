
// src/app/partners/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as TableFooterUi } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, FileEdit, Trash2, MoreHorizontal, Handshake, Percent, PackageSearch, DollarSign, CalendarDays, TrendingUp, FileDown, Printer, MessageSquare, Phone, MapPin, CalendarPlus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, parseISO, startOfDay, endOfDay, isValid, parse } from "date-fns";
import { arSA } from "date-fns/locale";
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Textarea } from '@/components/ui/textarea';
import { cn } from "@/lib/utils";


interface Partner {
  partner_id: string;
  partner_name: string;
  profit_share_percentage: number;
  initial_investment?: number;
  notes?: string; 
  created_at?: string;
  phone?: string;
  address?: string;
  investment_date?: string; // Date as YYYY-MM-DD string
}

interface PartnerSaleDetail {
  sale_id: string;
  sale_date: string;
  total_sale_amount: number;
  sale_profit: number; 
  partner_share_from_sale: number; 
}

const mapToSupabasePartner = (partnerData: Omit<Partner, 'partner_id' | 'created_at'> & { partner_id?: string }) => ({
  partner_name: partnerData.partner_name,
  profit_share_percentage: partnerData.profit_share_percentage,
  initial_investment: partnerData.initial_investment || 0,
  notes: partnerData.notes,
  phone: partnerData.phone,
  address: partnerData.address,
  investment_date: partnerData.investment_date ? format(new Date(partnerData.investment_date), 'yyyy-MM-dd') : null,
});

const mapFromSupabasePartner = (data: any): Partner => ({
  partner_id: data.partner_id,
  partner_name: data.partner_name,
  profit_share_percentage: data.profit_share_percentage,
  initial_investment: data.initial_investment,
  notes: data.notes,
  created_at: data.created_at,
  phone: data.phone,
  address: data.address,
  investment_date: data.investment_date ? format(new Date(data.investment_date), 'yyyy-MM-dd') : undefined,
});


const PartnersPage = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | undefined>(undefined);
  const [partnerInvestmentDate, setPartnerInvestmentDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const [selectedPartnerForReport, setSelectedPartnerForReport] = useState<Partner | null>(null);
  const [reportDate, setReportDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<PartnerSaleDetail[]>([]);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [currentReportType, setCurrentReportType] = useState<'daily' | 'monthly' | null>(null);


  const fetchPartners = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('partner_name', { ascending: true });
      if (error) throw error;
      setPartners(data.map(mapFromSupabasePartner));
    } catch (error: any) {
      toast({ title: 'خطأ في جلب الشركاء', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (user) {
      fetchPartners();
    } else {
      setIsLoading(false);
    }
  }, [user, fetchPartners]);

  const handleAddPartner = () => {
    setEditingPartner(undefined);
    setPartnerInvestmentDate(undefined); // Reset date for new partner
    setIsModalOpen(true);
  };

  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    // Ensure investment_date is a valid Date object or undefined
    setPartnerInvestmentDate(partner.investment_date ? new Date(partner.investment_date) : undefined);
    setIsModalOpen(true);
  };

  const handleDeletePartner = async (partnerId: string) => {
    try {
      const { data: salesData, error: salesCheckError } = await supabase
        .from('sales')
        .select('id')
        .eq('partner_id', partnerId)
        .limit(1);

      if (salesCheckError) throw salesCheckError;

      if (salesData && salesData.length > 0) {
        toast({
          title: 'لا يمكن حذف الشريك',
          description: 'هذا الشريك مرتبط بفواتير بيع حالية. لا يمكن حذفه.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.from('partners').delete().eq('partner_id', partnerId);
      if (error) throw error;
      fetchPartners();
      if (selectedPartnerForReport?.partner_id === partnerId) {
        setSelectedPartnerForReport(null);
        setReportData([]);
      }
      toast({ title: 'تم حذف الشريك' });
    } catch (error: any) {
      toast({ title: 'خطأ في حذف الشريك', description: error.message, variant: 'destructive' });
    }
  };

  const handleSavePartner = async (partnerData: Omit<Partner, 'partner_id' | 'created_at'> & { partner_id?: string }) => {
    const dataToSave = mapToSupabasePartner(partnerData);
    try {
      if (editingPartner && editingPartner.partner_id) {
        const { error } = await supabase.from('partners').update(dataToSave).eq('partner_id', editingPartner.partner_id);
        if (error) throw error;
        toast({ title: 'تم تحديث بيانات الشريك' });
      } else {
        const { error } = await supabase.from('partners').insert(dataToSave).select().single();
        if (error) throw error;
        toast({ title: 'تمت إضافة شريك جديد' });
      }
      fetchPartners();
      setIsModalOpen(false);
      setEditingPartner(undefined);
      setPartnerInvestmentDate(undefined);
    } catch (error: any) {
      toast({ title: 'خطأ في حفظ بيانات الشريك', description: error.message, variant: 'destructive' });
    }
  };
  
  const fetchPartnerReport = useCallback(async (partnerId: string, date: Date, type: 'daily' | 'monthly') => {
    if (!user) return;
    setIsLoadingReport(true);
    setReportData([]);
    setCurrentReportType(type); 
    try {
      let fromDateStr, toDateStr;
      if (type === 'daily') {
        fromDateStr = format(startOfDay(date), "yyyy-MM-dd'T'00:00:00.000xxx");
        toDateStr = format(endOfDay(date), "yyyy-MM-dd'T'23:59:59.999xxx");
      } else { // monthly
        fromDateStr = format(startOfMonth(date), "yyyy-MM-dd'T'00:00:00.000xxx");
        toDateStr = format(endOfMonth(date), "yyyy-MM-dd'T'23:59:59.999xxx");
      }
      
      const { data, error } = await supabase
        .from('partner_daily_sales_profit_view') 
        .select('*')
        .eq('partner_id', partnerId)
        .gte('sale_date', fromDateStr)
        .lte('sale_date', toDateStr)
        .order('sale_date', { ascending: false });

      if (error) {
        console.error("Error fetching partner report:", error);
        if (error.message.includes("relation \"public.partner_daily_sales_profit_view\" does not exist")) {
            toast({ title: `خطأ: View غير موجود`, description: `يرجى التأكد من إنشاء 'partner_daily_sales_profit_view' في قاعدة بيانات Supabase.`, variant: "destructive", duration: 10000 });
        } else {
            throw error;
        }
        setReportData([]);
      } else {
         const formattedData: PartnerSaleDetail[] = data.map((item: any) => ({
            sale_id: item.sale_id.substring(0,8),
            sale_date: format(parseISO(item.sale_date), "yyyy/MM/dd HH:mm", { locale: arSA }),
            total_sale_amount: item.total_sale_amount,
            sale_profit: item.sale_profit,
            partner_share_from_sale: item.partner_share_from_sale,
         }));
         setReportData(formattedData);
         if(formattedData.length === 0) {
            toast({ title: "لا توجد بيانات", description: "لم يتم العثور على مبيعات لهذا الشريك في الفترة المحددة."});
         }
      }
    } catch (err: any) {
      toast({ title: `خطأ في جلب تقرير الشريك ${type === 'daily' ? 'اليومي' : 'الشهري'}`, description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingReport(false);
    }
  }, [user, toast]);

  const handleShowReport = (partner: Partner) => {
    setSelectedPartnerForReport(partner);
    setReportDate(new Date()); 
    fetchPartnerReport(partner.partner_id, new Date(), 'daily'); 
  };

  const totalPartnerShareForReport = useMemo(() => {
    return reportData.reduce((sum, item) => sum + item.partner_share_from_sale, 0);
  }, [reportData]);

  const handleExportReport = (formatType: 'csv' | 'pdf') => {
    if (!selectedPartnerForReport || reportData.length === 0) {
      toast({ title: "لا توجد بيانات للتصدير", variant: "destructive" });
      return;
    }
    const reportTitle = `تقرير_ارباح_الشريك_${selectedPartnerForReport.partner_name.replace(/\s/g, '_')}_${currentReportType === 'daily' ? format(reportDate, "yyyyMMdd") : format(reportDate, "yyyyMM")}`;
    
    const dataToExport = reportData.map(item => ({
      "معرف الفاتورة": item.sale_id,
      "تاريخ البيع": item.sale_date,
      "إجمالي مبلغ البيع (ل.س)": item.total_sale_amount.toFixed(2),
      "ربح الفاتورة (ل.س)": item.sale_profit.toFixed(2),
      "نصيب الشريك من الربح (ل.س)": item.partner_share_from_sale.toFixed(2),
    }));

    if (formatType === 'csv') {
      const csv = Papa.unparse(dataToExport);
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${reportTitle}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "تم تصدير CSV بنجاح" });
    } else if (formatType === 'pdf') {
        const reportElementId = `partner-report-content-${selectedPartnerForReport.partner_id}`;
        const reportElement = document.getElementById(reportElementId);
        if (!reportElement) {
            toast({title: "خطأ: عنصر التقرير غير موجود", variant: "destructive"});
            return;
        }
        toast({ title: "جاري تجهيز PDF...", description: "متصفحك سيتحكم في مكان حفظ الملف." });
        html2canvas(reportElement, { scale: 2, useCORS: true, windowWidth: reportElement.scrollWidth, windowHeight: reportElement.scrollHeight }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                unit: 'pt',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${reportTitle}.pdf`);
            toast({ title: "تم تصدير PDF بنجاح" });
        }).catch(err => {
            toast({title: "خطأ أثناء تصدير PDF", description: err.message, variant: "destructive"});
        });
    }
     toast({
        title: "ملاحظة حول تصدير الملفات",
        description: "يتحكم متصفح الويب الخاص بك في تحديد مسار حفظ الملفات المصدرة (عادةً مجلد التنزيلات). لا يمكن للتطبيق تحديد مسار مخصص مثل سطح المكتب مباشرةً.",
        duration: 7000,
      });
  };


  if (!user && !isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-lg text-muted-foreground mb-4">يرجى تسجيل الدخول للوصول إلى قسم الشركاء.</p>
          <Button onClick={() => router.push('/')}>الذهاب إلى صفحة تسجيل الدخول</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
            <Handshake className="mr-3 h-8 w-8 text-primary" /> إدارة الشركاء
          </h1>
          <Button onClick={handleAddPartner} className="mt-4 sm:mt-0 bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-5 w-5" /> إضافة شريك جديد
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <PackageSearch className="h-16 w-16 text-muted-foreground/30 animate-pulse" />
          </div>
        ) : partners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map(partner => (
              <Card key={partner.partner_id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="font-headline text-xl text-primary">{partner.partner_name}</CardTitle>
                    <CardDescription>نسبة المشاركة: {partner.profit_share_percentage.toFixed(2)}%</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleShowReport(partner)}><TrendingUp className="mr-2 h-4 w-4" /> عرض تقرير الأرباح</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditPartner(partner)}><FileEdit className="mr-2 h-4 w-4" />تعديل</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeletePartner(partner.partner_id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />حذف</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  <div className="text-sm text-muted-foreground space-y-1.5">
                    <p className="flex items-center">
                      <DollarSign className="mr-1 h-4 w-4 text-green-500" />
                      الاستثمار: 
                      <span className="font-semibold ml-1 text-foreground">{(partner.initial_investment || 0).toFixed(2)} ل.س</span>
                    </p>
                    {partner.investment_date && (
                        <p className="flex items-center">
                            <CalendarPlus className="mr-1 h-4 w-4 text-blue-500"/>
                            تاريخ الاستثمار:
                            <span className="font-semibold ml-1 text-foreground">{format(new Date(partner.investment_date), "d MMMM yyyy", { locale: arSA })}</span>
                        </p>
                    )}
                    {partner.phone && (
                        <p className="flex items-center">
                            <Phone className="mr-1 h-4 w-4 text-indigo-500"/>
                            الهاتف:
                            <span className="font-semibold ml-1 text-foreground">{partner.phone}</span>
                        </p>
                    )}
                     {partner.address && (
                        <p className="flex items-start">
                            <MapPin className="mr-1 h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0"/>
                            <span className="font-semibold ml-1 text-foreground whitespace-pre-wrap">{partner.address}</span>
                        </p>
                    )}
                    {partner.notes && (
                        <div className="flex items-start">
                            <MessageSquare className="mr-1 h-4 w-4 text-teal-500 mt-0.5 flex-shrink-0"/>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                <span className="font-medium text-foreground">ملاحظات:</span> {partner.notes}
                            </p>
                        </div>
                    )}
                     <p className="text-xs pt-1">
                      تاريخ الإنشاء: {partner.created_at ? new Date(partner.created_at).toLocaleDateString('ar-EG') : '-'}
                    </p>
                  </div>
                </CardContent>
                 <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleShowReport(partner)}>
                        <TrendingUp className="mr-2 h-4 w-4" /> عرض تقارير الشريك
                    </Button>
                 </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="h-40 flex flex-col items-center justify-center text-muted-foreground">
              <PackageSearch className="h-12 w-12 mb-3 text-muted-foreground/30" />
              لا يوجد شركاء مضافون بعد. قم بإضافة شريك جديد.
            </CardContent>
          </Card>
        )}

        {selectedPartnerForReport && (
          <Card className="shadow-xl mt-8 border-t-4 border-primary" id={`partner-report-container-${selectedPartnerForReport.partner_id}`}>
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary flex items-center">
                <TrendingUp className="mr-2 h-6 w-6" />
                تقرير أرباح الشريك: {selectedPartnerForReport.partner_name}
              </CardTitle>
              <CardDescription>
                عرض تفصيلي لنصيب الشريك من أرباح المبيعات.
                 يتم حساب ربح الفاتورة عن طريق طرح مجموع أسعار شراء المنتجات في الفاتورة من إجمالي مبلغ الفاتورة.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4 items-end">
                <div className="flex-grow">
                  <Label htmlFor="reportDate" className="text-sm">اختر تاريخ التقرير</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="reportDate" variant="outline" className="w-full sm:w-auto justify-start text-right font-normal mt-1">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {reportDate ? format(reportDate, "PPP", { locale: arSA }) : <span>اختر تاريخاً</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={reportDate} onSelect={(date) => date && setReportDate(date)} initialFocus locale={arSA} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => fetchPartnerReport(selectedPartnerForReport.partner_id, reportDate, 'daily')} disabled={isLoadingReport}>
                        <CalendarDays className="mr-1 h-4 w-4" /> عرض تقرير يومي
                    </Button>
                    <Button onClick={() => fetchPartnerReport(selectedPartnerForReport.partner_id, reportDate, 'monthly')} disabled={isLoadingReport}>
                        <CalendarDays className="mr-1 h-4 w-4" /> عرض تقرير شهري
                    </Button>
                </div>
                 <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExportReport('csv')} disabled={isLoadingReport || reportData.length === 0}><FileDown className="mr-1 h-3.5 w-3.5"/>CSV</Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportReport('pdf')} disabled={isLoadingReport || reportData.length === 0}><Printer className="mr-1 h-3.5 w-3.5"/>PDF</Button>
                </div>
              </div>
              
              {isLoadingReport ? (
                <div className="flex justify-center items-center h-40"><PackageSearch className="h-12 w-12 text-muted-foreground/30 animate-pulse" /></div>
              ) : reportData.length > 0 ? (
                <div id={`partner-report-content-${selectedPartnerForReport.partner_id}`} className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader><TableRow><TableHead>معرف الفاتورة</TableHead><TableHead>تاريخ البيع</TableHead><TableHead>مبلغ البيع</TableHead><TableHead>ربح الفاتورة</TableHead><TableHead>نصيب الشريك</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {reportData.map((item) => (
                        <TableRow key={item.sale_id}>
                          <TableCell>{item.sale_id}</TableCell>
                          <TableCell>{item.sale_date}</TableCell>
                          <TableCell>{item.total_sale_amount.toFixed(2)} ل.س</TableCell>
                          <TableCell>{item.sale_profit.toFixed(2)} ل.س</TableCell>
                          <TableCell className="font-semibold text-green-600">{item.partner_share_from_sale.toFixed(2)} ل.س</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                     <TableFooterUi className="bg-muted/50">
                        <TableRow>
                            <TableCell colSpan={4} className="text-right font-bold text-base">إجمالي نصيب الشريك للفترة ({currentReportType === 'daily' ? 'اليوم' : 'الشهر'}):</TableCell>
                            <TableCell className="font-bold text-base text-primary">{totalPartnerShareForReport.toFixed(2)} ل.س</TableCell>
                        </TableRow>
                    </TableFooterUi>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات لعرضها للفترة المحددة. يرجى التأكد من إنشاء Views التقارير في Supabase.</p>
              )}
            </CardContent>
            <CardFooter>
                <Button variant="ghost" onClick={() => {setSelectedPartnerForReport(null); setReportData([]); setCurrentReportType(null);}}>إغلاق تقرير الشريك</Button>
            </CardFooter>
          </Card>
        )}

        <Dialog open={isModalOpen} onOpenChange={(isOpen) => { setIsModalOpen(isOpen); if (!isOpen) { setEditingPartner(undefined); setPartnerInvestmentDate(undefined); } }}>
          <DialogContent className="sm:max-w-lg bg-card">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl text-foreground">{editingPartner ? 'تعديل بيانات الشريك' : 'إضافة شريك جديد'}</DialogTitle>
              <DialogDescription>
                {editingPartner ? `تعديل بيانات الشريك: ${editingPartner.partner_name}` : 'أدخل تفاصيل الشريك الجديد وبياناته الأساسية.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const partnerPayload: Omit<Partner, 'partner_id' | 'created_at'> & { partner_id?: string } = {
                partner_name: formData.get('p-name') as string,
                profit_share_percentage: parseFloat(formData.get('p-profit-share') as string),
                initial_investment: parseFloat(formData.get('p-investment') as string) || 0,
                phone: formData.get('p-phone') as string || undefined,
                address: formData.get('p-address') as string || undefined,
                investment_date: partnerInvestmentDate ? format(partnerInvestmentDate, 'yyyy-MM-dd') : undefined,
                notes: formData.get('p-notes') as string || undefined,
              };
              if (editingPartner) {
                partnerPayload.partner_id = editingPartner.partner_id;
              }
              handleSavePartner(partnerPayload);
            }} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <Label htmlFor="p-name">اسم الشريك</Label>
                <Input id="p-name" name="p-name" defaultValue={editingPartner?.partner_name} required className="mt-1 bg-input/50 focus:bg-input" />
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="p-profit-share" className="flex items-center">
                    <Percent className="mr-1 h-4 w-4 text-muted-foreground" />
                    نسبة المشاركة في الربح (%)
                    </Label>
                    <Input
                    id="p-profit-share" name="p-profit-share" type="number" step="0.01" min="0" max="100"
                    defaultValue={editingPartner?.profit_share_percentage?.toString() || "0"}
                    required className="mt-1 bg-input/50 focus:bg-input" placeholder="مثال: 10.5"
                    />
                </div>
                <div>
                    <Label htmlFor="p-investment" className="flex items-center">
                        <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
                        الاستثمار الأولي (ل.س)
                    </Label>
                    <Input 
                        id="p-investment" name="p-investment" type="number" step="0.01" min="0"
                        defaultValue={editingPartner?.initial_investment?.toString() || "0"}
                        className="mt-1 bg-input/50 focus:bg-input" placeholder="0.00"
                    />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="p-phone" className="flex items-center">
                    <Phone className="mr-1 h-4 w-4 text-muted-foreground" />
                    رقم الهاتف (اختياري)
                  </Label>
                  <Input id="p-phone" name="p-phone" type="tel" defaultValue={editingPartner?.phone} className="mt-1 bg-input/50 focus:bg-input" />
                </div>
                <div>
                    <Label htmlFor="p-investment-date" className="flex items-center">
                        <CalendarPlus className="mr-1 h-4 w-4 text-muted-foreground"/>
                        تاريخ الاستثمار (اختياري)
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-right font-normal mt-1 bg-input/50 focus:bg-input",
                            !partnerInvestmentDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarDays className="ml-2 h-4 w-4" />
                            {partnerInvestmentDate ? format(partnerInvestmentDate, "PPP", { locale: arSA }) : <span>اختر تاريخًا</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={partnerInvestmentDate}
                            onSelect={setPartnerInvestmentDate}
                            initialFocus
                            locale={arSA}
                            captionLayout="dropdown-buttons" 
                            fromYear={2000} 
                            toYear={new Date().getFullYear() + 5}
                        />
                        </PopoverContent>
                    </Popover>
                 </div>
              </div>
              <div>
                <Label htmlFor="p-address" className="flex items-center">
                  <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
                  العنوان (اختياري)
                </Label>
                <Textarea id="p-address" name="p-address" defaultValue={editingPartner?.address} className="mt-1 bg-input/50 focus:bg-input min-h-[60px]" placeholder="مثال: دمشق، المزة..."/>
              </div>
              <div>
                <Label htmlFor="p-notes" className="flex items-center">
                  <MessageSquare className="mr-1 h-4 w-4 text-muted-foreground" />
                  ملاحظات (اختياري)
                </Label>
                <Textarea
                  id="p-notes" name="p-notes"
                  defaultValue={editingPartner?.notes}
                  className="mt-1 bg-input/50 focus:bg-input min-h-[80px]"
                  placeholder="مثال: تم دفع الاستثمار بالدولار بتاريخ..."
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ بيانات الشريك</Button>
                <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default PartnersPage;
    

    
