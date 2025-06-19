
// src/app/settings/page.tsx
"use client";

import React, { useState, FormEvent } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Users, Cog, Store, Package, ShoppingCart, Link2, LayoutDashboard, UsersRound, KeyRound, LogOut, Printer, Palette, Percent, Globe, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      toast({ title: "خطأ", description: "يجب تسجيل الدخول لتغيير كلمة المرور.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "خطأ", description: "كلمة المرور الجديدة وتأكيدها غير متطابقين.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
        toast({ title: "خطأ", description: "يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل.", variant: "destructive" });
        return;
    }

    setIsPasswordChanging(true);
    try {
      // Supabase requires the user to be re-authenticated to change password if it's not a password recovery flow.
      // However, if the user is already logged in, updateUser should work for changing the password directly.
      // For password change, Supabase typically expects only the new password.
      // If changing password for the *current* user, re-authentication with old password is not directly supported via updateUser.
      // The common pattern is: 1. Verify old password (if needed, via a custom function). 2. Call updateUser with new password.
      // For simplicity here, we will directly call updateUser. A real-world scenario might need more robust verification.

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        throw error;
      }

      toast({ title: "نجاح", description: "تم تغيير كلمة المرور بنجاح." });
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      console.error("Password change error:", error);
      toast({
        title: "فشل تغيير كلمة المرور",
        description: error.message || "حدث خطأ أثناء محاولة تغيير كلمة المرور.",
        variant: "destructive",
      });
    } finally {
      setIsPasswordChanging(false);
    }
  };


  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
            <Cog className="ml-3 h-8 w-8 text-primary" />
            الإعدادات والتكوين
          </h1>
        </div>

        <Tabs defaultValue="general" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 mb-6">
            <TabsTrigger value="general"><Store className="ml-1 h-4 w-4 sm:hidden md:inline-block" />الإعدادات العامة</TabsTrigger>
            <TabsTrigger value="account"><KeyRound className="ml-1 h-4 w-4 sm:hidden md:inline-block" />إعدادات الحساب</TabsTrigger>
            <TabsTrigger value="printing"><Printer className="ml-1 h-4 w-4 sm:hidden md:inline-block" />إعدادات الطباعة</TabsTrigger>
            <TabsTrigger value="inventory"><Package className="ml-1 h-4 w-4 sm:hidden md:inline-block" />إعدادات المخزون</TabsTrigger>
            <TabsTrigger value="pos"><ShoppingCart className="ml-1 h-4 w-4 sm:hidden md:inline-block" />إعدادات المبيعات</TabsTrigger>
            <TabsTrigger value="users"><UsersRound className="ml-1 h-4 w-4 sm:hidden md:inline-block" />المستخدمين والصلاحيات</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-foreground">الإعدادات العامة للنظام</CardTitle>
                <CardDescription>إدارة المعلومات الأساسية، العملات، والضرائب.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><Building className="ml-2 h-5 w-5 text-primary" />معلومات الشركة/المتجر</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div><Label htmlFor="storeName">اسم المتجر/الشركة</Label><Input id="storeName" placeholder="أدخل اسم المتجر أو الشركة" className="mt-1 bg-input/50 focus:bg-input" /></div>
                        <div><Label htmlFor="storeAddress">العنوان</Label><Textarea id="storeAddress" placeholder="أدخل عنوان المتجر" className="mt-1 bg-input/50 focus:bg-input" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label htmlFor="storePhone">رقم الهاتف</Label><Input id="storePhone" type="tel" placeholder="أدخل رقم الهاتف" className="mt-1 bg-input/50 focus:bg-input" /></div>
                            <div><Label htmlFor="storeCR">السجل التجاري (اختياري)</Label><Input id="storeCR" placeholder="أدخل رقم السجل التجاري" className="mt-1 bg-input/50 focus:bg-input" /></div>
                        </div>
                         <p className="text-xs text-muted-foreground mt-1">سيتم استخدام هذه المعلومات في الفواتير والتقارير.</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><Globe className="ml-2 h-5 w-5 text-primary" />إدارة العملات</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="defaultCurrency">العملة الافتراضية للنظام</Label>
                                <Select defaultValue="SYP" dir="rtl">
                                <SelectTrigger id="defaultCurrency" className="mt-1 bg-input/50 focus:bg-input"> <SelectValue /> </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SYP">ليرة سورية (ل.س)</SelectItem>
                                    <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                                </SelectContent>
                                </Select>
                            </div>
                            <div>
                               <Label htmlFor="secondaryCurrency">دعم عملة ثانوية (اختياري)</Label>
                               <Select dir="rtl">
                                <SelectTrigger id="secondaryCurrency" className="mt-1 bg-input/50 focus:bg-input"> <SelectValue placeholder="لا يوجد" /> </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">لا يوجد</SelectItem>
                                    <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                                    <SelectItem value="EUR">يورو (EUR)</SelectItem>
                                </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">سيتم تطوير واجهة متقدمة لإضافة/تعديل/حذف العملات وأسعار صرفها لاحقاً.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><Percent className="ml-2 h-5 w-5 text-primary" />إعدادات الضريبة (VAT)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <Label htmlFor="vatRate">نسبة الضريبة المضافة (%)</Label>
                            <Input id="vatRate" type="number" step="0.01" placeholder="مثال: 14" className="mt-1 bg-input/50 focus:bg-input md:w-1/3" />
                            <p className="text-xs text-muted-foreground mt-1">اترك الحقل فارغاً أو صفراً إذا لم تكن الضريبة مطبقة.</p>
                        </div>
                    </CardContent>
                </Card>

                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ الإعدادات العامة</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-foreground">إعدادات الحساب</CardTitle>
                <CardDescription>إدارة معلومات حسابك وخيارات الأمان.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                 <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><KeyRound className="ml-2 h-5 w-5 text-primary" />تغيير كلمة المرور</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            {/* Supabase's standard updateUser doesn't require oldPassword unless you build custom logic */}
                            {/* <div className="space-y-1">
                                <Label htmlFor="oldPassword">كلمة المرور الحالية</Label>
                                <Input id="oldPassword" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className="bg-input/50 focus:bg-input"/>
                            </div> */}
                            <div className="space-y-1">
                                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="bg-input/50 focus:bg-input"/>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="confirmNewPassword">تأكيد كلمة المرور الجديدة</Label>
                                <Input id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required className="bg-input/50 focus:bg-input"/>
                            </div>
                            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPasswordChanging}>
                                {isPasswordChanging ? 'جارٍ التغيير...' : 'تغيير كلمة المرور'}
                            </Button>
                        </form>
                    </CardContent>
                 </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><LogOut className="ml-2 h-5 w-5 text-destructive" />تسجيل الخروج</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-3">هل أنت متأكد أنك تريد تسجيل الخروج من النظام؟</p>
                        <Button variant="destructive" onClick={logout}>تسجيل الخروج</Button>
                    </CardContent>
                 </Card>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="printing">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-foreground">إعدادات الطباعة</CardTitle>
                <CardDescription>تخصيص مظهر الفواتير المطبوعة وخيارات الطابعة.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                 <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><Printer className="ml-2 h-5 w-5 text-primary" />إعدادات الطابعة</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="defaultInvoicePrinter">الطابعة الافتراضية للفواتير</Label>
                            <Select dir="rtl">
                            <SelectTrigger id="defaultInvoicePrinter" className="mt-1 bg-input/50 focus:bg-input"> <SelectValue placeholder="اختر طابعة" /> </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pos-80c">طابعة إيصالات حرارية (POS-80C)</SelectItem>
                                <SelectItem value="system-default">طابعة النظام الافتراضية</SelectItem>
                            </SelectContent>
                            </Select>
                        </div>
                         <p className="text-xs text-muted-foreground mt-1">ملاحظة: تكامل الطابعات يعتمد على إعدادات النظام والمتصفح.</p>
                    </CardContent>
                 </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><Palette className="ml-2 h-5 w-5 text-primary" />تخصيص الفاتورة المطبوعة</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="invoiceLogo">شعار الشركة/المتجر (URL)</Label>
                            <Input id="invoiceLogo" placeholder="https://example.com/logo.png" className="mt-1 bg-input/50 focus:bg-input" />
                            <p className="text-xs text-muted-foreground mt-1">سيظهر هذا الشعار في أعلى الفاتورة المطبوعة.</p>
                        </div>
                        <div>
                            <Label htmlFor="invoiceFooterText">نص تذييل الفاتورة</Label>
                            <Textarea id="invoiceFooterText" placeholder="مثال: شكراً لزيارتكم! البضاعة المباعة لا ترد ولا تستبدل." className="mt-1 bg-input/50 focus:bg-input" />
                        </div>
                    </CardContent>
                 </Card>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ إعدادات الطباعة</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-foreground">إعدادات المخزون</CardTitle>
                <CardDescription>تخصيص كيفية إدارة المخزون الخاص بك. (محتوى تجريبي)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <p className="text-muted-foreground">سيتم تطوير هذا القسم لاحقاً ليشمل إدارة وحدات القياس المتقدمة، تنبيهات المخزون، وتتبع الدفعات.</p>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled>حفظ إعدادات المخزون (قيد التطوير)</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pos">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-foreground">إعدادات المبيعات ونقطة البيع</CardTitle>
                <CardDescription>تكوين أجهزة نقطة البيع وخيارات الدفع. (محتوى تجريبي)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <p className="text-muted-foreground">سيتم تطوير هذا القسم لاحقاً ليشمل اختيار الطابعات، تكوين أجهزة المسح، وتحديد طرق الدفع المتاحة.</p>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled>حفظ إعدادات المبيعات (قيد التطوير)</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-foreground">إدارة المستخدمين والصلاحيات</CardTitle>
                <CardDescription>إدارة الوصول والأدوار لمستخدمي النظام. يتم الوصول إلى هذه الوظيفة من خلال صفحتها المخصصة.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">يمكنك إدارة المستخدمين، تعيين الأدوار، وتحديد الصلاحيات لكل دور من خلال قسم إدارة المستخدمين المخصص.</p>
                <Button variant="outline" onClick={() => router.push('/users')}>
                  <Users className="ml-2 h-4 w-4" /> الانتقال إلى إدارة المستخدمين
                </Button>
                 <p className="text-sm text-muted-foreground mt-2">
                  ملاحظة: عمليات الإنشاء والتعديل والحذف للمستخدمين من خلال تلك الصفحة هي حالياً عمليات وهمية (تؤثر على الواجهة فقط) وتتطلب تكاملاً آمناً مع Supabase (عبر Edge Functions) ليتم تفعيلها بشكل كامل في قاعدة البيانات.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
    

    