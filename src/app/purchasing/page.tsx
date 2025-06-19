
// src/app/purchasing/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, FileText, Users, Filter, Printer, Trash2 as Trash2Icon, PackageSearch } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileEdit } from 'lucide-react';
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

interface PurchaseItem { 
  id?: string; // ID from purchase_invoice_items if editing/displaying
  product_id: string;
  productName?: string; 
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PurchaseInvoice {
  id: string;
  created_at?: string;
  invoice_number: string;
  supplier_id: string;
  supplier_name?: string; 
  invoice_date: string;
  due_date?: string;
  items: PurchaseItem[]; 
  sub_total: number;
  tax_amount: number;
  grand_total: number;
  status: 'غير مدفوعة' | 'مدفوعة جزئياً' | 'مدفوعة بالكامل' | 'متأخرة';
}

// Mappers
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

const mapFromSupabaseInvoice = (data: any, supplierName?: string): PurchaseInvoice => ({
    id: data.id,
    created_at: data.created_at,
    invoice_number: data.invoice_number,
    supplier_id: data.supplier_id,
    supplier_name: supplierName || data.suppliers?.name || data.supplier_id, 
    invoice_date: data.invoice_date,
    due_date: data.due_date,
    items: (data.purchase_invoice_items || []).map((item: any) => ({
        id: item.id, // ID of the purchase_invoice_item record
        product_id: item.product_id,
        productName: item.products?.name || 'منتج غير معروف',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
    })),
    sub_total: data.sub_total,
    tax_amount: data.tax_amount,
    grand_total: data.grand_total,
    status: data.status,
});


const PurchasingPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductType[]>([]);
  
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | undefined>(undefined);
  
  const [currentInvoiceItems, setCurrentInvoiceItems] = useState<PurchaseItem[]>([]);
  const [invoiceTaxAmount, setInvoiceTaxAmount] = useState<number>(0);


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

  const fetchInvoices = useCallback(async () => {
    if (!user) return;
    setIsLoadingInvoices(true);
    try {
      const { data: invData, error: invError } = await supabase
        .from('purchase_invoices')
        .select('*, suppliers(name), purchase_invoice_items(*, products(id, name))') 
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
            description: p.description || '',
            category: p.category || 'غير محدد',
            productType: p.product_type || 'منتج عادي',
            salePrice: p.sale_price || 0,
            minStockLevel: p.min_stock_level || 0,
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
      fetchInvoices();
    }
  }, [user, fetchSuppliers, fetchProductsForForm, fetchInvoices]);

