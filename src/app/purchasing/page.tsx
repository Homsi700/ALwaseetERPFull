
// src/app/purchasing/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, FileBox, Users, FileText, Filter, Printer, Trash2 as Trash2Icon, PackageSearch } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileEdit, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import type { Product as ProductType } from '@/components/products/ProductTable';


interface Supplier {
  id: string;
  created_at?: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone: string;
  address?: string;
  notes?: string;
}

interface PurchaseOrderItem {
  product_id: string;
  productName?: string; 
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PurchaseOrder {
  id: string;
  created_at?: string;
  order_number: string;
  supplier_id: string;
  supplier_name?: string; 
  order_date: string;
  expected_delivery_date?: string;
  items: PurchaseOrderItem[]; // Stored as JSONB
  total_amount: number;
  status: 'مسودة' | 'مرسل' | 'مؤكد' | 'مستلم جزئياً' | 'مستلم بالكامل' | 'ملغى';
}

interface PurchaseInvoice {
  id: string;
  created_at?: string;
  invoice_number: string;
  purchase_order_id?: string; 
  supplier_id: string;
  supplier_name?: string; 
  invoice_date: string;
  due_date?: string;
  items: PurchaseOrderItem[]; // Stored as JSONB
  sub_total: number;
  tax_amount: number;
  grand_total: number;
  status: 'غير مدفوعة' | 'مدفوعة جزئياً' | 'مدفوعة بالكامل' | 'متأخرة';
}

const mapToSupabaseSupplier = (supplier: Omit<Supplier, 'id' | 'created_at'> & { id?: string }) => ({
  name: supplier.name,
  contact_person: supplier.contact_person,
  email: supplier.email,
  phone: supplier.phone,
  address: supplier.address,
  notes: supplier.notes,
});

const mapFromSupabaseSupplier = (data: any): Supplier => ({
  id: data.id,
  created_at: data.created_at,
  name: data.name,
  contact_person: data.contact_person,
  email: data.email,
  phone: data.phone,
  address: data.address,
  notes: data.notes,
});

const mapToSupabasePO = (po: Omit<PurchaseOrder, 'id' | 'created_at' | 'supplier_name'> & { id?: string }) => ({
  order_number: po.order_number,
  supplier_id: po.supplier_id,
  order_date: po.order_date,
  expected_delivery_date: po.expected_delivery_date,
  items: po.items,
  total_amount: po.total_amount,
  status: po.status,
});

const mapFromSupabasePO = (data: any, supplierName?: string): PurchaseOrder => ({
  id: data.id,
  created_at: data.created_at,
  order_number: data.order_number,
  supplier_id: data.supplier_id,
  supplier_name: supplierName || data.supplier_id,
  order_date: data.order_date,
  expected_delivery_date: data.expected_delivery_date,
  items: data.items || [],
  total_amount: data.total_amount,
  status: data.status,
});

const mapToSupabaseInvoice = (inv: Omit<PurchaseInvoice, 'id' | 'created_at' | 'supplier_name'> & {id?:string}) => ({
    invoice_number: inv.invoice_number,
    purchase_order_id: inv.purchase_order_id,
    supplier_id: inv.supplier_id,
    invoice_date: inv.invoice_date,
    due_date: inv.due_date,
    items: inv.items,
    sub_total: inv.sub_total,
    tax_amount: inv.tax_amount,
    grand_total: inv.grand_total,
    status: inv.status,
});

const mapFromSupabaseInvoice = (data: any, supplierName?: string): PurchaseInvoice => ({
    id: data.id,
    created_at: data.created_at,
    invoice_number: data.invoice_number,
    purchase_order_id: data.purchase_order_id,
    supplier_id: data.supplier_id,
    supplier_name: supplierName || data.supplier_id,
    invoice_date: data.invoice_date,
    due_date: data.due_date,
    items: data.items || [],
    sub_total: data.sub_total,
    tax_amount: data.tax_amount,
    grand_total: data.grand_total,
    status: data.status,
});


const PurchasingPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductType[]>([]);
  
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [isLoadingPOs, setIsLoadingPOs] = useState(true);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | undefined>(undefined);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | undefined>(undefined);
  
