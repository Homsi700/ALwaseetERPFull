// src/app/users/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client
import { useAuth } from '@/hooks/useAuth';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'مسؤول' | 'مدير مبيعات' | 'موظف مبيعات' | 'موظف مخزون' | 'محاسب';
  status: 'نشط' | 'غير نشط' | 'معلق';
  avatar?: string;
  lastLogin?: string; // Make lastLogin optional as it might not always be available/relevant from auth.users
}

// Initial mock users. This will be replaced by data fetched from Supabase if a 'profiles' table is used.
const initialUsers: User[] = [
  { id: 'u1', name: 'عبدالله الأحمدي', email: 'admin@example.com', role: 'مسؤول', status: 'نشط', avatar: 'https://placehold.co/40x40.png?text=AA', lastLogin: '2024-07-28T10:00:00Z' },
  { id: 'u2', name: 'فاطمة الزهراء', email: 'fatima@example.com', role: 'مدير مبيعات', status: 'نشط', avatar: 'https://placehold.co/40x40.png?text=FZ', lastLogin: '2024-07-27T15:30:00Z' },
  { id: 'u3', name: 'خالد العمري', email: 'khaled@example.com', role: 'موظف مبيعات', status: 'غير نشط', avatar: 'https://placehold.co/40x40.png?text=KO', lastLogin: '2024-07-25T09:15:00Z' },
];

