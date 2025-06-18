
// src/app/purchasing/page.tsx
"use client";

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, FileBox, Users, FileText, Filter, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileEdit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
}

interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'مسودة' | 'مرسل' | 'مؤكد' | 'مستلم جزئياً' | 'مستلم بالكامل' | 'ملغى';
}

interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  purchaseOrderId?: string;
  supplierId: string;
  supplierName?: string; 
  invoiceDate: string;
  dueDate?: string;
  items: PurchaseOrderItem[]; // Assuming invoice items mirror PO items for simplicity
  subTotal: number;
  taxAmount: number;
  grandTotal: number;
  status: 'غير مدفوعة' | 'مدفوعة جزئياً' | 'مدفوعة بالكامل' | 'متأخرة';
}

const initialSuppliers: Supplier[] = [
  { id: 's1', name: 'شركة المنتجات الطازجة', contactPerson: 'أحمد خالد', email: 'ahmad@freshproduce.com', phone: '٠٥٥٥٠١٠١', address: 'الرياض، السعودية' },
  { id: 's2', name: 'مخبوزات الخير المحدودة', contactPerson: 'فاطمة علي', email: 'fatima@bakerygoods.com', phone: '٠٥٥٥٠١٠٢', address: 'جدة، السعودية' },
];

const initialPurchaseOrders: PurchaseOrder[] = [
  { id: 'po1', orderNumber: 'PO-2024-001', supplierId: 's1', supplierName: 'شركة المنتجات الطازجة', orderDate: '2024-07-10', expectedDeliveryDate: '2024-07-15', items: [{productId: 'p1', productName: 'تفاح عضوي', quantity: 100, unitPrice: 2, totalPrice: 200}], totalAmount: 200, status: 'مرسل' },
  { id: 'po2', orderNumber: 'PO-2024-002', supplierId: 's2', supplierName: 'مخبوزات الخير المحدودة', orderDate: '2024-07-12', items: [{productId: 'p2', productName: 'خبز قمح', quantity: 50, unitPrice: 3, totalPrice: 150}], totalAmount: 150, status: 'مؤكد' },
];

const initialInvoices: PurchaseInvoice[] = [
  { id: 'inv1', invoiceNumber: 'INV-2024-001', purchaseOrderId: 'po1', supplierId: 's1', supplierName: 'شركة المنتجات الطازجة', invoiceDate: '2024-07-15', dueDate: '2024-08-14', items: [{productId: 'p1', productName: 'تفاح عضوي', quantity: 100, unitPrice: 2, totalPrice: 200}], subTotal: 200, taxAmount: 30, grandTotal: 230, status: 'غير مدفوعة' },
];

// Mock products for PO/Invoice item selection
const mockProducts = [
    {id: 'p1', name: 'تفاح عضوي', unitPrice: 2},
    {id: 'p2', name: 'خبز قمح', unitPrice: 3},
    {id: 'p3', name: 'بيض', unitPrice: 4},
];


const PurchasingPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>(initialInvoices);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | undefined>(undefined);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | undefined>(undefined);
  
  const [currentPOItems, setCurrentPOItems] = useState<PurchaseOrderItem[]>([]);
  const [currentInvoiceItems, setCurrentInvoiceItems] = useState<PurchaseOrderItem[]>([]);


  const { toast } = useToast();

  // Supplier Handlers
  const handleAddSupplier = () => { setEditingSupplier(undefined); setIsSupplierModalOpen(true); };
  const handleEditSupplier = (supplier: Supplier) => { setEditingSupplier(supplier); setIsSupplierModalOpen(true); };
  const handleDeleteSupplier = (id: string) => { 
    setSuppliers(prev => prev.filter(s => s.id !== id));
    toast({ title: 'تم حذف المورد' });
  };
  const handleSaveSupplier = (data: Omit<Supplier, 'id'>) => {
    if (editingSupplier) {
      setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? { ...editingSupplier, ...data } : s));
      toast({ title: 'تم تحديث المورد' });
    } else {
      setSuppliers(prev => [...prev, { ...data, id: String(Date.now()) }]);
      toast({ title: 'تمت إضافة مورد' });
    }
    setIsSupplierModalOpen(false);
  };

  // Purchase Order Handlers
  const handleAddPO = () => { setEditingPO(undefined); setCurrentPOItems([]); setIsPOModalOpen(true); };
  const handleEditPO = (po: PurchaseOrder) => { setEditingPO(po); setCurrentPOItems(po.items); setIsPOModalOpen(true); };
  const handleDeletePO = (id: string) => { 
    setPurchaseOrders(prev => prev.filter(po => po.id !== id));
    toast({ title: 'تم حذف أمر الشراء' });
  };
  const handleSavePO = (data: Omit<PurchaseOrder, 'id' | 'items' | 'totalAmount' | 'supplierName'> & { items: PurchaseOrderItem[]}) => {
    const supplier = suppliers.find(s => s.id === data.supplierId);
    const totalAmount = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    if (editingPO) {
      setPurchaseOrders(prev => prev.map(po => po.id === editingPO.id ? { ...editingPO, ...data, supplierName: supplier?.name, totalAmount } : po));
      toast({ title: 'تم تحديث أمر الشراء' });
    } else {
      setPurchaseOrders(prev => [...prev, { ...data, id: String(Date.now()), orderNumber: `PO-${Date.now().toString().slice(-4)}`, supplierName: supplier?.name, totalAmount }]);
      toast({ title: 'تم إنشاء أمر شراء' });
    }
    setIsPOModalOpen(false);
  };
   const handlePOItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updatedItems = [...currentPOItems];
    const item = updatedItems[index] as any;
    item[field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      item.totalPrice = (item.quantity || 0) * (item.unitPrice || 0);
    }
    if (field === 'productId') {
        const product = mockProducts.find(p => p.id === value);
        item.productName = product?.name || '';
        item.unitPrice = product?.unitPrice || 0;
        item.totalPrice = (item.quantity || 0) * (item.unitPrice || 0);
    }
    setCurrentPOItems(updatedItems);
  };
  const addPOItem = () => setCurrentPOItems([...currentPOItems, { productId: '', productName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  const removePOItem = (index: number) => setCurrentPOItems(currentPOItems.filter((_, i) => i !== index));


  // Purchase Invoice Handlers
  const handleAddInvoice = () => { setEditingInvoice(undefined); setCurrentInvoiceItems([]); setIsInvoiceModalOpen(true); };
  const handleEditInvoice = (invoice: PurchaseInvoice) => { setEditingInvoice(invoice); setCurrentInvoiceItems(invoice.items); setIsInvoiceModalOpen(true); };
  const handleDeleteInvoice = (id: string) => { 
    setInvoices(prev => prev.filter(i => i.id !== id));
    toast({ title: 'تم حذف الفاتورة' });
  };
  const handleSaveInvoice = (data: Omit<PurchaseInvoice, 'id' | 'items' | 'subTotal' | 'grandTotal' | 'supplierName'> & { items: PurchaseOrderItem[]}) => {
    const supplier = suppliers.find(s => s.id === data.supplierId);
    const subTotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = data.taxAmount || 0; // Assuming taxAmount is part of form data
    const grandTotal = subTotal + taxAmount;

    if (editingInvoice) {
      setInvoices(prev => prev.map(i => i.id === editingInvoice.id ? { ...editingInvoice, ...data, supplierName: supplier?.name, subTotal, grandTotal } : i));
      toast({ title: 'تم تحديث الفاتورة' });
    } else {
      setInvoices(prev => [...prev, { ...data, id: String(Date.now()), invoiceNumber: `INV-${Date.now().toString().slice(-4)}`, supplierName: supplier?.name, subTotal, grandTotal }]);
      toast({ title: 'تم إنشاء فاتورة شراء' });
    }
    setIsInvoiceModalOpen(false);
  };
  const handleInvoiceItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updatedItems = [...currentInvoiceItems];
    const item = updatedItems[index] as any;
    item[field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      item.totalPrice = (item.quantity || 0) * (item.unitPrice || 0);
    }
     if (field === 'productId') {
        const product = mockProducts.find(p => p.id === value);
        item.productName = product?.name || '';
        item.unitPrice = product?.unitPrice || 0;
        item.totalPrice = (item.quantity || 0) * (item.unitPrice || 0);
    }
    setCurrentInvoiceItems(updatedItems);
  };
  const addInvoiceItem = () => setCurrentInvoiceItems([...currentInvoiceItems, { productId: '', productName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  const removeInvoiceItem = (index: number) => setCurrentInvoiceItems(currentInvoiceItems.filter((_, i) => i !== index));


  const getStatusBadgeVariant = (status: PurchaseOrder['status'] | PurchaseInvoice['status']): any => {
    if (['مرسل', 'مؤكد', 'غير مدفوعة', 'مدفوعة جزئياً'].includes(status)) return 'secondary';
    if (['مستلم بالكامل', 'مدفوعة بالكامل'].includes(status)) return 'default'; // success
    if (['ملغى', 'متأخرة'].includes(status)) return 'destructive';
    return 'outline';
  };
   const getStatusBadgeClass = (status: PurchaseOrder['status'] | PurchaseInvoice['status']): string => {
    if (status === 'مدفوعة بالكامل' || status === 'مستلم بالكامل') return 'bg-green-500/20 text-green-700 border-green-500/30';
    if (status === 'غير مدفوعة' || status === 'مدفوعة جزئياً' || status === 'مرسل' || status === 'مؤكد' || status === 'مسودة' || status === 'مستلم جزئياً') return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
    if (status === 'متأخرة' || status === 'ملغى') return 'bg-red-500/20 text-red-700 border-red-500/30';
    return '';
  };


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
              <CardHeader><CardTitle className="font-headline text-xl">قائمة الموردين</CardTitle></CardHeader>
              <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead>مسؤول التواصل</TableHead><TableHead>البريد</TableHead><TableHead>الهاتف</TableHead><TableHead>العنوان</TableHead><TableHead className="text-left">الإجراءات</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {suppliers.map(supplier => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium text-foreground">{supplier.name}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.contactPerson}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.email}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.phone}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.address || '-'}</TableCell>
                        <TableCell className="text-left">
                          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => handleEditSupplier(supplier)}><FileEdit className="ml-2 h-4 w-4" />تعديل</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteSupplier(supplier.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="ml-2 h-4 w-4" />حذف</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchase-orders">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle className="font-headline text-xl">أوامر الشراء</CardTitle>
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
                    {purchaseOrders.map(po => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium text-foreground">{po.orderNumber}</TableCell>
                        <TableCell className="text-muted-foreground">{po.supplierName}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(po.orderDate).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell className="text-muted-foreground">{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('ar-EG') : '-'}</TableCell>
                        <TableCell className="text-left text-muted-foreground">{po.totalAmount.toFixed(2)} ر.س</TableCell>
                        <TableCell className="text-center"><Badge variant={getStatusBadgeVariant(po.status)} className={getStatusBadgeClass(po.status)}>{po.status}</Badge></TableCell>
                        <TableCell className="text-left">
                          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => handleEditPO(po)}><FileEdit className="ml-2 h-4 w-4" />تعديل</DropdownMenuItem>
                              <DropdownMenuItem><Eye className="ml-2 h-4 w-4" />عرض التفاصيل</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeletePO(po.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="ml-2 h-4 w-4" />حذف</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle className="font-headline text-xl">فواتير المشتريات</CardTitle>
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
                    {invoices.map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium text-foreground">{invoice.invoiceNumber}</TableCell>
                        <TableCell className="text-muted-foreground">{invoice.purchaseOrderId || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{invoice.supplierName}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(invoice.invoiceDate).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell className="text-muted-foreground">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('ar-EG') : '-'}</TableCell>
                        <TableCell className="text-left text-muted-foreground">{invoice.grandTotal.toFixed(2)} ر.س</TableCell>
                        <TableCell className="text-center"><Badge variant={getStatusBadgeVariant(invoice.status)} className={getStatusBadgeClass(invoice.status)}>{invoice.status}</Badge></TableCell>
                        <TableCell className="text-left">
                           <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}><FileEdit className="ml-2 h-4 w-4" />تعديل</DropdownMenuItem>
                               <DropdownMenuItem><Printer className="ml-2 h-4 w-4" />طباعة</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteInvoice(invoice.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="ml-2 h-4 w-4" />حذف</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Supplier Modal */}
        <Dialog open={isSupplierModalOpen} onOpenChange={setIsSupplierModalOpen}>
          <DialogContent className="sm:max-w-lg bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingSupplier ? 'تعديل المورد' : 'إضافة مورد جديد'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleSaveSupplier({name: fd.get('s-name') as string, contactPerson: fd.get('s-contact') as string, email: fd.get('s-email') as string, phone: fd.get('s-phone') as string, address: fd.get('s-address') as string});}} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
              <div><Label htmlFor="s-name">اسم المورد</Label><Input id="s-name" name="s-name" defaultValue={editingSupplier?.name} required className="mt-1 bg-input/50"/></div>
              <div><Label htmlFor="s-contact">مسؤول التواصل</Label><Input id="s-contact" name="s-contact" defaultValue={editingSupplier?.contactPerson} className="mt-1 bg-input/50"/></div>
              <div><Label htmlFor="s-email">البريد الإلكتروني</Label><Input id="s-email" name="s-email" type="email" defaultValue={editingSupplier?.email} className="mt-1 bg-input/50"/></div>
              <div><Label htmlFor="s-phone">الهاتف</Label><Input id="s-phone" name="s-phone" type="tel" defaultValue={editingSupplier?.phone} className="mt-1 bg-input/50"/></div>
              <div><Label htmlFor="s-address">العنوان</Label><Textarea id="s-address" name="s-address" defaultValue={editingSupplier?.address} className="mt-1 bg-input/50"/></div>
              <DialogFooter><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ</Button><DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Purchase Order Modal */}
        <Dialog open={isPOModalOpen} onOpenChange={setIsPOModalOpen}>
          <DialogContent className="sm:max-w-2xl bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingPO ? 'تعديل أمر الشراء' : 'إنشاء أمر شراء جديد'}</DialogTitle></DialogHeader>
             <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleSavePO({orderDate: fd.get('po-date') as string, expectedDeliveryDate: fd.get('po-expdate') as string, supplierId: fd.get('po-supplier') as string, status: fd.get('po-status') as PurchaseOrder['status'], items: currentPOItems });}} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="po-supplier">المورد</Label>
                    <Select name="po-supplier" defaultValue={editingPO?.supplierId} required dir="rtl">
                        <SelectTrigger className="mt-1 bg-input/50"><SelectValue placeholder="اختر المورد" /></SelectTrigger>
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
                <div><Label htmlFor="po-date">تاريخ الطلب</Label><Input id="po-date" name="po-date" type="date" defaultValue={editingPO?.orderDate || new Date().toISOString().split('T')[0]} required className="mt-1 bg-input/50"/></div>
                <div><Label htmlFor="po-expdate">تاريخ التسليم المتوقع</Label><Input id="po-expdate" name="po-expdate" type="date" defaultValue={editingPO?.expectedDeliveryDate} className="mt-1 bg-input/50"/></div>
              </div>
              <Separator />
              <Label className="text-lg font-medium">بنود أمر الشراء</Label>
              {currentPOItems.map((item, index) => (
                <Card key={index} className="p-3 space-y-2 bg-muted/30">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                        <div><Label htmlFor={`po-item-prod-${index}`}>المنتج</Label>
                             <Select value={item.productId} onValueChange={(val) => handlePOItemChange(index, 'productId', val)} dir="rtl">
                                <SelectTrigger className="bg-input/50"><SelectValue placeholder="اختر منتجًا"/></SelectTrigger>
                                <SelectContent>{mockProducts.map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div><Label htmlFor={`po-item-qty-${index}`}>الكمية</Label><Input id={`po-item-qty-${index}`} type="number" value={item.quantity} onChange={e=>handlePOItemChange(index, 'quantity', parseFloat(e.target.value))} className="bg-input/50"/></div>
                        <div><Label htmlFor={`po-item-price-${index}`}>سعر الوحدة</Label><Input id={`po-item-price-${index}`} type="number" value={item.unitPrice} onChange={e=>handlePOItemChange(index, 'unitPrice', parseFloat(e.target.value))} className="bg-input/50"/></div>
                        <div className="flex items-end gap-2">
                             <span className="text-sm w-full text-center p-2 bg-background rounded-md">الإجمالي: {item.totalPrice.toFixed(2)}</span>
                            <Button type="button" variant="destructive" size="icon" onClick={() => removePOItem(index)} className="h-9 w-9"><Trash2 className="h-4 w-4"/></Button>
                        </div>
                    </div>
                </Card>
              ))}
              <Button type="button" variant="outline" onClick={addPOItem} className="w-full"><PlusCircle className="ml-2 h-4 w-4"/>إضافة بند</Button>
              <div className="text-right font-semibold text-lg">الإجمالي الكلي: {currentPOItems.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)} ر.س</div>
              <DialogFooter><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ أمر الشراء</Button><DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Purchase Invoice Modal */}
        <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
          <DialogContent className="sm:max-w-2xl bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingInvoice ? 'تعديل فاتورة الشراء' : 'إضافة فاتورة شراء جديدة'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleSaveInvoice({invoiceDate: fd.get('inv-date') as string, dueDate: fd.get('inv-duedate') as string, supplierId: fd.get('inv-supplier') as string, purchaseOrderId: fd.get('inv-po') as string, status: fd.get('inv-status') as PurchaseInvoice['status'], taxAmount: parseFloat(fd.get('inv-tax') as string), items: currentInvoiceItems });}} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label htmlFor="inv-supplier">المورد</Label>
                        <Select name="inv-supplier" defaultValue={editingInvoice?.supplierId} required dir="rtl">
                            <SelectTrigger className="mt-1 bg-input/50"><SelectValue placeholder="اختر المورد" /></SelectTrigger>
                            <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div><Label htmlFor="inv-po">أمر الشراء (اختياري)</Label>
                        <Select name="inv-po" defaultValue={editingInvoice?.purchaseOrderId} dir="rtl">
                            <SelectTrigger className="mt-1 bg-input/50"><SelectValue placeholder="اختر أمر شراء" /></SelectTrigger>
                            <SelectContent>{purchaseOrders.map(po => <SelectItem key={po.id} value={po.id}>{po.orderNumber} - {po.supplierName}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><Label htmlFor="inv-date">تاريخ الفاتورة</Label><Input id="inv-date" name="inv-date" type="date" defaultValue={editingInvoice?.invoiceDate || new Date().toISOString().split('T')[0]} required className="mt-1 bg-input/50"/></div>
                    <div><Label htmlFor="inv-duedate">تاريخ الاستحقاق</Label><Input id="inv-duedate" name="inv-duedate" type="date" defaultValue={editingInvoice?.dueDate} className="mt-1 bg-input/50"/></div>
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
                                <Select value={item.productId} onValueChange={(val) => handleInvoiceItemChange(index, 'productId', val)} dir="rtl">
                                <SelectTrigger className="bg-input/50"><SelectValue placeholder="اختر منتجًا"/></SelectTrigger>
                                <SelectContent>{mockProducts.map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                            </div>
                            <div><Label>الكمية</Label><Input type="number" value={item.quantity} onChange={e=>handleInvoiceItemChange(index, 'quantity', parseFloat(e.target.value))} className="bg-input/50"/></div>
                            <div><Label>سعر الوحدة</Label><Input type="number" value={item.unitPrice} onChange={e=>handleInvoiceItemChange(index, 'unitPrice', parseFloat(e.target.value))} className="bg-input/50"/></div>
                            <div className="flex items-end gap-2">
                                <span className="text-sm w-full text-center p-2 bg-background rounded-md">الإجمالي: {item.totalPrice.toFixed(2)}</span>
                                <Button type="button" variant="destructive" size="icon" onClick={() => removeInvoiceItem(index)} className="h-9 w-9"><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    </Card>
                ))}
                <Button type="button" variant="outline" onClick={addInvoiceItem} className="w-full"><PlusCircle className="ml-2 h-4 w-4"/>إضافة بند للفاتورة</Button>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2 space-y-1">
                        <p className="text-sm">المجموع الفرعي: {currentInvoiceItems.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)} ر.س</p>
                    </div>
                    <div><Label htmlFor="inv-tax">مبلغ الضريبة</Label><Input id="inv-tax" name="inv-tax" type="number" defaultValue={editingInvoice?.taxAmount || 0} step="0.01" className="mt-1 bg-input/50"/></div>
                </div>
                 <div className="text-right font-semibold text-lg">الإجمالي الكلي للفاتورة: {(currentInvoiceItems.reduce((sum, item) => sum + item.totalPrice, 0) + parseFloat((document.getElementById('inv-tax') as HTMLInputElement)?.value || '0')).toFixed(2)} ر.س</div>

              <DialogFooter><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ الفاتورة</Button><DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
};

export default PurchasingPage;

    