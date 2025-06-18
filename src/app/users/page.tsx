
// src/app/users/page.tsx
"use client";

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, FileEdit, Trash2, MoreHorizontal, UsersRound, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
// TODO: Replace with Supabase calls for user management. This requires admin privileges and ideally backend functions.
// For now, user management (add, edit, delete) uses local state. Fetching users from Supabase would typically
// involve a 'profiles' table that is synced with 'auth.users' and has appropriate RLS.

interface User {
  id: string;
  name: string;
  email: string;
  role: 'مسؤول' | 'مدير مبيعات' | 'موظف مبيعات' | 'موظف مخزون' | 'محاسب';
  status: 'نشط' | 'غير نشط' | 'معلق';
  avatar?: string;
  lastLogin: string;
}

const initialUsers: User[] = [
  { id: 'u1', name: 'عبدالله الأحمدي', email: 'abdullah@example.com', role: 'مسؤول', status: 'نشط', avatar: 'https://placehold.co/40x40.png?text=AA', lastLogin: '2024-07-28T10:00:00Z' },
  { id: 'u2', name: 'فاطمة الزهراء', email: 'fatima@example.com', role: 'مدير مبيعات', status: 'نشط', avatar: 'https://placehold.co/40x40.png?text=FZ', lastLogin: '2024-07-27T15:30:00Z' },
  { id: 'u3', name: 'خالد العمري', email: 'khaled@example.com', role: 'موظف مبيعات', status: 'غير نشط', avatar: 'https://placehold.co/40x40.png?text=KO', lastLogin: '2024-07-25T09:15:00Z' },
  { id: 'u4', name: 'سارة إبراهيم', email: 'sara@example.com', role: 'موظف مخزون', status: 'نشط', avatar: 'https://placehold.co/40x40.png?text=SI', lastLogin: '2024-07-28T12:00:00Z' },
  { id: 'u5', name: 'أحمد المحمد', email: 'ahmad@example.com', role: 'محاسب', status: 'معلق', avatar: 'https://placehold.co/40x40.png?text=AM', lastLogin: '2024-07-20T11:00:00Z' },
];

