
// src/app/clients/page.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, FileEdit, Trash2, MoreHorizontal, UserCircle, Search, Filter, Users, ShoppingBag, ScrollText, PackageSearch } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

interface Client {
  id: string;
  created_at?: string;
  name: string;
  email?: string;
  phone: string;
  total_spent?: number;
  avatar?: string;
  join_date?: string;
  address?: string;
  notes?: string;
  tags?: string[];
  credit_balance?: number;
}

interface SaleItem {
  name: string;
  quantity: number;
  price: number;
}
interface Purchase {
  id: string;
  date: string;
  items: SaleItem[];
  total: number;
  invoiceNumber: string;
}

const mapToSupabaseClient = (client: Omit<Client, 'id' | 'created_at'> & { id?: string }) => ({
  name: client.name,
  email: client.email,
  phone: client.phone,
  total_spent: client.total_spent || 0,
  avatar: client.avatar,
  join_date: client.join_date || new Date().toISOString().split('T')[0],
  address: client.address,
  notes: client.notes,
  tags: client.tags || [], // Ensure tags is always an array
  credit_balance: client.credit_balance || 0,
});

const mapFromSupabaseClient = (data: any): Client => ({
  id: data.id,
  created_at: data.created_at,
  name: data.name,
  email: data.email,
  phone: data.phone,
  total_spent: data.total_spent,
  avatar: data.avatar,
  join_date: data.join_date,
  address: data.address,
  notes: data.notes,
  tags: data.tags || [],
  credit_balance: data.credit_balance,
});


