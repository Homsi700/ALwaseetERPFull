
// src/app/clients/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, FileEdit, Trash2, MoreHorizontal, UserCircle, Search, Filter, Users, CalendarDays, ShoppingBag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  avatar?: string;
  joinDate: string;
  address?: string;
  notes?: string;
  tags?: string[];
}

interface Purchase {
  id: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  invoiceNumber: string;
}

const initialClients: Client[] = [
  { id: 'c1', name: 'أليس وندرلاند', email: 'alice@example.com', phone: '٠٥٥٥٠٢٠١', totalSpent: 1250.50, avatar: 'https://placehold.co/40x40.png?text=AW', joinDate: '2023-01-15', address: '123 شارع العجائب، الرياض', notes: 'عميل مميز، يفضل الدفع نقداً.', tags: ['VIP', 'نقدي'] },
  { id: 'c2', name: 'بوب البناء', email: 'bob@example.com', phone: '٠٥٥٥٠٢٠٢', totalSpent: 875.00, avatar: 'https://placehold.co/40x40.png?text=BB', joinDate: '2023-03-22', tags: ['دفع آجل'] },
  { id: 'c3', name: 'تشارلي براون', email: 'charlie@example.com', phone: '٠٥٥٥٠٢٠٣', totalSpent: 2400.75, joinDate: '2022-11-05', address: '789 شارع الفول السوداني، جدة', notes: 'يطلب فاتورة دائماً.' },
];