const userRoles: User['role'][] = ['مسؤول', 'مدير مبيعات', 'موظف مبيعات', 'موظف مخزون', 'محاسب'];
const userStatuses: User['status'][] = ['نشط', 'غير نشط', 'معلق'];

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const { toast } = useToast();

  const handleAddUser = () => { setEditingUser(undefined); setIsModalOpen(true); };
  const handleEditUser = (user: User) => { setEditingUser(user); setIsModalOpen(true); };
  
  const handleDeleteUser = (id: string) => { 
    if (id === 'u1' && users.find(u=> u.id === 'u1')?.role === 'مسؤول') {
        toast({ title: 'لا يمكن حذف المسؤول الرئيسي', variant: "destructive" });
        return;
    }
    setUsers(users.filter(u => u.id !== id));
    toast({ title: 'تم حذف المستخدم', description: 'تمت إزالة المستخدم بنجاح.' });
  };

  const handleSaveUser = (userData: Omit<User, 'id' | 'lastLogin'> & { password?: string }) => {
    // This function currently manages users in local state.
    // For a production app, this should interact with Supabase Auth (for creating users)
    // and a 'profiles' table (for roles, custom status, etc.), likely via secure backend functions.
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...editingUser, ...userData } : u));
      toast({ title: 'تم تحديث المستخدم', description: `تم تحديث بيانات ${userData.name}.` });
    } else {
      const newUser: User = { 
        ...userData, 
        id: String(Date.now()), 
        lastLogin: new Date().toISOString(),
        avatar: userData.avatar || `https://placehold.co/40x40.png?text=${encodeURIComponent(userData.name.substring(0,1))}`,
      };
      setUsers([newUser, ...users]);
      toast({ title: 'تمت إضافة مستخدم', description: `تمت إضافة ${userData.name} بنجاح.` });
    }
    setIsModalOpen(false);
    setEditingUser(undefined);
  };

  const getRoleBadgeClass = (role: User['role']): string => {
    switch(role) {
        case 'مسؤول': return 'bg-primary/20 text-primary hover:bg-primary/30 border-primary/30';
        case 'مدير مبيعات': return 'bg-accent/20 text-accent-foreground hover:bg-accent/30 border-accent/30';
        case 'موظف مبيعات': return 'bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 border-blue-500/30';
        case 'موظف مخزون': return 'bg-purple-500/20 text-purple-700 hover:bg-purple-500/30 border-purple-500/30';
        case 'محاسب': return 'bg-orange-500/20 text-orange-700 hover:bg-orange-500/30 border-orange-500/30';
        default: return 'border-muted-foreground/50 text-muted-foreground';
    }
  }
  
  const getStatusBadgeClass = (status: User['status']): string => {
    switch(status) {
      case 'نشط': return 'bg-green-500/20 text-green-700 hover:bg-green-500/30 border-green-500/30';
      case 'غير نشط': return 'bg-red-500/20 text-red-700 hover:bg-red-500/30 border-red-500/30';
      case 'معلق': return 'bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 border-yellow-500/30';
      default: return 'border-muted-foreground/50 text-muted-foreground';
    }
  }


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
            <CardTitle className="font-headline text-xl text-foreground">قائمة المستخدمين ({users.length})</CardTitle>
            <CardDescription>عرض وإدارة مستخدمي النظام الحاليين. (ملاحظة: عمليات الإضافة والتعديل والحذف هنا تعمل على بيانات وهمية مؤقتًا).</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">الصورة</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead>آخر تسجيل دخول</TableHead>
                  <TableHead className="text-left w-[80px]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person letter" />
                        <AvatarFallback>{user.name.split(' ').map(n=>n[0]).join('').toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                       <Badge 
                        className={getRoleBadgeClass(user.role)}
                       >
                        {user.role === 'مسؤول' && <ShieldCheck className="mr-1 h-3 w-3" />}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={user.status === 'نشط' ? 'default' : 'destructive'}
                       className={getStatusBadgeClass(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(user.lastLogin).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                    <TableCell className="text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => handleEditUser(user)}><FileEdit className="ml-2 h-4 w-4" />تعديل</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={user.id === 'u1' && user.role === 'مسؤول'}><Trash2 className="ml-2 h-4 w-4" />حذف</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
           {users.length === 0 && <CardFooter className="justify-center p-4 text-muted-foreground">لا يوجد مستخدمون لعرضهم. قم بإضافة مستخدم جديد.</CardFooter>}
        </Card>

        <Dialog open={isModalOpen} onOpenChange={(isOpen) => { setIsModalOpen(isOpen); if(!isOpen) setEditingUser(undefined); }}>
          <DialogContent className="sm:max-w-[480px] bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveUser({
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                password: formData.get('password') as string || undefined, // Required only if !editingUser
                role: formData.get('role') as User['role'],
                status: formData.get('status') as User['status'],
                avatar: formData.get('avatar') as string || undefined,
              });
            }} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <div><Label htmlFor="u-name">الاسم الكامل</Label><Input id="u-name" name="name" defaultValue={editingUser?.name} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="u-email">البريد الإلكتروني</Label><Input id="u-email" name="email" type="email" defaultValue={editingUser?.email} required className="mt-1 bg-input/50 focus:bg-input"/></div>
              <div><Label htmlFor="u-password">{editingUser ? 'كلمة المرور الجديدة (اتركها فارغة لعدم التغيير)' : 'كلمة المرور'}</Label><Input id="u-password" name="password" type="password" className="mt-1 bg-input/50 focus:bg-input" required={!editingUser} placeholder="********"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="u-role">الدور</Label>
                  <Select name="role" defaultValue={editingUser?.role || userRoles[0]} required dir="rtl">
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
                   <Select name="status" defaultValue={editingUser?.status || userStatuses[0]} required dir="rtl">
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
    