  const [currentPOItems, setCurrentPOItems] = useState<PurchaseOrderItem[]>([]);
  const [currentInvoiceItems, setCurrentInvoiceItems] = useState<PurchaseOrderItem[]>([]);

  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSuppliers = useCallback(async () => {
    if (!user) return;
    setIsLoadingSuppliers(true);
    try {
      const { data, error } = await supabase.from('suppliers').select('*').order('name');
      if (error) throw error;
      setSuppliers(data.map(mapFromSupabaseSupplier));
    } catch (error: any) {
      toast({ title: 'خطأ في جلب الموردين', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoadingSuppliers(false);
    }
  }, [toast, user]);

  const fetchPOs = useCallback(async () => {
    if (!user) return;
    setIsLoadingPOs(true);
    try {
      const { data: posData, error: posError } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(name)')
        .order('order_date', { ascending: false });
      if (posError) throw posError;
      
      const populatedPOs = posData.map((po: any) => mapFromSupabasePO(po, po.suppliers?.name));
      setPurchaseOrders(populatedPOs);

    } catch (error: any)      {
      toast({ title: 'خطأ في جلب أوامر الشراء', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoadingPOs(false);
    }
  }, [toast, user]);

  const fetchInvoices = useCallback(async () => {
    if (!user) return;
    setIsLoadingInvoices(true);
    try {
      const { data: invData, error: invError } = await supabase
        .from('purchase_invoices')
        .select('*, suppliers(name)')
        .order('invoice_date', { ascending: false });
      if (invError) throw invError;

      const populatedInvoices = invData.map((inv: any) => mapFromSupabaseInvoice(inv, inv.suppliers?.name));
      setInvoices(populatedInvoices);

    } catch (error: any) {
      toast({ title: 'خطأ في جلب فواتير الشراء', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoadingInvoices(false);
    }
  }, [toast, user]);

  const fetchProductsForForm = useCallback(async () => {
    if(!user) return;
    setIsLoadingProducts(true);
    try {
        const {data, error} = await supabase.from('products').select('id, name, purchase_price, unit, stock').order('name');
        if(error) throw error;
        setAvailableProducts(data.map((p: any) => ({
            id: p.id,
            name: p.name,
            purchasePrice: p.purchase_price,
            unit: p.unit,
            stock: p.stock,
        } as ProductType)));
    } catch (error: any) {
        toast({ title: 'خطأ في جلب المنتجات للنماذج', description: error.message, variant: 'destructive'});
    } finally {
        setIsLoadingProducts(false);
    }
  }, [toast, user]);


  useEffect(() => {
    if (user) {
      fetchSuppliers();
      fetchProductsForForm(); 
      fetchPOs();
      fetchInvoices();
    }
  }, [user, fetchSuppliers, fetchProductsForForm, fetchPOs, fetchInvoices]);


  const handleAddSupplier = () => { setEditingSupplier(undefined); setIsSupplierModalOpen(true); };
  const handleEditSupplier = (supplier: Supplier) => { setEditingSupplier(supplier); setIsSupplierModalOpen(true); };
  const handleDeleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
      fetchSuppliers();
      toast({ title: 'تم حذف المورد'});
    } catch (error: any) {
      toast({ title: 'خطأ في حذف المورد', description: error.message, variant: 'destructive'});
    }
  };
  const handleSaveSupplier = async (data: Omit<Supplier, 'id' | 'created_at'> & {id?: string}) => {
    const supabaseData = mapToSupabaseSupplier(data);
    try {
      if (editingSupplier) {
        const { error } = await supabase.from('suppliers').update(supabaseData).eq('id', editingSupplier.id);
        if (error) throw error;
        toast({ title: 'تم تحديث المورد'});
      } else {
        const { error } = await supabase.from('suppliers').insert(supabaseData);
        if (error) throw error;
        toast({ title: 'تمت إضافة مورد'});
      }
      fetchSuppliers();
      setIsSupplierModalOpen(false);
      setEditingSupplier(undefined);
    } catch (error: any) {
      toast({ title: 'خطأ في حفظ المورد', description: error.message, variant: 'destructive'});
    }
  };

  const handleAddPO = () => { setEditingPO(undefined); setCurrentPOItems([]); setIsPOModalOpen(true); };
  const handleEditPO = (po: PurchaseOrder) => { setEditingPO(po); setCurrentPOItems(po.items || []); setIsPOModalOpen(true); };
  const handleDeletePO = async (id: string) => { 
    try {
        const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
        if (error) throw error;
        fetchPOs();
        toast({ title: 'تم حذف أمر الشراء'});
    } catch (error: any) {
        toast({ title: 'خطأ في حذف أمر الشراء', description: error.message, variant: 'destructive'});
    }
  };
  const handleSavePO = async (formData: Omit<PurchaseOrder, 'id'|'created_at'|'supplier_name'|'total_amount'> & {items: PurchaseOrderItem[], total_amount?: number}) => {
    const poToSave: Omit<PurchaseOrder, 'id'|'created_at'|'supplier_name'> = {
        ...formData,
        order_number: formData.order_number || `PO-${Date.now().toString().slice(-6)}`,
        items: currentPOItems,
        total_amount: currentPOItems.reduce((sum, item) => sum + item.total_price, 0),
    };
    const supabaseData = mapToSupabasePO(poToSave);
    try {
        if (editingPO) {
            const { error } = await supabase.from('purchase_orders').update(supabaseData).eq('id', editingPO.id);
            if (error) throw error;
            toast({ title: 'تم تحديث أمر الشراء'});
        } else {
            const { error } = await supabase.from('purchase_orders').insert(supabaseData);
            if (error) throw error;
            toast({ title: 'تم إنشاء أمر شراء'});
        }
        fetchPOs();
        setIsPOModalOpen(false);
        setEditingPO(undefined);
        setCurrentPOItems([]);
    } catch (error: any) {
        toast({ title: 'خطأ في حفظ أمر الشراء', description: error.message, variant: 'destructive'});
    }
  };
   const handlePOItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updatedItems = [...currentPOItems];
    const item = updatedItems[index] as any; 
    item[field] = value;

    if (field === 'product_id') {
        const product = availableProducts.find(p => p.id === value);
        item.productName = product?.name || '';
        item.unit_price = product?.purchasePrice || 0;
    }
    if (field === 'quantity' || field === 'unit_price' || field === 'product_id') {
      item.total_price = (item.quantity || 0) * (item.unit_price || 0);
    }
    setCurrentPOItems(updatedItems);
  };
  const addPOItem = () => setCurrentPOItems([...currentPOItems, { product_id: '', productName: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  const removePOItem = (index: number) => setCurrentPOItems(currentPOItems.filter((_, i) => i !== index));

  const handleAddInvoice = () => { setEditingInvoice(undefined); setCurrentInvoiceItems([]); setIsInvoiceModalOpen(true); };
  const handleEditInvoice = (invoice: PurchaseInvoice) => { setEditingInvoice(invoice); setCurrentInvoiceItems(invoice.items || []); setIsInvoiceModalOpen(true); };
  const handleDeleteInvoice = async (id: string) => { 
    try {
        const { error } = await supabase.from('purchase_invoices').delete().eq('id', id);
        if(error) throw error;
        fetchInvoices();
        toast({ title: 'تم حذف الفاتورة'});
    } catch(error: any) {
        toast({ title: 'خطأ في حذف الفاتورة', description: error.message, variant: 'destructive'});
    }
  };
  const handleSaveInvoice = async (formData: Omit<PurchaseInvoice, 'id'|'created_at'|'supplier_name'|'sub_total'|'grand_total'> & { items: PurchaseOrderItem[], tax_amount?: number, sub_total?: number, grand_total?: number}) => {
    const subTotal = currentInvoiceItems.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = formData.tax_amount || 0;
    const invoiceToSave: Omit<PurchaseInvoice, 'id'|'created_at'|'supplier_name'> = {
        ...formData,
        invoice_number: formData.invoice_number || `INV-${Date.now().toString().slice(-6)}`,
        items: currentInvoiceItems,
        sub_total: subTotal,
        tax_amount: taxAmount,
        grand_total: subTotal + taxAmount,
    };
    const supabaseData = mapToSupabaseInvoice(invoiceToSave);

    try {
        if (editingInvoice) {
            const { error } = await supabase.from('purchase_invoices').update(supabaseData).eq('id', editingInvoice.id);
            if (error) throw error;
            toast({ title: 'تم تحديث الفاتورة'});
            // Note: Stock update on edit is complex, needs to compare old vs new items. For now, only on new.
        } else {
            const { data: newInvoice, error } = await supabase.from('purchase_invoices').insert(supabaseData).select().single();
            if (error) throw error;
            if (newInvoice) {
                for (const item of currentInvoiceItems) {
                    const product = availableProducts.find(p => p.id === item.product_id);
                    if (product) {
                        const newStock = (product.stock || 0) + item.quantity;
                        const { error: stockError } = await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);
                        if (stockError) {
                            toast({ title: `خطأ في تحديث مخزون ${product.name}`, description: stockError.message, variant: 'destructive'});
                        }
                    }
                }
                toast({ title: 'تم إنشاء فاتورة شراء وتحديث المخزون'});
                fetchProductsForForm(); 
            }
        }
        fetchInvoices();
        setIsInvoiceModalOpen(false);
        setEditingInvoice(undefined);
        setCurrentInvoiceItems([]);
    } catch (error: any) {
        toast({ title: 'خطأ في حفظ الفاتورة', description: error.message, variant: 'destructive'});
    }
  };
  const handleInvoiceItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updatedItems = [...currentInvoiceItems];
    const item = updatedItems[index] as any;
    item[field] = value;
    if (field === 'product_id') {
        const product = availableProducts.find(p => p.id === value);
        item.productName = product?.name || '';
        item.unit_price = product?.purchasePrice || 0;
    }
    if (field === 'quantity' || field === 'unit_price' || field === 'product_id') {
      item.total_price = (item.quantity || 0) * (item.unit_price || 0);
    }
    setCurrentInvoiceItems(updatedItems);
  };
  const addInvoiceItem = () => setCurrentInvoiceItems([...currentInvoiceItems, { product_id: '', productName: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  const removeInvoiceItem = (index: number) => setCurrentInvoiceItems(currentInvoiceItems.filter((_, i) => i !== index));

  const getStatusBadgeClass = (status: PurchaseOrder['status'] | PurchaseInvoice['status']): string => {
    if (status === 'مدفوعة بالكامل' || status === 'مستلم بالكامل') return 'bg-green-500/20 text-green-700 border-green-500/30';
    if (status === 'غير مدفوعة' || status === 'مدفوعة جزئياً' || status === 'مرسل' || status === 'مؤكد' || status === 'مسودة' || status === 'مستلم جزئياً') return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
    if (status === 'متأخرة' || status === 'ملغى') return 'bg-red-500/20 text-red-700 border-red-500/30';
    return 'bg-muted/50 text-muted-foreground border-muted-foreground/30';
  };
  
  if (isLoadingProducts && isLoadingSuppliers && isLoadingPOs && isLoadingInvoices && !user) { 
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }
  
  if (!user && (!isLoadingProducts || !isLoadingSuppliers || !isLoadingPOs || !isLoadingInvoices)) { 
     return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-lg text-muted-foreground mb-4">يرجى تسجيل الدخول للوصول إلى قسم المشتريات.</p>
        </div>
      </AppLayout>
    );
  }


  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-headline font-semibold text-foreground">إدارة المشتريات</h1>
        
        <Tabs defaultValue="suppliers" className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="suppliers"><Users className="ml-1 h-4 w-4 sm:hidden md:inline-block" />الموردون</TabsTrigger>
              <TabsTrigger value="purchase-orders"><FileBox className="ml-1 h-4 w-4 sm:hidden md:inline-block" />أوامر الشراء</TabsTrigger>
              <TabsTrigger value="invoices"><FileText className="ml-1 h-4 w-4 sm:hidden md:inline-block" />فواتير الشراء</TabsTrigger>
            </TabsList>
            <div className="w-full sm:w-auto">
                <TabsContent value="suppliers" className="mt-0 !p-0 flex justify-end">
                    <Button onClick={handleAddSupplier} className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                        <PlusCircle className="ml-2 h-5 w-5" /> إضافة مورد
                    </Button>
                </TabsContent>
                <TabsContent value="purchase-orders" className="mt-0 !p-0 flex justify-end">
                    <Button onClick={handleAddPO} className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                        <PlusCircle className="ml-2 h-5 w-5" /> إنشاء أمر شراء
                    </Button>
                </TabsContent>
                <TabsContent value="invoices" className="mt-0 !p-0 flex justify-end">
                    <Button onClick={handleAddInvoice} className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                    <PlusCircle className="ml-2 h-5 w-5" /> إضافة فاتورة شراء
                    </Button>
                </TabsContent>
            </div>
          </div>

          <TabsContent value="suppliers">
            <Card className="shadow-lg">
              <CardHeader><CardTitle className="font-headline text-xl">قائمة الموردين ({suppliers.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead>مسؤول التواصل</TableHead><TableHead>البريد</TableHead><TableHead>الهاتف</TableHead><TableHead>العنوان</TableHead><TableHead className="text-left">الإجراءات</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {isLoadingSuppliers ? (
                        <TableRow><TableCell colSpan={6} className="text-center h-24"><PackageSearch className="h-12 w-12 mx-auto text-muted-foreground/30 animate-pulse" /></TableCell></TableRow>
                    ): suppliers.length > 0 ? suppliers.map(supplier => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium text-foreground">{supplier.name}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.contact_person || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.email || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.phone}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.address || '-'}</TableCell>
                        <TableCell className="text-left">
                          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => handleEditSupplier(supplier)}><FileEdit className="ml-2 h-4 w-4" />تعديل</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteSupplier(supplier.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2Icon className="ml-2 h-4 w-4" />حذف</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">لا يوجد موردون لعرضهم. قم بإضافة مورد جديد.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchase-orders">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle className="font-headline text-xl">أوامر الشراء ({purchaseOrders.length})</CardTitle>
                    <div className="flex gap-2">
                        <Input placeholder="بحث في أوامر الشراء..." className="max-w-xs bg-input/50 focus:bg-input"/>
                        <Button variant="outline"><Filter className="ml-2 h-4 w-4"/> تصفية</Button>
                    </div>
                </CardHeader>
              <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>رقم الأمر</TableHead><TableHead>المورد</TableHead><TableHead>تاريخ الطلب</TableHead><TableHead>تاريخ التسليم المتوقع</TableHead><TableHead className="text-left">الإجمالي</TableHead><TableHead className="text-center">الحالة</TableHead><TableHead className="text-left">الإجراءات</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {isLoadingPOs ? (
                        <TableRow><TableCell colSpan={7} className="text-center h-24"><PackageSearch className="h-12 w-12 mx-auto text-muted-foreground/30 animate-pulse" /></TableCell></TableRow>
                    ) : purchaseOrders.length > 0 ? purchaseOrders.map(po => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium text-foreground">{po.order_number}</TableCell>
                        <TableCell className="text-muted-foreground">{po.supplier_name}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(po.order_date).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell className="text-muted-foreground">{po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString('ar-EG') : '-'}</TableCell>
                        <TableCell className="text-left text-muted-foreground">{po.total_amount.toFixed(2)} ر.س</TableCell>
                        <TableCell className="text-center"><Badge className={getStatusBadgeClass(po.status)}>{po.status}</Badge></TableCell>
                        <TableCell className="text-left">
                          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => handleEditPO(po)}><FileEdit className="ml-2 h-4 w-4" />تعديل</DropdownMenuItem>
                              <DropdownMenuItem><Eye className="ml-2 h-4 w-4" />عرض التفاصيل</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeletePO(po.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2Icon className="ml-2 h-4 w-4" />حذف</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">لا توجد أوامر شراء لعرضها. قم بإنشاء أمر شراء جديد.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle className="font-headline text-xl">فواتير المشتريات ({invoices.length})</CardTitle>
                     <div className="flex gap-2">
                        <Input placeholder="بحث في الفواتير..." className="max-w-xs bg-input/50 focus:bg-input"/>
                        <Button variant="outline"><Filter className="ml-2 h-4 w-4"/> تصفية</Button>
                    </div>
                </CardHeader>
              <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>رقم الفاتورة</TableHead><TableHead>رقم أمر الشراء</TableHead><TableHead>المورد</TableHead><TableHead>تاريخ الفاتورة</TableHead><TableHead>تاريخ الاستحقاق</TableHead><TableHead className="text-left">الإجمالي</TableHead><TableHead className="text-center">الحالة</TableHead><TableHead className="text-left">الإجراءات</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {isLoadingInvoices ? (
                         <TableRow><TableCell colSpan={8} className="text-center h-24"><PackageSearch className="h-12 w-12 mx-auto text-muted-foreground/30 animate-pulse" /></TableCell></TableRow>
                    ): invoices.length > 0 ? invoices.map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium text-foreground">{invoice.invoice_number}</TableCell>
                        <TableCell className="text-muted-foreground">{invoice.purchase_order_id || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{invoice.supplier_name}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(invoice.invoice_date).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell className="text-muted-foreground">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('ar-EG') : '-'}</TableCell>
                        <TableCell className="text-left text-muted-foreground">{invoice.grand_total.toFixed(2)} ر.س</TableCell>
                        <TableCell className="text-center"><Badge className={getStatusBadgeClass(invoice.status)}>{invoice.status}</Badge></TableCell>
                        <TableCell className="text-left">
                           <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}><FileEdit className="ml-2 h-4 w-4" />تعديل</DropdownMenuItem>
                               <DropdownMenuItem><Printer className="ml-2 h-4 w-4" />طباعة</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteInvoice(invoice.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2Icon className="ml-2 h-4 w-4" />حذف</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )): (
                      <TableRow><TableCell colSpan={8} className="text-center h-24 text-muted-foreground">لا توجد فواتير شراء لعرضها. قم بإضافة فاتورة جديدة.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isSupplierModalOpen} onOpenChange={(isOpen) => { setIsSupplierModalOpen(isOpen); if (!isOpen) setEditingSupplier(undefined); }}>
          <DialogContent className="sm:max-w-lg bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingSupplier ? 'تعديل المورد' : 'إضافة مورد جديد'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleSaveSupplier({id: editingSupplier?.id, name: fd.get('s-name') as string, contact_person: fd.get('s-contact') as string, email: fd.get('s-email') as string, phone: fd.get('s-phone') as string, address: fd.get('s-address') as string, notes: fd.get('s-notes') as string });}} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
              <div><Label htmlFor="s-name">اسم المورد</Label><Input id="s-name" name="s-name" defaultValue={editingSupplier?.name} required className="mt-1 bg-input/50"/></div>
              <div><Label htmlFor="s-contact">مسؤول التواصل</Label><Input id="s-contact" name="s-contact" defaultValue={editingSupplier?.contact_person} className="mt-1 bg-input/50"/></div>
              <div><Label htmlFor="s-email">البريد الإلكتروني</Label><Input id="s-email" name="s-email" type="email" defaultValue={editingSupplier?.email} className="mt-1 bg-input/50"/></div>
              <div><Label htmlFor="s-phone">الهاتف</Label><Input id="s-phone" name="s-phone" type="tel" defaultValue={editingSupplier?.phone} required className="mt-1 bg-input/50"/></div>
              <div><Label htmlFor="s-address">العنوان</Label><Textarea id="s-address" name="s-address" defaultValue={editingSupplier?.address} className="mt-1 bg-input/50"/></div>
              <div><Label htmlFor="s-notes">ملاحظات</Label><Textarea id="s-notes" name="s-notes" defaultValue={editingSupplier?.notes} className="mt-1 bg-input/50"/></div>
              <DialogFooter><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ</Button><DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isPOModalOpen} onOpenChange={(isOpen) => { setIsPOModalOpen(isOpen); if (!isOpen) { setEditingPO(undefined); setCurrentPOItems([]);} }}>
          <DialogContent className="sm:max-w-2xl bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingPO ? `تعديل أمر الشراء: ${editingPO.order_number}` : 'إنشاء أمر شراء جديد'}</DialogTitle></DialogHeader>
             <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleSavePO({ order_number: editingPO?.order_number, order_date: fd.get('po-date') as string, expected_delivery_date: fd.get('po-expdate') as string | undefined, supplier_id: fd.get('po-supplier') as string, status: fd.get('po-status') as PurchaseOrder['status'], items: currentPOItems });}} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="po-supplier">المورد</Label>
                    <Select name="po-supplier" defaultValue={editingPO?.supplier_id} required dir="rtl">
                        <SelectTrigger className="mt-1 bg-input/50"><SelectValue placeholder={isLoadingSuppliers ? "جاري التحميل..." : "اختر المورد"} /></SelectTrigger>
                        <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div><Label htmlFor="po-status">الحالة</Label>
                    <Select name="po-status" defaultValue={editingPO?.status || 'مسودة'} required dir="rtl">
                        <SelectTrigger className="mt-1 bg-input/50"><SelectValue /></SelectTrigger>
                        <SelectContent>{['مسودة', 'مرسل', 'مؤكد', 'مستلم جزئياً', 'مستلم بالكامل', 'ملغى'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="po-date">تاريخ الطلب</Label><Input id="po-date" name="po-date" type="date" defaultValue={editingPO?.order_date || new Date().toISOString().split('T')[0]} required className="mt-1 bg-input/50"/></div>
                <div><Label htmlFor="po-expdate">تاريخ التسليم المتوقع</Label><Input id="po-expdate" name="po-expdate" type="date" defaultValue={editingPO?.expected_delivery_date || ''} className="mt-1 bg-input/50"/></div>
              </div>
              <Separator />
              <Label className="text-lg font-medium">بنود أمر الشراء</Label>
              {currentPOItems.map((item, index) => (
                <Card key={index} className="p-3 space-y-2 bg-muted/30">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                        <div><Label htmlFor={`po-item-prod-${index}`}>المنتج</Label>
                             <Select value={item.product_id} onValueChange={(val) => handlePOItemChange(index, 'product_id', val)} dir="rtl">
                                <SelectTrigger className="bg-input/50"><SelectValue placeholder={isLoadingProducts ? "جاري التحميل..." : "اختر منتجًا"}/></SelectTrigger>
                                <SelectContent>{availableProducts.map(p=><SelectItem key={p.id} value={p.id}>{p.name} ({p.purchasePrice?.toFixed(2)} ر.س)</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div><Label htmlFor={`po-item-qty-${index}`}>الكمية</Label><Input id={`po-item-qty-${index}`} type="number" value={item.quantity} onChange={e=>handlePOItemChange(index, 'quantity', parseFloat(e.target.value))} className="bg-input/50" min="1"/></div>
                        <div><Label htmlFor={`po-item-price-${index}`}>سعر الوحدة</Label><Input id={`po-item-price-${index}`} type="number" value={item.unit_price} onChange={e=>handlePOItemChange(index, 'unit_price', parseFloat(e.target.value))} className="bg-input/50" step="0.01"/></div>
                        <div className="flex items-end gap-2">
                             <span className="text-sm w-full text-center p-2 bg-background rounded-md">الإجمالي: {item.total_price.toFixed(2)}</span>
                            <Button type="button" variant="destructive" size="icon" onClick={() => removePOItem(index)} className="h-9 w-9"><Trash2Icon className="h-4 w-4"/></Button>
                        </div>
                    </div>
                </Card>
              ))}
              <Button type="button" variant="outline" onClick={addPOItem} className="w-full"><PlusCircle className="ml-2 h-4 w-4"/>إضافة بند</Button>
              <div className="text-right font-semibold text-lg">الإجمالي الكلي: {currentPOItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)} ر.س</div>
              <DialogFooter><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ أمر الشراء</Button><DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isInvoiceModalOpen} onOpenChange={(isOpen) => { setIsInvoiceModalOpen(isOpen); if (!isOpen) {setEditingInvoice(undefined); setCurrentInvoiceItems([]);} }}>
          <DialogContent className="sm:max-w-2xl bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingInvoice ? `تعديل فاتورة الشراء: ${editingInvoice.invoice_number}` : 'إضافة فاتورة شراء جديدة'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleSaveInvoice({invoice_number: editingInvoice?.invoice_number, invoice_date: fd.get('inv-date') as string, due_date: fd.get('inv-duedate') as string | undefined, supplier_id: fd.get('inv-supplier') as string, purchase_order_id: fd.get('inv-po') as string | undefined, status: fd.get('inv-status') as PurchaseInvoice['status'], tax_amount: parseFloat(fd.get('inv-tax') as string || '0'), items: currentInvoiceItems });}} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label htmlFor="inv-supplier">المورد</Label>
                        <Select name="inv-supplier" defaultValue={editingInvoice?.supplier_id} required dir="rtl">
                            <SelectTrigger className="mt-1 bg-input/50"><SelectValue placeholder={isLoadingSuppliers ? "جاري التحميل..." : "اختر المورد"} /></SelectTrigger>
                            <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div><Label htmlFor="inv-po">أمر الشراء (اختياري)</Label>
                        <Select name="inv-po" defaultValue={editingInvoice?.purchase_order_id || ""} dir="rtl">
                            <SelectTrigger className="mt-1 bg-input/50"><SelectValue placeholder={isLoadingPOs ? "جاري التحميل..." : "اختر أمر شراء (إن وجد)"} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">-- لا يوجد --</SelectItem>
                                {purchaseOrders.map(po => <SelectItem key={po.id} value={po.order_number}>{po.order_number} - {po.supplier_name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><Label htmlFor="inv-date">تاريخ الفاتورة</Label><Input id="inv-date" name="inv-date" type="date" defaultValue={editingInvoice?.invoice_date || new Date().toISOString().split('T')[0]} required className="mt-1 bg-input/50"/></div>
                    <div><Label htmlFor="inv-duedate">تاريخ الاستحقاق</Label><Input id="inv-duedate" name="inv-duedate" type="date" defaultValue={editingInvoice?.due_date || ''} className="mt-1 bg-input/50"/></div>
                    <div><Label htmlFor="inv-status">حالة الدفع</Label>
                        <Select name="inv-status" defaultValue={editingInvoice?.status || 'غير مدفوعة'} required dir="rtl">
                            <SelectTrigger className="mt-1 bg-input/50"><SelectValue /></SelectTrigger>
                            <SelectContent>{['غير مدفوعة', 'مدفوعة جزئياً', 'مدفوعة بالكامل', 'متأخرة'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
                <Separator />
                 <Label className="text-lg font-medium">بنود الفاتورة</Label>
                {currentInvoiceItems.map((item, index) => (
                    <Card key={index} className="p-3 space-y-2 bg-muted/30">
                         <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                            <div><Label>المنتج</Label>
                                <Select value={item.product_id} onValueChange={(val) => handleInvoiceItemChange(index, 'product_id', val)} dir="rtl">
                                <SelectTrigger className="bg-input/50"><SelectValue placeholder={isLoadingProducts ? "جاري التحميل..." : "اختر منتجًا"}/></SelectTrigger>
                                <SelectContent>{availableProducts.map(p=><SelectItem key={p.id} value={p.id}>{p.name} ({p.purchasePrice?.toFixed(2)} ر.س)</SelectItem>)}</SelectContent>
                            </Select>
                            </div>
                            <div><Label>الكمية</Label><Input type="number" value={item.quantity} onChange={e=>handleInvoiceItemChange(index, 'quantity', parseFloat(e.target.value))} className="bg-input/50" min="1"/></div>
                            <div><Label>سعر الوحدة</Label><Input type="number" value={item.unit_price} onChange={e=>handleInvoiceItemChange(index, 'unit_price', parseFloat(e.target.value))} className="bg-input/50" step="0.01"/></div>
                            <div className="flex items-end gap-2">
                                <span className="text-sm w-full text-center p-2 bg-background rounded-md">الإجمالي: {item.total_price.toFixed(2)}</span>
                                <Button type="button" variant="destructive" size="icon" onClick={() => removeInvoiceItem(index)} className="h-9 w-9"><Trash2Icon className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    </Card>
                ))}
                <Button type="button" variant="outline" onClick={addInvoiceItem} className="w-full"><PlusCircle className="ml-2 h-4 w-4"/>إضافة بند للفاتورة</Button>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2 space-y-1">
                        <p className="text-sm">المجموع الفرعي: <span className="font-semibold">{currentInvoiceItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)} ر.س</span></p>
                    </div>
                    <div><Label htmlFor="inv-tax">مبلغ الضريبة</Label><Input id="inv-tax" name="inv-tax" type="number" defaultValue={editingInvoice?.tax_amount || 0} step="0.01" className="mt-1 bg-input/50"/></div>
                </div>
                 <div className="text-right font-semibold text-lg">الإجمالي الكلي للفاتورة: <span className="font-headline text-primary">{(currentInvoiceItems.reduce((sum, item) => sum + item.total_price, 0) + parseFloat((document.querySelector('input[name="inv-tax"]') as HTMLInputElement)?.value || '0')).toFixed(2)} ر.س</span></div>

              <DialogFooter><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ الفاتورة</Button><DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
};

export default PurchasingPage;
    