const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientPurchaseHistory, setClientPurchaseHistory] = useState<Purchase[]>([]);
  const [isLoadingClientHistory, setIsLoadingClientHistory] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchClients = useCallback(async () => {
    if(!user) return;
    setIsLoadingClients(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setClients(data.map(mapFromSupabaseClient));
    } catch (error: any) {
      toast({ title: 'خطأ في جلب العملاء', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoadingClients(false);
    }
  }, [toast, user]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const fetchClientPurchaseHistory = useCallback(async (clientId: string) => {
    if (!user) return;
    setIsLoadingClientHistory(true);
    setClientPurchaseHistory([]);
    try {
      // Fetch sales for the client
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          id, 
          sale_date, 
          total_amount,
          sale_items ( product_id, quantity, unit_price, products (name) )
        `)
        .eq('client_id', clientId)
        .order('sale_date', { ascending: false });

      if (salesError) throw salesError;

      const history: Purchase[] = salesData.map((sale: any) => ({
        id: sale.id,
        invoiceNumber: `INV-${sale.id.substring(0, 6)}`, // Simple invoice number generation
        date: sale.sale_date,
        items: sale.sale_items.map((item: any) => ({
          name: item.products?.name || 'منتج غير معروف', // product_id needs to link to a products table with a name
          quantity: item.quantity,
          price: item.unit_price,
        })),
        total: sale.total_amount,
      }));
      setClientPurchaseHistory(history);

    } catch (error: any) {
      console.error("Error fetching client purchase history:", error);
      toast({ title: 'خطأ في جلب سجل الشراء', description: "لم نتمكن من جلب سجل الشراء لهذا العميل. " + error.message, variant: 'destructive' });
      setClientPurchaseHistory([]); 
    } finally {
        setIsLoadingClientHistory(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (selectedClient) {
        fetchClientPurchaseHistory(selectedClient.id);
    } else {
        setClientPurchaseHistory([]);
    }
  }, [selectedClient, fetchClientPurchaseHistory]);


  const filteredClients = useMemo(() => 
    clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      client.phone.includes(searchTerm)
    ).sort((a,b) => new Date(b.join_date || 0).getTime() - new Date(a.join_date || 0).getTime()), // Sort by join date descending
    [clients, searchTerm]
  );

  const handleAddClient = () => { setEditingClient(undefined); setIsModalOpen(true); };
  const handleEditClient = (client: Client) => { setEditingClient(client); setIsModalOpen(true); };
  
  const handleDeleteClient = async (id: string) => { 
    try {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) throw error;
        fetchClients(); 
        if (selectedClient?.id === id) setSelectedClient(null);
        toast({ title: 'تم حذف العميل'});
    } catch (error: any) {
        toast({ title: 'خطأ في حذف العميل', description: error.message, variant: 'destructive'});
    }
  };

  const handleSaveClient = async (clientData: Omit<Client, 'id' | 'created_at'> & { id?: string }) => {
    const dataToSave = mapToSupabaseClient(clientData);
    try {
        if (editingClient && editingClient.id) {
            const { error } = await supabase.from('clients').update(dataToSave).eq('id', editingClient.id);
            if (error) throw error;
            toast({ title: 'تم تحديث العميل'});
        } else {
            // Remove id field for insert if it exists from editingClient being undefined
            const { id, ...insertData } = dataToSave;
            const { error } = await supabase.from('clients').insert(insertData).select().single();
            if (error) throw error;
            toast({ title: 'تمت إضافة عميل'});
        }
        fetchClients(); 
        setIsModalOpen(false);
        setEditingClient(undefined);
    } catch (error: any) {
        toast({ title: 'خطأ في حفظ العميل', description: error.message, variant: 'destructive'});
    }
  };


  if (isLoadingClients && !user) { 
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }
  
  if (!user && !isLoadingClients) { 
     return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-lg text-muted-foreground mb-4">يرجى تسجيل الدخول للوصول إلى قسم العملاء.</p>
        </div>
      </AppLayout>
    );
  }


  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center"><Users className="ml-3 h-8 w-8 text-primary"/>إدارة العملاء</h1>
          <Button onClick={handleAddClient} className="mt-4 sm:mt-0 bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="ml-2 h-5 w-5" /> إضافة عميل جديد
          </Button>
        </div>

         <Card className="shadow-lg">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                    <CardTitle className="font-headline text-xl text-foreground">قائمة العملاء ({filteredClients.length})</CardTitle>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-grow sm:flex-grow-0">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="بحث بالاسم, البريد, الهاتف..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-10 bg-input/50 focus:bg-input w-full"
                            />
                        </div>
                        <Button variant="outline"><Filter className="ml-2 h-4 w-4"/> تصفية</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">الصورة</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد/الهاتف</TableHead>
                    <TableHead className="text-left">إجمالي المنفق</TableHead>
                    <TableHead className="text-left">الرصيد الآجل</TableHead>
                    <TableHead>تاريخ الانضمام</TableHead>
                    <TableHead className="text-left w-[80px]">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingClients ? (
                     <TableRow><TableCell colSpan={7} className="text-center h-24"><PackageSearch className="h-12 w-12 mx-auto text-muted-foreground/30 animate-pulse" /></TableCell></TableRow>
                  ) : filteredClients.length > 0 ? filteredClients.map(client => (
                    <TableRow key={client.id} onClick={() => setSelectedClient(client)} className={`cursor-pointer hover:bg-muted/50 transition-colors ${selectedClient?.id === client.id ? 'bg-primary/10' : ''}`}>
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={client.avatar || `https://placehold.co/40x40.png?text=${encodeURIComponent(client.name.charAt(0))}`} alt={client.name} data-ai-hint="person portrait" />
                          <AvatarFallback>{client.name.split(' ').map(n=>n[0]).join('').toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{client.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm"><div>{client.email || '-'}</div><div>{client.phone}</div></TableCell>
                      <TableCell className="text-left text-muted-foreground">{(client.total_spent || 0).toFixed(2)} ر.س</TableCell>
                      <TableCell className={`text-left font-medium ${client.credit_balance && client.credit_balance > 0 ? 'text-green-600' : client.credit_balance && client.credit_balance < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {client.credit_balance ? client.credit_balance.toFixed(2) : '0.00'} ر.س
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{client.join_date ? new Date(client.join_date).toLocaleDateString('ar-EG') : '-'}</TableCell>
                      <TableCell className="text-left">
                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedClient(client);}}><ScrollText className="ml-2 h-4 w-4" />عرض التفاصيل</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClient(client);}}><FileEdit className="ml-2 h-4 w-4" />تعديل</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id);}} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="ml-2 h-4 w-4" />حذف</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        {clients.length === 0 ? "لا يوجد عملاء مضافون بعد." : "لا يوجد عملاء يطابقون البحث."}
                    </TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
             {filteredClients.length === 0 && clients.length > 0 && !isLoadingClients && <CardFooter className="justify-center p-4 text-muted-foreground">لا يوجد عملاء يطابقون البحث.</CardFooter>}
          </Card>

          {selectedClient && (
          <Card className="shadow-lg animate-fadeIn">
            <CardHeader className="flex flex-row justify-between items-start">
              <div>
                <CardTitle className="font-headline text-2xl text-foreground flex items-center">
                    <Avatar className="h-12 w-12 ml-4">
                        <AvatarImage src={selectedClient.avatar || `https://placehold.co/48x48.png?text=${encodeURIComponent(selectedClient.name.charAt(0))}`} alt={selectedClient.name} data-ai-hint="person portrait" />
                        <AvatarFallback className="text-xl">{selectedClient.name.split(' ').map(n=>n[0]).join('').toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {selectedClient.name}
                </CardTitle>
                <CardDescription className="mt-1">
                    {selectedClient.email || ''} {selectedClient.email && selectedClient.phone ? <> &bull; </> : ''} {selectedClient.phone}
                     {selectedClient.address && ` &bull; ${selectedClient.address}`}
                </CardDescription>
                {selectedClient.tags && selectedClient.tags.length > 0 && (
                    <div className="mt-2 space-x-1 space-x-reverse">
                        {selectedClient.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                    </div>
                )}
              </div>
               <Button variant="outline" size="sm" onClick={() => handleEditClient(selectedClient)}><FileEdit className="ml-2 h-4 w-4" />تعديل</Button>
            </CardHeader>
            <CardContent className="mt-2">
                 <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-muted-foreground mb-2">معلومات العميل</h4>
                        <div className="text-sm space-y-1">
                            <p><strong className="text-muted-foreground/80">تاريخ الانضمام:</strong> {selectedClient.join_date ? new Date(selectedClient.join_date).toLocaleDateString('ar-EG') : '-'}</p>
                            <p><strong className="text-muted-foreground/80">إجمالي المنفق:</strong> <span className="font-semibold text-primary">{(selectedClient.total_spent || 0).toFixed(2)} ر.س</span></p>
                            <p><strong className="text-muted-foreground/80">الرصيد الآجل:</strong> <span className={`font-semibold ${selectedClient.credit_balance && selectedClient.credit_balance > 0 ? 'text-green-600' : selectedClient.credit_balance && selectedClient.credit_balance < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>{(selectedClient.credit_balance || 0).toFixed(2)} ر.س</span></p>
                            {selectedClient.notes && <p><strong className="text-muted-foreground/80">ملاحظات:</strong> {selectedClient.notes}</p>}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-muted-foreground mb-2 flex items-center"><ShoppingBag className="ml-2 h-4 w-4 text-primary"/>سجل الشراء الأخير</h4>
                        {isLoadingClientHistory ? (
                             <div className="flex justify-center items-center h-32"><PackageSearch className="h-10 w-10 text-muted-foreground/30 animate-pulse" /></div>
                        ) : clientPurchaseHistory.length > 0 ? (
                            <ScrollArea className="h-48 pr-2">
                            <ul className="space-y-3">
                            {clientPurchaseHistory.map(purchase => (
                                <li key={purchase.id} className="p-3 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-foreground">فاتورة رقم: {purchase.invoiceNumber}</span>
                                    <span className="text-xs text-muted-foreground">{new Date(purchase.date).toLocaleDateString('ar-EG')}</span>
                                </div>
                                <ul className="text-xs list-disc list-inside pr-1 text-muted-foreground">
                                    {purchase.items.map(item => (
                                    <li key={`${purchase.id}-${item.name}`}>{item.name} (×{item.quantity}) - {item.price.toFixed(2)} ر.س</li>
                                    ))}
                                </ul>
                                <p className="text-left text-sm font-semibold text-primary mt-1">الإجمالي: {purchase.total.toFixed(2)} ر.س</p>
                                </li>
                            ))}
                            </ul>
                            </ScrollArea>
                        ) : (
                            <p className="text-sm text-muted-foreground">لا يوجد سجل شراء لهذا العميل.</p>
                        )}
                    </div>
                 </div>
            </CardContent>
             <CardFooter className="border-t pt-4">
                <Button variant="ghost" onClick={() => setSelectedClient(null)}>إغلاق التفاصيل</Button>
            </CardFooter>
          </Card>
          )}

          {!selectedClient && clients.length > 0 && !isLoadingClients && (
             <div className="flex flex-col items-center justify-center text-center py-10">
                <UserCircle className="w-20 h-20 text-muted-foreground/30 mb-4" />
                <p className="text-lg text-muted-foreground">اختر عميلًا من القائمة أعلاه لعرض تفاصيله وسجل شرائه.</p>
                <p className="text-sm text-muted-foreground/70 mt-1">أو قم بإضافة عميل جديد لبدء بناء قاعدة بيانات عملائك.</p>
            </div>
          )}
        
        <Dialog open={isModalOpen} onOpenChange={(isOpen) => { setIsModalOpen(isOpen); if(!isOpen) setEditingClient(undefined);}}>
          <DialogContent className="sm:max-w-lg bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingClient ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const clientPayload: Omit<Client, 'id' | 'created_at'> & { id?: string } = {
                name: formData.get('c-name') as string,
                email: formData.get('c-email') as string || undefined,
                phone: formData.get('c-phone') as string,
                address: formData.get('c-address') as string || undefined,
                notes: formData.get('c-notes') as string || undefined,
                tags: (formData.get('c-tags') as string)?.split(',').map(t => t.trim()).filter(t => t) || [],
                avatar: formData.get('c-avatar') as string || undefined,
                join_date: editingClient?.join_date || new Date().toISOString().split('T')[0], 
                total_spent: editingClient?.total_spent || 0,
                credit_balance: parseFloat(formData.get('c-credit') as string) || 0,
              };
              if (editingClient) {
                clientPayload.id = editingClient.id;
              }
              handleSaveClient(clientPayload);
            }} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
              <div><Label htmlFor="c-name">الاسم الكامل</Label><Input id="c-name" name="c-name" defaultValue={editingClient?.name} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="c-email">البريد الإلكتروني (اختياري)</Label><Input id="c-email" name="c-email" type="email" defaultValue={editingClient?.email} className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="c-phone">رقم الهاتف</Label><Input id="c-phone" name="c-phone" type="tel" defaultValue={editingClient?.phone} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="c-address">العنوان (اختياري)</Label><Input id="c-address" name="c-address" defaultValue={editingClient?.address} className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="c-credit">الرصيد الآجل (اختياري)</Label><Input id="c-credit" name="c-credit" type="number" step="0.01" defaultValue={editingClient?.credit_balance?.toString() || "0"} className="mt-1 bg-input/50 focus:bg-input" placeholder="0.00"/></div>
              <div><Label htmlFor="c-notes">ملاحظات (اختياري)</Label><Input id="c-notes" name="c-notes" defaultValue={editingClient?.notes} className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="c-tags">الوسوم (اختياري, مفصولة بفاصلة)</Label><Input id="c-tags" name="c-tags" defaultValue={editingClient?.tags?.join(', ')} className="mt-1 bg-input/50 focus:bg-input" placeholder="VIP, دفع آجل..."/></div>
              <div><Label htmlFor="c-avatar">رابط الصورة الرمزية (اختياري)</Label><Input id="c-avatar" name="c-avatar" defaultValue={editingClient?.avatar} className="mt-1 bg-input/50 focus:bg-input" placeholder="https://placehold.co/40x40.png"/></div>
              <DialogFooter>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ العميل</Button>
                <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
       <style jsx global>{`
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-in-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
    </AppLayout>
  );
};

export default ClientsPage;
    
