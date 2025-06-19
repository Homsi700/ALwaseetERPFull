
// src/app/settings/page.tsx
"use client";

import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Cog, Store, Package, ShoppingCart, Link2, LayoutDashboard, UsersRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SettingsPage = () => {
  const router = useRouter();

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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
            <TabsTrigger value="general"><Store className="ml-1 h-4 w-4 sm:hidden md:inline-block" />الإعدادات العامة</TabsTrigger>
            <TabsTrigger value="inventory"><Package className="ml-1 h-4 w-4 sm:hidden md:inline-block" />إعدادات المخزون</TabsTrigger>
            <TabsTrigger value="pos"><ShoppingCart className="ml-1 h-4 w-4 sm:hidden md:inline-block" />إعدادات المبيعات</TabsTrigger>
            <TabsTrigger value="users"><UsersRound className="ml-1 h-4 w-4 sm:hidden md:inline-block" />المستخدمين والصلاحيات</TabsTrigger>
            <TabsTrigger value="integration"><Link2 className="ml-1 h-4 w-4 sm:hidden md:inline-block" />الربط التقني</TabsTrigger>
            <TabsTrigger value="homeScreen"><LayoutDashboard className="ml-1 h-4 w-4 sm:hidden md:inline-block" />الشاشة الرئيسية</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-foreground">الإعدادات العامة</CardTitle>
                <CardDescription>إدارة الإعدادات الأساسية لتطبيقك.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="language">اللغة</Label>
                    <Select defaultValue="ar" dir="rtl">
                      <SelectTrigger id="language" className="mt-1 bg-input/50 focus:bg-input">
                        <SelectValue placeholder="اختر اللغة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">العملة الأساسية</Label>
                    <Select defaultValue="SYP" dir="rtl">
                      <SelectTrigger id="currency" className="mt-1 bg-input/50 focus:bg-input">
                        <SelectValue placeholder="اختر العملة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SYP">ليرة سورية (ل.س)</SelectItem>
                        <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                      </SelectContent>
                    </Select>
                     <p className="text-xs text-muted-foreground mt-1">سيتم استخدام هذه العملة بشكل افتراضي في النظام. يمكن دعم الدولار لعمليات شراء ودفع محددة.</p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="storeName">اسم المتجر/الشركة</Label>
                  <Input id="storeName" placeholder="أدخل اسم المتجر أو الشركة" className="mt-1 bg-input/50 focus:bg-input" />
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ الإعدادات العامة</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-foreground">إعدادات المخزون</CardTitle>
                <CardDescription>تخصيص كيفية إدارة المخزون الخاص بك.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>إدارة وحدات القياس</Label>
                  <p className="text-sm text-muted-foreground mt-1">وحدات القياس المدعومة حالياً: قطعة، كيلو، متر، غرام، علبة، لتر، طرد.</p>
                   <p className="text-xs text-accent mt-2">ملاحظة: سيتم تطوير واجهة متقدمة لإدارة الوحدات لاحقاً.</p>
                </div>
                <hr className="border-border"/>
                <div className="space-y-3">
                  <Label>تنبيهات المخزون</Label>
                  <div className="flex items-center space-x-reverse space-x-2">
                    <Switch id="stockAlerts" />
                    <Label htmlFor="stockAlerts">تفعيل تنبيهات انخفاض المخزون</Label>
                  </div>
                  <div>
                    <Label htmlFor="alertThreshold" className="text-sm">حد التنبيه للمخزون المنخفض</Label>
                    <Input id="alertThreshold" type="number" placeholder="مثال: 10" className="mt-1 bg-input/50 focus:bg-input w-full md:w-1/2" />
                  </div>
                </div>
                 <hr className="border-border"/>
                <div className="space-y-3">
                  <Label>إدارة الدفعات وتواريخ الانتهاء</Label>
                  <div className="flex items-center space-x-reverse space-x-2">
                    <Switch id="batchTracking" />
                    <Label htmlFor="batchTracking">تفعيل تتبع الدفعات وتواريخ انتهاء الصلاحية للمنتجات</Label>
                  </div>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ إعدادات المخزون</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pos">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-foreground">إعدادات المبيعات ونقطة البيع</CardTitle>
                <CardDescription>تكوين أجهزة نقطة البيع وخيارات الدفع.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="receiptPrinter">طابعة الإيصالات</Label>
                        <Select dir="rtl">
                        <SelectTrigger id="receiptPrinter" className="mt-1 bg-input/50 focus:bg-input">
                            <SelectValue placeholder="اختر طابعة الإيصالات" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="printer1">طابعة إيصالات حرارية (POS-80C)</SelectItem>
                            <SelectItem value="printer2">Epson TM-T20II</SelectItem>
                             <SelectItem value="none">بدون طابعة</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="barcodePrinter">طابعة الباركود</Label>
                        <Select dir="rtl">
                        <SelectTrigger id="barcodePrinter" className="mt-1 bg-input/50 focus:bg-input">
                            <SelectValue placeholder="اختر طابعة الباركود" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="barcode_printer1">Zebra ZD420</SelectItem>
                            <SelectItem value="barcode_printer2">Brother QL-800</SelectItem>
                            <SelectItem value="none">بدون طابعة</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                </div>
                 <hr className="border-border"/>
                <div>
                  <Label>أجهزة المسح الضوئي للباركود</Label>
                  <p className="text-sm text-muted-foreground mt-1">عادةً ما يتم اكتشاف أجهزة المسح الضوئي USB تلقائياً عند توصيلها.</p>
                </div>
                 <hr className="border-border"/>
                <div>
                    <Label>طرق الدفع المتاحة</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                        <div className="flex items-center space-x-reverse space-x-2"> <Checkbox id="payCash" defaultChecked /> <Label htmlFor="payCash">نقدي</Label> </div>
                        <div className="flex items-center space-x-reverse space-x-2"> <Checkbox id="payCard" /> <Label htmlFor="payCard">بطاقة ائتمانية/خصم مباشر</Label> </div>
                        <div className="flex items-center space-x-reverse space-x-2"> <Checkbox id="payTransfer" /> <Label htmlFor="payTransfer">تحويل بنكي</Label> </div>
                        <div className="flex items-center space-x-reverse space-x-2"> <Checkbox id="payWallet" /> <Label htmlFor="payWallet">محفظة رقمية</Label> </div>
                    </div>
                </div>
                <hr className="border-border"/>
                <div className="space-y-3">
                  <Label>خيارات الخصم</Label>
                  <div className="flex items-center space-x-reverse space-x-2">
                    <Switch id="enableDiscounts" />
                    <Label htmlFor="enableDiscounts">تفعيل نظام الخصومات على المبيعات</Label>
                  </div>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ إعدادات المبيعات</Button>
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

          <TabsContent value="integration">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-foreground">إعدادات الربط التقني</CardTitle>
                <CardDescription>تكوين الاتصالات مع الخدمات الخارجية وواجهات برمجة التطبيقات.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="apiUrl">عنوان API الرئيسي للنظام</Label>
                  <Input id="apiUrl" placeholder="https://api.example.com/v1" className="mt-1 bg-input/50 focus:bg-input" />
                </div>
                <Button variant="outline">
                  <Link2 className="ml-2 h-4 w-4" /> اختبار الاتصال بواجهة API
                </Button>
                <p className="text-sm text-muted-foreground">ملاحظة: هذه الإعدادات مخصصة للمطورين وقد تتطلب معرفة تقنية.</p>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ إعدادات الربط</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="homeScreen">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-foreground">إدارة الشاشة الرئيسية</CardTitle>
                <CardDescription>تحديد المحتوى أو الصفحة التي تظهر للمستخدم بعد تسجيل الدخول مباشرة.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="defaultScreen">الشاشة الافتراضية بعد تسجيل الدخول</Label>
                  <Select defaultValue="dashboard" dir="rtl">
                    <SelectTrigger id="defaultScreen" className="mt-1 bg-input/50 focus:bg-input">
                      <SelectValue placeholder="اختر الشاشة الافتراضية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dashboard">لوحة التحكم</SelectItem>
                      <SelectItem value="pos">نقطة البيع</SelectItem>
                      <SelectItem value="products">إدارة المنتجات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ إعدادات الشاشة الرئيسية</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;

    
