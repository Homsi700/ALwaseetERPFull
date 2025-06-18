
// src/app/purchasing/page.tsx
"use client";

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileEdit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';


interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
}

interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName?: string; 
  date: string;
  totalAmount: number;
  status: 'مدفوعة' | 'معلقة' | 'متأخرة';
}

const initialSuppliers: Supplier[] = [
  { id: 's1', name: 'شركة المنتجات الطازجة', contactPerson: 'أحمد خالد', email: 'ahmad@freshproduce.com', phone: '٠٥٥٥٠١٠١' },
  { id: 's2', name: 'مخبوزات الخير المحدودة', contactPerson: 'فاطمة علي', email: 'fatima@bakerygoods.com', phone: '٠٥٥٥٠١٠٢' },
  { id: 's3', name: 'مزارع الألبان المتحدة', contactPerson: 'يوسف حسن', email: 'yousef@dairyfarms.com', phone: '٠٥٥٥٠١٠٣' },
];

const initialInvoices: PurchaseInvoice[] = [
  { id: 'inv1', invoiceNumber: 'INV-2024-001', supplierId: 's1', supplierName: 'شركة المنتجات الطازجة', date: '2024-07-15', totalAmount: 1250.75, status: 'مدفوعة' },
  { id: 'inv2', invoiceNumber: 'INV-2024-002', supplierId: 's2', supplierName: 'مخبوزات الخير المحدودة', date: '2024-07-20', totalAmount: 875.00, status: 'معلقة' },
  { id: 'inv3', invoiceNumber: 'INV-2024-003', supplierId: 's1', supplierName: 'شركة المنتجات الطازجة', date: '2024-06-01', totalAmount: 950.50, status: 'متأخرة' },
];

const PurchasingPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>(initialInvoices);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | undefined>(undefined);
  const { toast } = useToast();

  const handleAddSupplier = () => { setEditingSupplier(undefined); setIsSupplierModalOpen(true); };
  const handleEditSupplier = (supplier: Supplier) => { setEditingSupplier(supplier); setIsSupplierModalOpen(true); };
  const handleDeleteSupplier = (id: string) => { 
    setSuppliers(suppliers.filter(s => s.id !== id));
    toast({ title: 'تم حذف المورد', description: 'تمت إزالة المورد بنجاح.' });
  };
  const handleSaveSupplier = (supplierData: Omit<Supplier, 'id'>) => {
    if (editingSupplier) {
      setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? { ...editingSupplier, ...supplierData } : s));
      toast({ title: 'تم تحديث المورد', description: `تم تحديث بيانات ${supplierData.name}.` });
    } else {
      const newSupplier = { ...supplierData, id: String(Date.now()) };
      setSuppliers([...suppliers, newSupplier]);
      toast({ title: 'تمت إضافة مورد', description: `تمت إضافة ${supplierData.name} بنجاح.` });
    }
    setIsSupplierModalOpen(false);
  };

  const handleAddInvoice = () => { setEditingInvoice(undefined); setIsInvoiceModalOpen(true); };
  const handleEditInvoice = (invoice: PurchaseInvoice) => { setEditingInvoice(invoice); setIsInvoiceModalOpen(true); };
  const handleDeleteInvoice = (id: string) => { 
    setInvoices(invoices.filter(i => i.id !== id));
    toast({ title: 'تم حذف الفاتورة', description: 'تمت إزالة الفاتورة بنجاح.' });
  };
  const handleSaveInvoice = (invoiceData: Omit<PurchaseInvoice, 'id' | 'supplierName'>) => {
    const supplier = suppliers.find(s => s.id === invoiceData.supplierId);
    if (editingInvoice) {
      setInvoices(invoices.map(i => i.id === editingInvoice.id ? { ...editingInvoice, ...invoiceData, supplierName: supplier?.name } : i));
      toast({ title: 'تم تحديث الفاتورة', description: `تم تحديث الفاتورة رقم ${invoiceData.invoiceNumber}.` });
    } else {
      const newInvoice = { ...invoiceData, id: String(Date.now()), supplierName: supplier?.name };
      setInvoices([...invoices, newInvoice]);
      toast({ title: 'تمت إضافة فاتورة', description: `تمت إضافة الفاتورة رقم ${invoiceData.invoiceNumber} بنجاح.` });
    }
    setIsInvoiceModalOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-headline font-semibold text-foreground">إدارة المشتريات</h1>
        
        <Tabs defaultValue="suppliers">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="suppliers">الموردون</TabsTrigger>
              <TabsTrigger value="invoices">فواتير الشراء</TabsTrigger>
            </TabsList>
            <TabsContent value="suppliers" className="mt-0 !p-0">
               <Button onClick={handleAddSupplier} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <PlusCircle className="ml-2 h-5 w-5" /> إضافة مورد
              </Button>
            </TabsContent>
             <TabsContent value="invoices" className="mt-0 !p-0">
                <Button onClick={handleAddInvoice} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <PlusCircle className="ml-2 h-5 w-5" /> إضافة فاتورة
                </Button>
            </TabsContent>
          </div>

          <TabsContent value="suppliers">
            <Card className="shadow-lg">
              <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>مسؤول التواصل</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map(supplier => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium text-foreground">{supplier.name}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.contactPerson}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.email}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.phone}</TableCell>
                        <TableCell className="text-left">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
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

          <TabsContent value="invoices">
            <Card className="shadow-lg">
              <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>المورد</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead className="text-left">المبلغ الإجمالي</TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium text-foreground">{invoice.invoiceNumber}</TableCell>
                        <TableCell className="text-muted-foreground">{invoice.supplierName || suppliers.find(s=>s.id === invoice.supplierId)?.name}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(invoice.date).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell className="text-left text-muted-foreground">{invoice.totalAmount.toFixed(2)} ر.س</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={invoice.status === 'مدفوعة' ? 'default' : invoice.status === 'معلقة' ? 'secondary' : 'destructive'}
                           className={
                            invoice.status === 'مدفوعة' ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30 border-green-500/30' :
                            invoice.status === 'معلقة' ? 'bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 border-yellow-500/30' :
                            'bg-red-500/20 text-red-700 hover:bg-red-500/30 border-red-500/30'
                           }>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}><FileEdit className="ml-2 h-4 w-4" />تعديل</DropdownMenuItem>
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

        <Dialog open={isSupplierModalOpen} onOpenChange={setIsSupplierModalOpen}>
          <DialogContent className="sm:max-w-[480px] bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingSupplier ? 'تعديل المورد' : 'إضافة مورد جديد'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveSupplier({
                name: formData.get('name') as string,
                contactPerson: formData.get('contactPerson') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
              });
            }} className="space-y-4 py-4">
              <div><Label htmlFor="s-name">الاسم</Label><Input id="s-name" name="name" defaultValue={editingSupplier?.name} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="s-contact">مسؤول التواصل</Label><Input id="s-contact" name="contactPerson" defaultValue={editingSupplier?.contactPerson} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="s-email">البريد الإلكتروني</Label><Input id="s-email" name="email" type="email" defaultValue={editingSupplier?.email} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="s-phone">الهاتف</Label><Input id="s-phone" name="phone" type="tel" defaultValue={editingSupplier?.phone} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <DialogFooter>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ المورد</Button>
                <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
          <DialogContent className="sm:max-w-[480px] bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingInvoice ? 'تعديل الفاتورة' : 'إضافة فاتورة جديدة'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveInvoice({
                invoiceNumber: formData.get('inv-number') as string,
                supplierId: formData.get('inv-supplier') as string,
                date: formData.get('inv-date') as string,
                totalAmount: parseFloat(formData.get('inv-amount') as string),
                status: formData.get('inv-status') as PurchaseInvoice['status'],
              });
            }} className="space-y-4 py-4">
              <div><Label htmlFor="inv-number">رقم الفاتورة</Label><Input id="inv-number" name="inv-number" defaultValue={editingInvoice?.invoiceNumber} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div>
                <Label htmlFor="inv-supplier">المورد</Label>
                <select id="inv-supplier" name="inv-supplier" defaultValue={editingInvoice?.supplierId} required className="w-full mt-1 p-2 border rounded-md bg-input/50 focus:bg-input text-sm" dir="rtl">
                  <option value="">اختر المورد</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div><Label htmlFor="inv-date">التاريخ</Label><Input id="inv-date" name="inv-date" type="date" defaultValue={editingInvoice?.date} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="inv-amount">المبلغ الإجمالي</Label><Input id="inv-amount" name="inv-amount" type="number" step="0.01" defaultValue={editingInvoice?.totalAmount} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div>
                <Label htmlFor="inv-status">الحالة</Label>
                <select id="inv-status" name="inv-status" defaultValue={editingInvoice?.status} required className="w-full mt-1 p-2 border rounded-md bg-input/50 focus:bg-input text-sm" dir="rtl">
                  <option value="معلقة">معلقة</option>
                  <option value="مدفوعة">مدفوعة</option>
                  <option value="متأخرة">متأخرة</option>
                </select>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ الفاتورة</Button>
                <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
};

export default PurchasingPage;
