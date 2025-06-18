
// src/app/users/page.tsx
"use client";

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, FileEdit, Trash2, MoreHorizontal, UsersRound, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'مسؤول' | 'مستخدم' | 'مدير مبيعات';
  status: 'نشط' | 'غير نشط';
  avatar?: string;
  lastLogin: string;
}

const initialUsers: User[] = [
  { id: 'u1', name: 'عبدالله الأحمدي', email: 'abdullah@example.com', role: 'مسؤول', status: 'نشط', avatar: 'https://placehold.co/40x40.png?text=AA', lastLogin: '2024-07-28T10:00:00Z' },
  { id: 'u2', name: 'فاطمة الزهراء', email: 'fatima@example.com', role: 'مدير مبيعات', status: 'نشط', avatar: 'https://placehold.co/40x40.png?text=FZ', lastLogin: '2024-07-27T15:30:00Z' },
  { id: 'u3', name: 'خالد العمري', email: 'khaled@example.com', role: 'مستخدم', status: 'غير نشط', avatar: 'https://placehold.co/40x40.png?text=KO', lastLogin: '2024-07-25T09:15:00Z' },
];

const userRoles: User['role'][] = ['مسؤول', 'مستخدم', 'مدير مبيعات'];
const userStatuses: User['status'][] = ['نشط', 'غير نشط'];

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const { toast } = useToast();

  const handleAddUser = () => { setEditingUser(undefined); setIsModalOpen(true); };
  const handleEditUser = (user: User) => { setEditingUser(user); setIsModalOpen(true); };
  
  const handleDeleteUser = (id: string) => { 
    setUsers(users.filter(u => u.id !== id));
    toast({ title: 'تم حذف المستخدم', description: 'تمت إزالة المستخدم بنجاح.' });
  };

  const handleSaveUser = (userData: Omit<User, 'id' | 'lastLogin'> & { password?: string }) => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...editingUser, ...userData } : u));
      toast({ title: 'تم تحديث المستخدم', description: `تم تحديث بيانات ${userData.name}.` });
    } else {
      const newUser: User = { 
        ...userData, 
        id: String(Date.now()), 
        lastLogin: new Date().toISOString() 
      };
      setUsers([...users, newUser]);
      toast({ title: 'تمت إضافة مستخدم', description: `تمت إضافة ${userData.name} بنجاح.` });
    }
    setIsModalOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
            <UsersRound className="ml-3 h-8 w-8 text-primary" /> إدارة المستخدمين والصلاحيات
          </h1>
          <Button onClick={handleAddUser} className="mt-4 sm:mt-0 bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="ml-2 h-5 w-5" /> إضافة مستخدم جديد
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-foreground">قائمة المستخدمين</CardTitle>
            <CardDescription>عرض وإدارة مستخدمي النظام الحاليين.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الصورة الرمزية</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead>آخر تسجيل دخول</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person letter" />
                        <AvatarFallback>{user.name.split(' ').map(n=>n[0]).join('').toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                       <Badge 
                        variant={user.role === 'مسؤول' ? 'default' : user.role === 'مدير مبيعات' ? 'secondary' : 'outline'}
                        className={
                            user.role === 'مسؤول' ? 'bg-primary/20 text-primary hover:bg-primary/30 border-primary/30' :
                            user.role === 'مدير مبيعات' ? 'bg-accent/20 text-accent-foreground hover:bg-accent/30 border-accent/30' :
                            'border-muted-foreground/50 text-muted-foreground'
                        }
                       >
                        {user.role}
                        {user.role === 'مسؤول' && <ShieldCheck className="mr-1 h-3 w-3" />}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={user.status === 'نشط' ? 'default' : 'destructive'}
                       className={
                        user.status === 'نشط' ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30 border-green-500/30' :
                        'bg-red-500/20 text-red-700 hover:bg-red-500/30 border-red-500/30'
                       }>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(user.lastLogin).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                    <TableCell className="text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => handleEditUser(user)}><FileEdit className="ml-2 h-4 w-4" />تعديل</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="ml-2 h-4 w-4" />حذف</DropdownMenuItem>
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

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[480px] bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveUser({
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                password: formData.get('password') as string || undefined,
                role: formData.get('role') as User['role'],
                status: formData.get('status') as User['status'],
                avatar: formData.get('avatar') as string || undefined,
              });
            }} className="space-y-4 py-4">
              <div><Label htmlFor="u-name">الاسم الكامل</Label><Input id="u-name" name="name" defaultValue={editingUser?.name} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="u-email">البريد الإلكتروني</Label><Input id="u-email" name="email" type="email" defaultValue={editingUser?.email} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="u-password">{editingUser ? 'كلمة المرور الجديدة (اتركها فارغة لعدم التغيير)' : 'كلمة المرور'}</Label><Input id="u-password" name="password" type="password" className="mt-1 bg-input/50 focus:bg-input" required={!editingUser}/></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="u-role">الدور</Label>
                  <Select name="role" defaultValue={editingUser?.role} required dir="rtl">
                    <SelectTrigger id="u-role" className="mt-1 w-full bg-input/50 focus:bg-input">
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="u-status">الحالة</Label>
                   <Select name="status" defaultValue={editingUser?.status} required dir="rtl">
                    <SelectTrigger id="u-status" className="mt-1 w-full bg-input/50 focus:bg-input">
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      {userStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label htmlFor="u-avatar">رابط الصورة الرمزية (اختياري)</Label><Input id="u-avatar" name="avatar" defaultValue={editingUser?.avatar} className="mt-1 bg-input/50 focus:bg-input" placeholder="https://placehold.co/40x40.png"/></div>
              <DialogFooter>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ المستخدم</Button>
                <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default UsersPage;

    