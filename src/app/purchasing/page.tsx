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
  supplierName?: string; // Added for display
  date: string;
  totalAmount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

const initialSuppliers: Supplier[] = [
  { id: 's1', name: 'FreshProduce Co.', contactPerson: 'John Appleseed', email: 'john@freshproduce.com', phone: '555-0101' },
  { id: 's2', name: 'BakeryGoods Ltd.', contactPerson: 'Jane Dough', email: 'jane@bakerygoods.com', phone: '555-0102' },
  { id: 's3', name: 'DairyFarms Inc.', contactPerson: 'Peter Milkman', email: 'peter@dairyfarms.com', phone: '555-0103' },
];

const initialInvoices: PurchaseInvoice[] = [
  { id: 'inv1', invoiceNumber: 'INV-2024-001', supplierId: 's1', supplierName: 'FreshProduce Co.', date: '2024-07-15', totalAmount: 1250.75, status: 'Paid' },
  { id: 'inv2', invoiceNumber: 'INV-2024-002', supplierId: 's2', supplierName: 'BakeryGoods Ltd.', date: '2024-07-20', totalAmount: 875.00, status: 'Pending' },
  { id: 'inv3', invoiceNumber: 'INV-2024-003', supplierId: 's1', supplierName: 'FreshProduce Co.', date: '2024-06-01', totalAmount: 950.50, status: 'Overdue' },
];

const PurchasingPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>(initialInvoices);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | undefined>(undefined);
  const { toast } = useToast();

  // Supplier Handlers
  const handleAddSupplier = () => { setEditingSupplier(undefined); setIsSupplierModalOpen(true); };
  const handleEditSupplier = (supplier: Supplier) => { setEditingSupplier(supplier); setIsSupplierModalOpen(true); };
  const handleDeleteSupplier = (id: string) => { 
    setSuppliers(suppliers.filter(s => s.id !== id));
    toast({ title: 'Supplier Deleted', description: 'The supplier has been removed.' });
  };
  const handleSaveSupplier = (supplierData: Omit<Supplier, 'id'>) => {
    if (editingSupplier) {
      setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? { ...editingSupplier, ...supplierData } : s));
      toast({ title: 'Supplier Updated', description: `${supplierData.name} has been updated.` });
    } else {
      const newSupplier = { ...supplierData, id: String(Date.now()) };
      setSuppliers([...suppliers, newSupplier]);
      toast({ title: 'Supplier Added', description: `${supplierData.name} has been added.` });
    }
    setIsSupplierModalOpen(false);
  };

  // Invoice Handlers
  const handleAddInvoice = () => { setEditingInvoice(undefined); setIsInvoiceModalOpen(true); };
  const handleEditInvoice = (invoice: PurchaseInvoice) => { setEditingInvoice(invoice); setIsInvoiceModalOpen(true); };
  const handleDeleteInvoice = (id: string) => { 
    setInvoices(invoices.filter(i => i.id !== id));
    toast({ title: 'Invoice Deleted', description: 'The invoice has been removed.' });
  };
  const handleSaveInvoice = (invoiceData: Omit<PurchaseInvoice, 'id' | 'supplierName'>) => {
    const supplier = suppliers.find(s => s.id === invoiceData.supplierId);
    if (editingInvoice) {
      setInvoices(invoices.map(i => i.id === editingInvoice.id ? { ...editingInvoice, ...invoiceData, supplierName: supplier?.name } : i));
      toast({ title: 'Invoice Updated', description: `Invoice ${invoiceData.invoiceNumber} has been updated.` });
    } else {
      const newInvoice = { ...invoiceData, id: String(Date.now()), supplierName: supplier?.name };
      setInvoices([...invoices, newInvoice]);
      toast({ title: 'Invoice Added', description: `Invoice ${invoiceData.invoiceNumber} has been added.` });
    }
    setIsInvoiceModalOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-headline font-semibold text-foreground">Purchasing Management</h1>
        
        <Tabs defaultValue="suppliers">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
              <TabsTrigger value="invoices">Purchase Invoices</TabsTrigger>
            </TabsList>
            <TabsContent value="suppliers" className="mt-0 !p-0">
               <Button onClick={handleAddSupplier} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <PlusCircle className="mr-2 h-5 w-5" /> Add Supplier
              </Button>
            </TabsContent>
             <TabsContent value="invoices" className="mt-0 !p-0">
                <Button onClick={handleAddInvoice} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add Invoice
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
                      <TableHead>Name</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map(supplier => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium text-foreground">{supplier.name}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.contactPerson}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.email}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.phone}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditSupplier(supplier)}><FileEdit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteSupplier(supplier.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium text-foreground">{invoice.invoiceNumber}</TableCell>
                        <TableCell className="text-muted-foreground">{invoice.supplierName || suppliers.find(s=>s.id === invoice.supplierId)?.name}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(invoice.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right text-muted-foreground">${invoice.totalAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={invoice.status === 'Paid' ? 'default' : invoice.status === 'Pending' ? 'secondary' : 'destructive'}
                           className={
                            invoice.status === 'Paid' ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30 border-green-500/30' :
                            invoice.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 border-yellow-500/30' :
                            'bg-red-500/20 text-red-700 hover:bg-red-500/30 border-red-500/30'
                           }>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}><FileEdit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteInvoice(invoice.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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
          <DialogContent className="sm:max-w-[480px] bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle></DialogHeader>
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
              <div><Label htmlFor="s-name">Name</Label><Input id="s-name" name="name" defaultValue={editingSupplier?.name} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="s-contact">Contact Person</Label><Input id="s-contact" name="contactPerson" defaultValue={editingSupplier?.contactPerson} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="s-email">Email</Label><Input id="s-email" name="email" type="email" defaultValue={editingSupplier?.email} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="s-phone">Phone</Label><Input id="s-phone" name="phone" type="tel" defaultValue={editingSupplier?.phone} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Supplier</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Invoice Modal */}
        <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
          <DialogContent className="sm:max-w-[480px] bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingInvoice ? 'Edit Invoice' : 'Add New Invoice'}</DialogTitle></DialogHeader>
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
              <div><Label htmlFor="inv-number">Invoice Number</Label><Input id="inv-number" name="inv-number" defaultValue={editingInvoice?.invoiceNumber} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div>
                <Label htmlFor="inv-supplier">Supplier</Label>
                <select id="inv-supplier" name="inv-supplier" defaultValue={editingInvoice?.supplierId} required className="w-full mt-1 p-2 border rounded-md bg-input/50 focus:bg-input text-sm">
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div><Label htmlFor="inv-date">Date</Label><Input id="inv-date" name="inv-date" type="date" defaultValue={editingInvoice?.date} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="inv-amount">Total Amount</Label><Input id="inv-amount" name="inv-amount" type="number" step="0.01" defaultValue={editingInvoice?.totalAmount} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div>
                <Label htmlFor="inv-status">Status</Label>
                <select id="inv-status" name="inv-status" defaultValue={editingInvoice?.status} required className="w-full mt-1 p-2 border rounded-md bg-input/50 focus:bg-input text-sm">
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
              <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Invoice</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
};

export default PurchasingPage;
