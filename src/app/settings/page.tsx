
// src/app/settings/page.tsx
"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Users, Cog, Store, KeyRound, LogOut, Printer, Palette, Percent, Globe, Building, Save, UsersRound, DatabaseBackup, ShieldAlert, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const router = useRouter();
  const { user, logout, companyName, setCompanyName: setGlobalCompanyName } = useAuth();
  const { toast } = useToast();

  // State for General Settings
  const [localCompanyName, setLocalCompanyName] = useState(companyName);
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeCR, setStoreCR] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('SYP');
  const [vatRate, setVatRate] = useState('');

  // State for Account Settings
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);

  // State for Printing Settings
  const [invoiceLogoUrl, setInvoiceLogoUrl] = useState('');
  const [invoiceFooterText, setInvoiceFooterText] = useState('');

  useEffect(() => {
    setLocalCompanyName(companyName);
    // TODO: In the future, fetch other settings like address, phone, currency, VAT, print settings from Supabase if stored there.
    // For now, they are local to this component or just placeholders.
  }, [companyName]);


  const handleSaveGeneralSettings = (event: FormEvent) => {
    event.preventDefault();
    setGlobalCompanyName(localCompanyName);
    toast({ title: "تم الحفظ", description: "تم حفظ اسم الشركة المركزي بنجاح." });
    // TODO: In the future, save other general settings (address, phone, currency, VAT) to Supabase.
    // For now, only companyName is saved to localStorage via AuthContext.
    console.log("General settings saved (company name to localStorage/context):", { localCompanyName, storeAddress, storePhone, storeCR, defaultCurrency, vatRate });
  };

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
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "نجاح", description: "تم تغيير كلمة المرور بنجاح." });
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

  const handleSavePrintingSettings = (event: FormEvent) => {
    event.preventDefault();
    // TODO: In the future, save printing settings (logo URL, footer text) to Supabase.
    // Also, integrate actual printing logic.
    toast({ title: "تم الحفظ (تجريبي)", description: "تم حفظ إعدادات الطباعة (واجهة فقط حالياً)." });
    console.log("Printing settings saved (UI only):", { invoiceLogoUrl, invoiceFooterText });
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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-6">
            <TabsTrigger value="general"><Store className="ml-1 h-4 w-4 sm:hidden md:inline-block" />الإعدادات العامة</TabsTrigger>
            <TabsTrigger value="account"><KeyRound className="ml-1 h-4 w-4 sm:hidden md:inline-block" />إعدادات الحساب</TabsTrigger>
            <TabsTrigger value="printing"><Printer className="ml-1 h-4 w-4 sm:hidden md:inline-block" />إعدادات الطباعة</TabsTrigger>
            <TabsTrigger value="users"><UsersRound className="ml-1 h-4 w-4 sm:hidden md:inline-block" />المستخدمين</TabsTrigger>
            <TabsTrigger value="backup"><DatabaseBackup className="ml-1 h-4 w-4 sm:hidden md:inline-block" />النسخ الاحتياطي</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <form onSubmit={handleSaveGeneralSettings}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline text-xl text-foreground">الإعدادات العامة للنظام</CardTitle>
                  <CardDescription>إدارة المعلومات الأساسية، العملات، والضرائب. اسم الشركة هنا هو الإعداد المركزي.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <Card>
                      <CardHeader><CardTitle className="text-lg flex items-center"><Building className="ml-2 h-5 w-5 text-primary" />معلومات الشركة/المتجر</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                          <div>
                            <Label htmlFor="storeNameCentral">اسم المتجر/الشركة (مركزي)</Label>
                            <Input id="storeNameCentral" placeholder="أدخل اسم المتجر أو الشركة" className="mt-1 bg-input/50 focus:bg-input" value={localCompanyName} onChange={(e) => setLocalCompanyName(e.target.value)} />
                            <p className="text-xs text-muted-foreground mt-1">هذا الاسم سينعكس في جميع أنحاء النظام.</p>
                          </div>
                          <div><Label htmlFor="storeAddress">العنوان</Label><Textarea id="storeAddress" placeholder="أدخل عنوان المتجر" className="mt-1 bg-input/50 focus:bg-input" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} /></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div><Label htmlFor="storePhone">رقم الهاتف</Label><Input id="storePhone" type="tel" placeholder="أدخل رقم الهاتف" className="mt-1 bg-input/50 focus:bg-input" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} /></div>
                              <div><Label htmlFor="storeCR">السجل التجاري (اختياري)</Label><Input id="storeCR" placeholder="أدخل رقم السجل التجاري" className="mt-1 bg-input/50 focus:bg-input" value={storeCR} onChange={(e) => setStoreCR(e.target.value)} /></div>
                          </div>
                           <p className="text-xs text-muted-foreground mt-1">سيتم استخدام هذه المعلومات في الفواتير والتقارير (يتطلب ربطاً إضافياً لحفظها).</p>
                      </CardContent>
                  </Card>
                  
                  <Card>
                      <CardHeader><CardTitle className="text-lg flex items-center"><Globe className="ml-2 h-5 w-5 text-primary" />إدارة العملات</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <Label htmlFor="defaultCurrency">العملة الافتراضية للنظام</Label>
                                  <Select value={defaultCurrency} onValueChange={setDefaultCurrency} dir="rtl">
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
                          <p className="text-xs text-muted-foreground mt-1">ملاحظة: حفظ هذه الإعدادات وتطبيقها على مستوى النظام يتطلب جداول إضافية في قاعدة البيانات.</p>
                      </CardContent>
                  </Card>

                  <Card>
                      <CardHeader><CardTitle className="text-lg flex items-center"><Percent className="ml-2 h-5 w-5 text-primary" />إعدادات الضريبة (VAT)</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                           <div>
                              <Label htmlFor="vatRate">نسبة الضريبة المضافة (%)</Label>
                              <Input id="vatRate" type="number" step="0.01" placeholder="مثال: 14" className="mt-1 bg-input/50 focus:bg-input md:w-1/3" value={vatRate} onChange={(e) => setVatRate(e.target.value)} />
                              <p className="text-xs text-muted-foreground mt-1">اترك الحقل فارغاً أو صفراً إذا لم تكن الضريبة مطبقة. تطبيق هذه النسبة يتطلب تكاملاً في منطق الحسابات.</p>
                          </div>
                      </CardContent>
                  </Card>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Save className="ml-2 h-4 w-4"/> حفظ الإعدادات العامة
                  </Button>
                </CardFooter>
              </Card>
            </form>
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
            <form onSubmit={handleSavePrintingSettings}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline text-xl text-foreground">إعدادات الطباعة</CardTitle>
                  <CardDescription>تخصيص مظهر الفواتير المطبوعة وخيارات الطابعة. (واجهات مبدئية)</CardDescription>
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
                           <p className="text-xs text-muted-foreground mt-1">ملاحظة: تكامل الطابعات يعتمد على إعدادات النظام والمتصفح ويتطلب منطقاً برمجياً إضافياً.</p>
                      </CardContent>
                   </Card>
                   <Card>
                      <CardHeader><CardTitle className="text-lg flex items-center"><Palette className="ml-2 h-5 w-5 text-primary" />تخصيص الفاتورة المطبوعة</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                          <div>
                              <Label htmlFor="invoiceLogoUrl">رابط شعار الشركة/المتجر (URL)</Label>
                              <Input id="invoiceLogoUrl" placeholder="https://example.com/logo.png" className="mt-1 bg-input/50 focus:bg-input" value={invoiceLogoUrl} onChange={(e) => setInvoiceLogoUrl(e.target.value)} />
                              <p className="text-xs text-muted-foreground mt-1">سيظهر هذا الشعار في أعلى الفاتورة المطبوعة (يتطلب تنفيذاً برمجياً لآلية الطباعة).</p>
                          </div>
                          <div>
                              <Label htmlFor="invoiceFooterText">نص تذييل الفاتورة</Label>
                              <Textarea id="invoiceFooterText" placeholder="مثال: شكراً لزيارتكم! البضاعة المباعة لا ترد ولا تستبدل." className="mt-1 bg-input/50 focus:bg-input" value={invoiceFooterText} onChange={(e) => setInvoiceFooterText(e.target.value)} />
                          </div>
                      </CardContent>
                   </Card>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Save className="ml-2 h-4 w-4"/> حفظ إعدادات الطباعة (تجريبي)
                    </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>

          <TabsContent value="users">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-foreground">إدارة المستخدمين والصلاحيات</CardTitle>
                <CardDescription>إدارة الوصول والأدوار لمستخدمي النظام.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">يمكنك إدارة المستخدمين، تعيين الأدوار، وتحديد الصلاحيات لكل دور من خلال قسم إدارة المستخدمين المخصص.</p>
                <Button variant="outline" onClick={() => router.push('/users')}>
                  <Users className="ml-2 h-4 w-4" /> الانتقال إلى إدارة المستخدمين
                </Button>
                 <p className="text-sm text-muted-foreground mt-2">
                  ملاحظة: عمليات الإنشاء والتعديل والحذف للمستخدمين من خلال تلك الصفحة هي حالياً عمليات وهمية وتتطلب تكاملاً آمناً مع Supabase (عبر Edge Functions) ليتم تفعيلها بشكل كامل في قاعدة البيانات.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-foreground flex items-center">
                    <DatabaseBackup className="ml-2 h-6 w-6 text-primary" />
                    النسخ الاحتياطي والاستعادة
                </CardTitle>
                <CardDescription>إدارة النسخ الاحتياطية لبيانات النظام.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border border-yellow-500/50 bg-yellow-500/10 rounded-md">
                    <div className="flex items-start">
                        <ShieldAlert className="h-6 w-6 text-yellow-600 ml-3 mt-1 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-yellow-700">تنبيه هام بخصوص النسخ الاحتياطي الكامل</h4>
                            <p className="text-sm text-yellow-600 mt-1">
                                إن عملية النسخ الاحتياطي الكامل لقاعدة بيانات Supabase واستعادتها هي عملية متقدمة وحساسة.
                                يوصى بشدة باستخدام أدوات Supabase الرسمية لهذه المهمة لضمان سلامة البيانات وتجنب أي فقدان.
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-lg mb-2">تصدير بيانات محددة</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                        يمكنك تصدير مجموعات بيانات محددة (مثل المنتجات، العملاء، المبيعات) كملفات CSV أو PDF من قسم "التقارير" في النظام.
                        هذا مفيد للتحليل أو للاحتفاظ بنسخ من أجزاء معينة من البيانات.
                    </p>
                    <Button variant="outline" onClick={() => router.push('/reports')}>
                        <ExternalLink className="ml-2 h-4 w-4" /> الانتقال إلى قسم التقارير
                    </Button>
                </div>
                
                <div>
                    <h4 className="font-semibold text-lg mb-2">النسخ الاحتياطي الكامل لقاعدة البيانات (موصى به)</h4>
                    <p className="text-sm text-muted-foreground mb-1">
                        للحصول على نسخة احتياطية كاملة لجميع بياناتك، يرجى اتباع الإرشادات الرسمية لـ Supabase:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pr-4">
                        <li>استخدام <code className="bg-muted px-1 py-0.5 rounded text-xs">supabase CLI</code> مع الأمر <code className="bg-muted px-1 py-0.5 rounded text-xs">pg_dump</code>.</li>
                        <li>
                            التحقق من خيارات النسخ الاحتياطي المتاحة في لوحة تحكم مشروعك على 
                            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mx-1">
                                 Supabase Dashboard
                            </a>.
                        </li>
                    </ul>
                     <p className="text-xs text-muted-foreground mt-2">
                        القيام بعمليات نسخ احتياطي أو استعادة مباشرة من واجهة هذا التطبيق لقاعدة البيانات بأكملها يتطلب صلاحيات عالية جداً وغير متاح حالياً لأسباب أمنية.
                    </p>
                </div>
              </CardContent>
               <CardFooter>
                 <p className="text-xs text-muted-foreground">
                    تذكر: النسخ الاحتياطي الدوري للبيانات هو مسؤوليتك لضمان عدم فقدان أي معلومات هامة.
                 </p>
               </CardFooter>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
    

    

