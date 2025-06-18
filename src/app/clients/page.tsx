// src/app/clients/page.tsx
"use client";

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, FileEdit, Trash2, MoreHorizontal, ShoppingBag, CalendarDays, DollarSign, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  avatar?: string;
  joinDate: string;
}

interface Purchase {
  id: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
}

const initialClients: Client[] = [
  { id: 'c1', name: 'Alice Wonderland', email: 'alice@example.com', phone: '555-0201', totalSpent: 1250.50, avatar: 'https://placehold.co/40x40.png?text=AW', joinDate: '2023-01-15' },
  { id: 'c2', name: 'Bob The Builder', email: 'bob@example.com', phone: '555-0202', totalSpent: 875.00, avatar: 'https://placehold.co/40x40.png?text=BB', joinDate: '2023-03-22' },
  { id: 'c3', name: 'Charlie Brown', email: 'charlie@example.com', phone: '555-0203', totalSpent: 2400.75, avatar: 'https://placehold.co/40x40.png?text=CB', joinDate: '2022-11-05' },
];

const mockPurchaseHistory: { [clientId: string]: Purchase[] } = {
  'c1': [
    { id: 'p1', date: '2024-07-01', items: [{ name: 'Organic Apples', quantity: 2, price: 2.99 }, { name: 'Whole Wheat Bread', quantity: 1, price: 3.49 }], total: 9.47 },
    { id: 'p2', date: '2024-06-15', items: [{ name: 'Almond Milk', quantity: 3, price: 2.79 }], total: 8.37 },
  ],
  'c2': [
    { id: 'p3', date: '2024-07-10', items: [{ name: 'Free-Range Eggs', quantity: 2, price: 4.99 }], total: 9.98 },
  ],
};

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const { toast } = useToast();

  const handleAddClient = () => { setEditingClient(undefined); setIsModalOpen(true); };
  const handleEditClient = (client: Client) => { setEditingClient(client); setIsModalOpen(true); };
  const handleDeleteClient = (id: string) => { 
    setClients(clients.filter(c => c.id !== id));
    if (selectedClient?.id === id) setSelectedClient(null);
    toast({ title: 'Client Deleted', description: 'The client has been removed.' });
  };

  const handleSaveClient = (clientData: Omit<Client, 'id' | 'totalSpent' | 'joinDate'> & { totalSpent?: number, joinDate?: string }) => {
    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? { ...editingClient, ...clientData } : c));
      toast({ title: 'Client Updated', description: `${clientData.name} has been updated.` });
    } else {
      const newClient = { ...clientData, id: String(Date.now()), totalSpent: clientData.totalSpent || 0, joinDate: clientData.joinDate || new Date().toISOString().split('T')[0] };
      setClients([...clients, newClient]);
      toast({ title: 'Client Added', description: `${clientData.name} has been added.` });
    }
    setIsModalOpen(false);
  };

  const clientPurchaseHistory = selectedClient ? mockPurchaseHistory[selectedClient.id] || [] : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-headline font-semibold text-foreground">Client Management</h1>
          <Button onClick={handleAddClient} className="mt-4 sm:mt-0 bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Client
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground">Client List</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Avatar</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map(client => (
                    <TableRow key={client.id} onClick={() => setSelectedClient(client)} className={`cursor-pointer hover:bg-muted/50 transition-colors ${selectedClient?.id === client.id ? 'bg-primary/10' : ''}`}>
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={client.avatar} alt={client.name} data-ai-hint="person portrait" />
                          <AvatarFallback>{client.name.split(' ').map(n=>n[0]).join('').toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{client.name}</TableCell>
                      <TableCell className="text-muted-foreground">{client.email}</TableCell>
                      <TableCell className="text-muted-foreground">{client.phone}</TableCell>
                      <TableCell className="text-right text-muted-foreground">${client.totalSpent.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClient(client);}}><FileEdit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id);}} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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

          <Card className="lg:col-span-1 shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground">Client Details & History</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedClient ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedClient.avatar} alt={selectedClient.name} data-ai-hint="person portrait"/>
                      <AvatarFallback className="text-2xl">{selectedClient.name.split(' ').map(n=>n[0]).join('').toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{selectedClient.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                      <p className="text-sm text-muted-foreground">{selectedClient.phone}</p>
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong className="text-muted-foreground">Joined:</strong> {new Date(selectedClient.joinDate).toLocaleDateString()}</p>
                    <p><strong className="text-muted-foreground">Total Spent:</strong> <span className="font-semibold text-primary">${selectedClient.totalSpent.toFixed(2)}</span></p>
                  </div>
                  
                  <h4 className="text-md font-semibold pt-2 text-foreground">Purchase History</h4>
                  {clientPurchaseHistory.length > 0 ? (
                    <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {clientPurchaseHistory.map(purchase => (
                        <li key={purchase.id} className="p-3 border rounded-md bg-muted/30">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-foreground">Order ID: {purchase.id.toUpperCase()}</span>
                            <span className="text-xs text-muted-foreground">{new Date(purchase.date).toLocaleDateString()}</span>
                          </div>
                          <ul className="text-xs list-disc list-inside pl-1 text-muted-foreground">
                            {purchase.items.map(item => (
                              <li key={item.name}>{item.name} (x{item.quantity}) - ${item.price.toFixed(2)}</li>
                            ))}
                          </ul>
                          <p className="text-right text-sm font-semibold text-primary mt-1">Total: ${purchase.total.toFixed(2)}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No purchase history found for this client.</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <UserCircle className="w-16 h-16 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Select a client to view details and purchase history.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Client Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[480px] bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveClient({
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                avatar: formData.get('avatar') as string || undefined,
                joinDate: editingClient?.joinDate, // Keep existing or set new
                totalSpent: editingClient?.totalSpent // Keep existing or set new
              });
            }} className="space-y-4 py-4">
              <div><Label htmlFor="c-name">Name</Label><Input id="c-name" name="name" defaultValue={editingClient?.name} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="c-email">Email</Label><Input id="c-email" name="email" type="email" defaultValue={editingClient?.email} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="c-phone">Phone</Label><Input id="c-phone" name="phone" type="tel" defaultValue={editingClient?.phone} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="c-avatar">Avatar URL (Optional)</Label><Input id="c-avatar" name="avatar" defaultValue={editingClient?.avatar} className="mt-1 bg-input/50 focus:bg-input"/></div>
              <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Client</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ClientsPage;