const mockPurchaseHistory: { [clientId: string]: Purchase[] } = {
  'c1': [
    { id: 'p1', invoiceNumber: 'INV-001', date: '2024-07-01', items: [{ name: 'تفاح عضوي', quantity: 2, price: 2.99 }, { name: 'خبز قمح كامل', quantity: 1, price: 3.49 }], total: 9.47 },
    { id: 'p2', invoiceNumber: 'INV-005', date: '2024-06-15', items: [{ name: 'حليب لوز', quantity: 3, price: 2.79 }], total: 8.37 },
  ],
  'c2': [
    { id: 'p3', invoiceNumber: 'INV-008', date: '2024-07-10', items: [{ name: 'بيض', quantity: 2, price: 4.99 }], total: 9.98 },
  ],
};

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredClients = useMemo(() => 
    clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
    ),
    [clients, searchTerm]
  );

  const handleAddClient = () => { setEditingClient(undefined); setIsModalOpen(true); };
  const handleEditClient = (client: Client) => { setEditingClient(client); setIsModalOpen(true); };
  const handleDeleteClient = (id: string) => { 
    setClients(clients.filter(c => c.id !== id));
    if (selectedClient?.id === id) setSelectedClient(null);
    toast({ title: 'تم حذف العميل', description: 'تمت إزالة العميل.' });
  };

  const handleSaveClient = (clientData: Omit<Client, 'id' | 'totalSpent' | 'joinDate'> & { totalSpent?: number, joinDate?: string }) => {
    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? { ...editingClient, ...clientData } : c));
      toast({ title: 'تم تحديث العميل', description: `تم تحديث بيانات ${clientData.name}.` });
    } else {
      const newClient = { ...clientData, id: String(Date.now()), totalSpent: clientData.totalSpent || 0, joinDate: clientData.joinDate || new Date().toISOString().split('T')[0] };
      setClients([...clients, newClient]);
      toast({ title: 'تمت إضافة عميل', description: `تمت إضافة ${clientData.name}.` });
    }
    setIsModalOpen(false);
  };

  const clientPurchaseHistory = selectedClient ? mockPurchaseHistory[selectedClient.id] || [] : [];

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
                    <CardTitle className="font-headline text-xl text-foreground">قائمة العملاء</CardTitle>
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
                    <TableHead>تاريخ الانضمام</TableHead>
                    <TableHead className="text-left w-[80px]">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map(client => (
                    <TableRow key={client.id} onClick={() => setSelectedClient(client)} className={`cursor-pointer hover:bg-muted/50 transition-colors ${selectedClient?.id === client.id ? 'bg-primary/10' : ''}`}>
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={client.avatar} alt={client.name} data-ai-hint="person portrait" />
                          <AvatarFallback>{client.name.split(' ').map(n=>n[0]).join('').toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{client.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm"><div>{client.email}</div><div>{client.phone}</div></TableCell>
                      <TableCell className="text-left text-muted-foreground">{client.totalSpent.toFixed(2)} ر.س</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(client.joinDate).toLocaleDateString('ar-EG')}</TableCell>
                      <TableCell className="text-left">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClient(client);}}><FileEdit className="ml-2 h-4 w-4" />تعديل</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id);}} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="ml-2 h-4 w-4" />حذف</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
             {filteredClients.length === 0 && <CardFooter className="justify-center p-4 text-muted-foreground">لا يوجد عملاء يطابقون البحث.</CardFooter>}
          </Card>

          {selectedClient && (
          <Card className="shadow-lg animate-fadeIn">
            <CardHeader className="flex flex-row justify-between items-start">
              <div>
                <CardTitle className="font-headline text-2xl text-foreground flex items-center">
                    <Avatar className="h-12 w-12 ml-4">
                        <AvatarImage src={selectedClient.avatar} alt={selectedClient.name} data-ai-hint="person portrait" />
                        <AvatarFallback className="text-xl">{selectedClient.name.split(' ').map(n=>n[0]).join('').toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {selectedClient.name}
                </CardTitle>
                <CardDescription className="mt-1">
                    {selectedClient.email} &bull; {selectedClient.phone}
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
                            <p><strong className="text-muted-foreground/80">تاريخ الانضمام:</strong> {new Date(selectedClient.joinDate).toLocaleDateString('ar-EG')}</p>
                            <p><strong className="text-muted-foreground/80">إجمالي المنفق:</strong> <span className="font-semibold text-primary">{selectedClient.totalSpent.toFixed(2)} ر.س</span></p>
                            {selectedClient.notes && <p><strong className="text-muted-foreground/80">ملاحظات:</strong> {selectedClient.notes}</p>}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-muted-foreground mb-2 flex items-center"><ShoppingBag className="ml-2 h-4 w-4 text-primary"/>سجل الشراء الأخير</h4>
                        {clientPurchaseHistory.length > 0 ? (
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
                                    <li key={item.name}>{item.name} (×{item.quantity}) - {item.price.toFixed(2)} ر.س</li>
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

          {!selectedClient && (
             <div className="flex flex-col items-center justify-center text-center py-10">
                <UserCircle className="w-20 h-20 text-muted-foreground/30 mb-4" />
                <p className="text-lg text-muted-foreground">اختر عميلًا من القائمة أعلاه لعرض تفاصيله وسجل شرائه.</p>
                <p className="text-sm text-muted-foreground/70 mt-1">أو قم بإضافة عميل جديد لبدء بناء قاعدة بيانات عملائك.</p>
            </div>
          )}
        

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-lg bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingClient ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveClient({
                name: formData.get('c-name') as string,
                email: formData.get('c-email') as string,
                phone: formData.get('c-phone') as string,
                address: formData.get('c-address') as string || undefined,
                notes: formData.get('c-notes') as string || undefined,
                tags: (formData.get('c-tags') as string)?.split(',').map(t => t.trim()).filter(t => t) || undefined,
                avatar: formData.get('c-avatar') as string || undefined,
                joinDate: editingClient?.joinDate, 
                totalSpent: editingClient?.totalSpent 
              });
            }} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
              <div><Label htmlFor="c-name">الاسم الكامل</Label><Input id="c-name" name="c-name" defaultValue={editingClient?.name} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="c-email">البريد الإلكتروني</Label><Input id="c-email" name="c-email" type="email" defaultValue={editingClient?.email} className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="c-phone">رقم الهاتف</Label><Input id="c-phone" name="c-phone" type="tel" defaultValue={editingClient?.phone} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="c-address">العنوان (اختياري)</Label><Input id="c-address" name="c-address" defaultValue={editingClient?.address} className="mt-1 bg-input/50 focus:bg-input"/></div>
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

    