  const handleAddSupplier = () => { setEditingSupplier(undefined); setIsSupplierModalOpen(true); };
  const handleEditSupplier = (supplier: Supplier) => { setEditingSupplier(supplier); setIsSupplierModalOpen(true); };
  const handleDeleteSupplier = async (id: string) => {
    try {
      // Check if supplier is used in any purchase_invoices
      const { data: invoicesWithSupplier, error: checkError } = await supabase
        .from('purchase_invoices')
        .select('id')
        .eq('supplier_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (invoicesWithSupplier && invoicesWithSupplier.length > 0) {
        toast({
          title: 'لا يمكن حذف المورد',
          description: 'هذا المورد مستخدم في فاتورة شراء واحدة على الأقل. يرجى حذف الفواتير المرتبطة أولاً.',
          variant: 'destructive',
        });
        return;
      }

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
      if (editingSupplier && editingSupplier.id) {
        const { error } = await supabase.from('suppliers').update(supabaseData).eq('id', editingSupplier.id);
        if (error) throw error;
        toast({ title: 'تم تحديث المورد'});
      } else {
        const { error } = await supabase.from('suppliers').insert([supabaseData]); // Supabase v2 expects an array for insert
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

  const handleAddInvoice = () => { setEditingInvoice(undefined); setCurrentInvoiceItems([]); setInvoiceTaxAmount(0); setIsInvoiceModalOpen(true); };
  const handleEditInvoice = (invoice: PurchaseInvoice) => { 
    setEditingInvoice(invoice); 
    const itemsWithNames = invoice.items.map(item => {
        const product = availableProducts.find(p => p.id === item.product_id);
        return {...item, productName: product?.name || item.product_id };
    });
    setCurrentInvoiceItems(itemsWithNames || []); 
    setInvoiceTaxAmount(invoice.tax_amount || 0);
    setIsInvoiceModalOpen(true); 
  };

  const handleDeleteInvoice = async (id: string) => { 
    try {
        // First, delete items associated with the invoice
        const { error: itemError } = await supabase.from('purchase_invoice_items').delete().eq('purchase_invoice_id', id);
        if(itemError) throw itemError;

        // Then, delete the invoice itself
        const { error: invoiceError } = await supabase.from('purchase_invoices').delete().eq('id', id);
        if(invoiceError) throw invoiceError;

        fetchInvoices();
        toast({ title: 'تم حذف الفاتورة وبنودها'});
    } catch(error: any) {
        toast({ title: 'خطأ في حذف الفاتورة', description: error.message, variant: 'destructive'});
    }
  };

  const handleSaveInvoice = async (formData: Omit<PurchaseInvoice, 'id'|'created_at'|'supplier_name'|'sub_total'|'grand_total'|'items'> & { items?: PurchaseItem[], tax_amount?: number, sub_total?: number, grand_total?: number}) => {
    const subTotal = currentInvoiceItems.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = formData.tax_amount || 0; 
    
    const mainInvoiceData = {
        invoice_number: formData.invoice_number || `INV-${Date.now().toString().slice(-6)}`,
        supplier_id: formData.supplier_id,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date || null,
        sub_total: subTotal,
        tax_amount: taxAmount,
        grand_total: subTotal + taxAmount,
        status: formData.status,
    };

    try {
        if (editingInvoice && editingInvoice.id) {
            // 1. Update main invoice data
            const { error: updateError } = await supabase.from('purchase_invoices').update(mainInvoiceData).eq('id', editingInvoice.id);
            if (updateError) throw updateError;

            // 2. Delete existing items for this invoice
            const { error: deleteItemsError } = await supabase.from('purchase_invoice_items').delete().eq('purchase_invoice_id', editingInvoice.id);
            if (deleteItemsError) throw deleteItemsError;

            // 3. Insert current items as new
            if (currentInvoiceItems.length > 0) {
                const itemsToInsert = currentInvoiceItems.map(item => ({
                    purchase_invoice_id: editingInvoice.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_price: item.total_price,
                }));
                const { error: insertItemsError } = await supabase.from('purchase_invoice_items').insert(itemsToInsert);
                if (insertItemsError) throw insertItemsError;
            }
            toast({ title: 'تم تحديث الفاتورة'});
            // Stock is not updated on invoice edit as per previous discussions to avoid complexity.
            // A comment can be added here if needed.
            console.warn("Stock not updated on invoice edit. This requires advanced logic for calculating differences.");
        } else { // New Invoice
            // 1. Insert main invoice data
            const { data: newInvoice, error: insertError } = await supabase.from('purchase_invoices').insert(mainInvoiceData).select().single();
            if (insertError) throw insertError;
            if (!newInvoice) throw new Error("Failed to create new invoice record.");

            const newInvoiceId = newInvoice.id;

            // 2. Insert items
            if (currentInvoiceItems.length > 0) {
                const itemsToInsert = currentInvoiceItems.map(item => ({
                    purchase_invoice_id: newInvoiceId,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_price: item.total_price,
                }));
                const { error: insertItemsError } = await supabase.from('purchase_invoice_items').insert(itemsToInsert);
                if (insertItemsError) throw insertItemsError;
            }

            // 3. Update stock for each product
            for (const item of currentInvoiceItems) {
                const product = availableProducts.find(p => p.id === item.product_id);
                if (product) {
                    const { data: currentProductData, error: fetchError } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
                    if(fetchError || !currentProductData) {
                        toast({ title: `خطأ في جلب مخزون ${product.name}`, description: fetchError?.message, variant: 'destructive'});
                        continue; 
                    }
                    const newStock = (currentProductData.stock || 0) + item.quantity;
                    const { error: stockError } = await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);
                    if (stockError) {
                        toast({ title: `خطأ في تحديث مخزون ${product.name}`, description: stockError.message, variant: 'destructive'});
                    }
                }
            }
            toast({ title: 'تم إنشاء فاتورة شراء وتحديث المخزون'});
            await fetchProductsForForm(); // Refetch products to reflect new stock
        }
        fetchInvoices();
        setIsInvoiceModalOpen(false);
        setEditingInvoice(undefined);
        setCurrentInvoiceItems([]);
        setInvoiceTaxAmount(0);
    } catch (error: any) {
        toast({ title: 'خطأ في حفظ الفاتورة', description: error.message, variant: 'destructive'});
    }
  };
  const handleInvoiceItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    const updatedItems = [...currentInvoiceItems];
    const item = updatedItems[index] as any; // Using any for dynamic field assignment
    item[field] = value;

    if (field === 'product_id') {
        const product = availableProducts.find(p => p.id === value);
        item.productName = product?.name || '';
        item.unit_price = product?.purchasePrice || 0; 
    }
    // Recalculate total_price if quantity or unit_price changes, or if product_id changes (which updates unit_price)
    if (field === 'quantity' || field === 'unit_price' || field === 'product_id') {
      const quantity = Number(item.quantity) || 0;
      const unit_price = Number(item.unit_price) || 0;
      item.total_price = quantity * unit_price;
    }
    setCurrentInvoiceItems(updatedItems);
  };
  const addInvoiceItem = () => setCurrentInvoiceItems([...currentInvoiceItems, { product_id: '', productName: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  const removeInvoiceItem = (index: number) => setCurrentInvoiceItems(currentInvoiceItems.filter((_, i) => i !== index));

  const getStatusBadgeClass = (status: PurchaseInvoice['status']): string => {
    if (status === 'مدفوعة بالكامل') return 'bg-green-500/20 text-green-700 border-green-500/30';
    if (status === 'غير مدفوعة' || status === 'مدفوعة جزئياً') return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
    if (status === 'متأخرة') return 'bg-red-500/20 text-red-700 border-red-500/30';
    return 'bg-muted/50 text-muted-foreground border-muted-foreground/30';
  };
  
  const invoiceSubTotal = currentInvoiceItems.reduce((sum, item) => sum + item.total_price, 0);
  const invoiceGrandTotal = invoiceSubTotal + invoiceTaxAmount;


  if (isLoadingProducts && isLoadingSuppliers && isLoadingInvoices && !user) { 
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }
  
  if (!user && (!isLoadingProducts || !isLoadingSuppliers || !isLoadingInvoices)) { 
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
            <TabsList className="grid grid-cols-2 w-full sm:w-auto">
              <TabsTrigger value="suppliers"><Users className="ml-1 h-4 w-4 sm:hidden md:inline-block" />الموردون</TabsTrigger>
              <TabsTrigger value="invoices"><FileText className="ml-1 h-4 w-4 sm:hidden md:inline-block" />فواتير الشراء</TabsTrigger>
            </TabsList>
            <div className="w-full sm:w-auto">
                <TabsContent value="suppliers" className="mt-0 !p-0 flex justify-end">
                    <Button onClick={handleAddSupplier} className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                        <PlusCircle className="ml-2 h-5 w-5" /> إضافة مورد
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
                  <TableHeader><TableRow><TableHead>رقم الفاتورة</TableHead><TableHead>المورد</TableHead><TableHead>تاريخ الفاتورة</TableHead><TableHead>تاريخ الاستحقاق</TableHead><TableHead className="text-left">الإجمالي</TableHead><TableHead className="text-center">الحالة</TableHead><TableHead className="text-left">الإجراءات</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {isLoadingInvoices ? (
                         <TableRow><TableCell colSpan={7} className="text-center h-24"><PackageSearch className="h-12 w-12 mx-auto text-muted-foreground/30 animate-pulse" /></TableCell></TableRow>
                    ): invoices.length > 0 ? invoices.map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium text-foreground">{invoice.invoice_number}</TableCell>
                        <TableCell className="text-muted-foreground">{invoice.supplier_name}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(invoice.invoice_date).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell className="text-muted-foreground">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('ar-EG') : '-'}</TableCell>
                        <TableCell className="text-left text-muted-foreground">{invoice.grand_total.toFixed(2)} ل.س</TableCell>
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
                      <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">لا توجد فواتير شراء لعرضها. قم بإضافة فاتورة جديدة.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Supplier Modal */}
        <Dialog open={isSupplierModalOpen} onOpenChange={(isOpen) => { setIsSupplierModalOpen(isOpen); if (!isOpen) setEditingSupplier(undefined); }}>
          <DialogContent className="sm:max-w-lg bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingSupplier ? 'تعديل المورد' : 'إضافة مورد جديد'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleSaveSupplier({id: editingSupplier?.id, name: fd.get('s-name') as string, contact_person: fd.get('s-contact') as string | undefined, email: fd.get('s-email') as string | undefined, phone: fd.get('s-phone') as string, address: fd.get('s-address') as string | undefined, notes: fd.get('s-notes') as string | undefined });}} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
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

        {/* Purchase Invoice Modal */}
        <Dialog open={isInvoiceModalOpen} onOpenChange={(isOpen) => { setIsInvoiceModalOpen(isOpen); if (!isOpen) {setEditingInvoice(undefined); setCurrentInvoiceItems([]); setInvoiceTaxAmount(0); } }}>
          <DialogContent className="sm:max-w-2xl bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingInvoice ? `تعديل فاتورة الشراء: ${editingInvoice.invoice_number}` : 'إضافة فاتورة شراء جديدة'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleSaveInvoice({invoice_number: fd.get('inv-number') as string || editingInvoice?.invoice_number, invoice_date: fd.get('inv-date') as string, due_date: fd.get('inv-duedate') as string | undefined, supplier_id: fd.get('inv-supplier') as string, status: fd.get('inv-status') as PurchaseInvoice['status'], tax_amount: parseFloat(fd.get('inv-tax') as string || '0')});}} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label htmlFor="inv-number">رقم الفاتورة (اتركه فارغًا للإنشاء التلقائي)</Label><Input id="inv-number" name="inv-number" defaultValue={editingInvoice?.invoice_number} className="mt-1 bg-input/50"/></div>
                    <div><Label htmlFor="inv-supplier">المورد</Label>
                        <Select name="inv-supplier" defaultValue={editingInvoice?.supplier_id} required dir="rtl">
                            <SelectTrigger className="mt-1 bg-input/50"><SelectValue placeholder={isLoadingSuppliers ? "جاري التحميل..." : "اختر المورد"} /></SelectTrigger>
                            <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
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
                         <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-end">
                            <div><Label>المنتج</Label>
                                <Select value={item.product_id} onValueChange={(val) => handleInvoiceItemChange(index, 'product_id', val)} dir="rtl" required>
                                <SelectTrigger className="bg-input/50"><SelectValue placeholder={isLoadingProducts ? "جاري التحميل..." : "اختر منتجًا"}/></SelectTrigger>
                                <SelectContent>{availableProducts.map(p=><SelectItem key={p.id} value={p.id}>{p.name} (شراء: {p.purchasePrice?.toFixed(2)} ل.س)</SelectItem>)}</SelectContent>
                            </Select>
                            </div>
                            <div><Label>الكمية</Label><Input type="number" value={item.quantity} onChange={e=>handleInvoiceItemChange(index, 'quantity', parseFloat(e.target.value))} className="bg-input/50" min="1" required/></div>
                            <div><Label>سعر الوحدة</Label><Input type="number" value={item.unit_price} onChange={e=>handleInvoiceItemChange(index, 'unit_price', parseFloat(e.target.value))} className="bg-input/50" step="0.01" required/></div>
                            <div className="flex items-center pt-5">
                                <span className="text-sm w-full text-left p-2 bg-background rounded-md min-w-[80px]"> {item.total_price.toFixed(2)} ل.س</span>
                            </div>
                            <Button type="button" variant="destructive" size="icon" onClick={() => removeInvoiceItem(index)} className="h-9 w-9 self-end"><Trash2Icon className="h-4 w-4"/></Button>
                        </div>
                    </Card>
                ))}
                <Button type="button" variant="outline" onClick={addInvoiceItem} className="w-full"><PlusCircle className="ml-2 h-4 w-4"/>إضافة بند للفاتورة</Button>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2 space-y-1 pt-4">
                        <p className="text-md">المجموع الفرعي: <span className="font-semibold">{invoiceSubTotal.toFixed(2)} ل.س</span></p>
                    </div>
                    <div><Label htmlFor="inv-tax">مبلغ الضريبة</Label><Input id="inv-tax" name="inv-tax" type="number" value={invoiceTaxAmount} onChange={(e) => setInvoiceTaxAmount(parseFloat(e.target.value) || 0)} step="0.01" className="mt-1 bg-input/50"/></div>
                </div>
                 <div className="text-right font-semibold text-lg">الإجمالي الكلي للفاتورة: <span className="font-headline text-primary">{invoiceGrandTotal.toFixed(2)} ل.س</span></div>
                 {editingInvoice && <p className="text-xs text-muted-foreground">ملاحظة: تحديث المخزون عند تعديل فاتورة شراء حالياً لا يعيد حساب الفروقات في كميات البنود. يتم تحديث المخزون بشكل أساسي عند إنشاء فاتورة جديدة. لضمان دقة المخزون عند التعديل، يتطلب الأمر منطقاً متقدماً (يفضل عبر وظائف خلفية أو trigger في قاعدة البيانات).</p>}

              <DialogFooter><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoadingProducts || isLoadingSuppliers || currentInvoiceItems.some(item => !item.product_id)}>حفظ الفاتورة</Button><DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
};

export default PurchasingPage;
    