const userRoles: User['role'][] = ['مسؤول', 'مدير مبيعات', 'موظف مبيعات', 'موظف مخزون', 'محاسب'];
const userStatuses: User['status'][] = ['نشط', 'غير نشط', 'معلق'];

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const { toast } = useToast();
  const { user: authUser } = useAuth(); // For checking current user's role if needed in future

  useEffect(() => {
    // IMPORTANT SUPABASE INTEGRATION NOTE FOR FETCHING USERS:
    // Fetching a list of all users from `auth.users` directly from the client-side
    // is generally NOT recommended or secure for non-admin roles.
    // `supabase.auth.admin.listUsers()` requires admin privileges and should only be called from a secure backend environment (e.g., Supabase Edge Functions).

    // OPTION 1 (Recommended for production): Create a `profiles` table in Supabase.
    // This table would be linked to `auth.users` (e.g., via a foreign key on user_id).
    // It would store public profile information (name, role, avatar_url, status).
    // You would then set up Row Level Security (RLS) policies on the `profiles` table
    // to allow authorized users (e.g., admins) to read this list.
    // Example fetch (if `profiles` table exists and RLS allows):
    /*
    const fetchUserProfiles = async () => {
      if (!authUser) return;
      setIsLoadingUsers(true);
      try {
        const { data, error } = await supabase
          .from('profiles') // Assuming a 'profiles' table
          .select('id, full_name, email, role, status, avatar_url, last_sign_in_at'); // Adjust columns as needed
        
        if (error) throw error;
        
        const fetchedUsers: User[] = data.map((profile: any) => ({
          id: profile.id,
          name: profile.full_name || profile.email?.split('@')[0] || 'مستخدم',
          email: profile.email,
          role: profile.role as User['role'] || 'موظف مبيعات', // Default role or map from profile
          status: profile.status as User['status'] || 'نشط', // Default status or map
          avatar: profile.avatar_url,
          lastLogin: profile.last_sign_in_at,
        }));
        setUsers(fetchedUsers);
      } catch (error: any) {
        toast({
          title: 'خطأ في جلب المستخدمين',
          description: 'لم نتمكن من جلب قائمة المستخدمين من قاعدة البيانات. ' + error.message,
          variant: 'destructive',
        });
        // Fallback to initialUsers or an empty array if fetch fails
        setUsers(initialUsers); 
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUserProfiles();
    */

    // OPTION 2 (For demonstration with mock data, as per current request):
    // We will continue to use `initialUsers` to demonstrate the UI,
    // as direct client-side fetching of all `auth.users` is not feasible without backend logic or a `profiles` table.
    // Simulate loading state for demo purposes if needed.
    setIsLoadingUsers(true);
    setTimeout(() => {
        setUsers(initialUsers); // Or an empty array if you prefer to start with no users shown
        setIsLoadingUsers(false);
    }, 500); // Simulate network delay

    console.warn(
      "User Management: Displaying mock user data. " +
      "For production, fetch user profiles from a dedicated 'profiles' table in Supabase " +
      "with appropriate RLS, or use a secure backend function to list users."
    );

  }, [authUser, toast]);


  const handleAddUser = () => { setEditingUser(undefined); setIsModalOpen(true); };
  const handleEditUser = (user: User) => { setEditingUser(user); setIsModalOpen(true); };
  
  const handleDeleteUser = (id: string) => { 
    // IMPORTANT: This is a MOCK delete operation affecting local state only.
    // Actual user deletion in Supabase Auth requires admin privileges and should be handled via a secure backend function.
    console.warn(`MOCK DELETE: Attempting to delete user ${id}. This is a local state change only.`);
    if (id === 'u1' && users.find(u=> u.id === 'u1')?.role === 'مسؤول') { // Example check for primary admin
        toast({ title: 'لا يمكن حذف المسؤول الرئيسي (وهمي)', variant: "destructive" });
        return;
    }
    setUsers(users.filter(u => u.id !== id));
    toast({ title: 'تم حذف المستخدم (وهمي)', description: 'تمت إزالة المستخدم من القائمة المحلية.' });
  };

  const handleSaveUser = (userData: Omit<User, 'id' | 'lastLogin'> & { password?: string }) => {
    // IMPORTANT: This is a MOCK save operation affecting local state only.
    // Actual user creation/update in Supabase Auth (for password, email changes) or a 'profiles' table (for roles, status)
    // requires specific Supabase functions and potentially admin privileges for some operations.
    // User creation (signUp) can be done from client, but role/status management usually needs more control.
    console.warn(`MOCK SAVE: Saving user data for ${userData.name}. This is a local state change only.`);
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...editingUser, ...userData, lastLogin: editingUser.lastLogin || new Date().toISOString() } : u));
      toast({ title: 'تم تحديث المستخدم (وهمي)', description: `تم تحديث بيانات ${userData.name} محلياً.` });
    } else {
      const newUser: User = { 
        ...userData, 
        id: String(Date.now()), // Mock ID
        lastLogin: new Date().toISOString(),
        avatar: userData.avatar || `https://placehold.co/40x40.png?text=${encodeURIComponent(userData.name.substring(0,1))}`,
      };
      setUsers([newUser, ...users]);
      toast({ title: 'تمت إضافة مستخدم (وهمي)', description: `تمت إضافة ${userData.name} محلياً.` });
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
            <PlusCircle className="ml-2 h-5 w-5" /> إضافة مستخدم جديد (وهمي)
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-foreground">قائمة المستخدمين ({users.length})</CardTitle>
            <CardDescription>
              عرض مستخدمي النظام. لجلب قائمة المستخدمين الفعلية من Supabase بشكل آمن، يتطلب الأمر عادةً جدول 'profiles' مخصص مع RLS أو استخدام وظائف خلفية (Edge Functions).
              عمليات الإضافة والتعديل والحذف هنا هي عمليات وهمية وتؤثر على الحالة المحلية فقط.
            </CardDescription>
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
                {isLoadingUsers ? (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center">جاري تحميل المستخدمين...</TableCell></TableRow>
                ) : users.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">لا يوجد مستخدمون لعرضهم.</TableCell></TableRow>
                ) : users.map(user => (
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
                      <Badge
                       className={getStatusBadgeClass(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                    <TableCell className="text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => handleEditUser(user)}><FileEdit className="ml-2 h-4 w-4" />تعديل (وهمي)</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={user.role === 'مسؤول' && user.email === 'admin@example.com'}><Trash2 className="ml-2 h-4 w-4" />حذف (وهمي)</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
           {users.length === 0 && !isLoadingUsers && <CardFooter className="justify-center p-4 text-muted-foreground">لا يوجد مستخدمون لعرضهم. قم بإضافة مستخدم جديد (وهمي).</CardFooter>}
        </Card>

        <Dialog open={isModalOpen} onOpenChange={(isOpen) => { setIsModalOpen(isOpen); if(!isOpen) setEditingUser(undefined); }}>
          <DialogContent className="sm:max-w-[480px] bg-card">
            <DialogHeader><DialogTitle className="font-headline text-2xl text-foreground">{editingUser ? 'تعديل المستخدم (وهمي)' : 'إضافة مستخدم جديد (وهمي)'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              // IMPORTANT: This is a MOCK save. Actual user creation/update needs secure backend handling.
              handleSaveUser({
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                password: formData.get('password') as string || undefined, 
                role: formData.get('role') as User['role'],
                status: formData.get('status') as User['status'],
                avatar: formData.get('avatar') as string || undefined,
              });
            }} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">تنبيه: عمليات الحفظ هنا وهمية وتؤثر على الحالة المحلية فقط. إدارة المستخدمين الفعلية تتطلب تكاملاً آمناً مع Supabase.</p>
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
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ المستخدم (وهمي)</Button>
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
    
