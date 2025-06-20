
// src/app/dashboard/page.tsx
"use client";

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Users, DollarSign, ShoppingBag, AlertTriangle, PieChart, BarChart2, FileSpreadsheet } from 'lucide-react';
import { BarChart as RechartsBarChart, LineChart as RechartsLineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import React from 'react';
import { useRouter } from 'next/navigation';

const salesData = [
  { month: 'يناير', sales: 4000, profit: 2400 },
  { month: 'فبراير', sales: 3000, profit: 1398 },
  { month: 'مارس', sales: 2000, profit: 9800 },
  { month: 'أبريل', sales: 2780, profit: 3908 },
  { month: 'مايو', sales: 1890, profit: 4800 },
  { month: 'يونيو', sales: 2390, profit: 3800 },
];

const customerActivityData = [
  { date: '2024-01-01', new: 5, active: 50 },
  { date: '2024-02-01', new: 8, active: 55 },
  { date: '2024-03-01', new: 12, active: 60 },
  { date: '2024-04-01', new: 7, active: 62 },
  { date: '2024-05-01', new: 10, active: 68 },
  { date: '2024-06-01', new: 15, active: 75 },
];

const topProductsData = [
  { name: 'تفاح عضوي', value: 400 },
  { name: 'خبز قمح', value: 300 },
  { name: 'بيض بلدي', value: 200 },
  { name: 'حليب لوز', value: 278 },
  { name: 'دجاج مبرد', value: 189 },
];


const chartConfig = {
  sales: {
    label: "المبيعات (ل.س)",
    color: "hsl(var(--chart-1))",
  },
  profit: {
    label: "الأرباح (ل.س)",
    color: "hsl(var(--chart-2))",
  },
  newCustomers: {
    label: "عملاء جدد",
    color: "hsl(var(--chart-1))",
  },
  activeCustomers: {
    label: "عملاء نشطون",
    color: "hsl(var(--chart-2))",
  },
  topProduct: {
    label: "المنتج",
    color: "hsl(var(--chart-3))"
  }
} satisfies React.ComponentProps<typeof ChartContainer>["config"];


const DashboardPage = () => {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-headline font-semibold text-foreground">نظرة عامة على لوحة التحكم</h1>
          <Button variant="outline" className="mt-4 sm:mt-0 border-primary text-primary hover:bg-primary/10 text-sm px-3 py-1.5 h-auto">
            <Download className="ml-2 h-4 w-4" /> تصدير البيانات
          </Button>
        </div>

        {/* Key Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            className="shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-primary cursor-pointer hover:ring-2 hover:ring-primary/50"
            onClick={() => router.push('/reports')}
            title="عرض تقارير المبيعات والإيرادات"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-3.5 w-3.5 text-primary" />
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0.5">
              <div className="text-xl font-bold font-headline text-foreground">٤٥٬٢٣١٫٨٩ ل.س</div>
              <p className="text-xs text-green-500 pt-0.5 flex items-center">
                <TrendingUp className="h-2.5 w-2.5 mr-1" /> ٢٠٫١٪+
              </p>
            </CardContent>
          </Card>
          <Card 
            className="shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-accent cursor-pointer hover:ring-2 hover:ring-accent/50"
            onClick={() => router.push('/clients')}
            title="الانتقال إلى إدارة العملاء"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">العملاء النشطون</CardTitle>
              <Users className="h-3.5 w-3.5 text-accent" />
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0.5">
              <div className="text-xl font-bold font-headline text-foreground">٢٬٣٥٠+</div>
              <p className="text-xs text-green-500 pt-0.5 flex items-center">
                <TrendingUp className="h-2.5 w-2.5 mr-1" /> ١٨٠٫١٪+
              </p>
            </CardContent>
          </Card>
          <Card 
            className="shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-secondary cursor-pointer hover:ring-2 hover:ring-secondary/50"
            onClick={() => router.push('/reports')}
            title="عرض تقارير المبيعات اليومية"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">مبيعات اليوم</CardTitle>
              <ShoppingBag className="h-3.5 w-3.5 text-secondary" />
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0.5">
              <div className="text-xl font-bold font-headline text-foreground">١٬٢٣٤+</div>
              <p className="text-xs text-green-500 pt-0.5 flex items-center">
                <TrendingUp className="h-2.5 w-2.5 mr-1" /> ١٩٪+
              </p>
            </CardContent>
          </Card>
          <Card 
            className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-destructive/5 border-l-4 border-destructive cursor-pointer hover:ring-2 hover:ring-destructive/50"
            onClick={() => router.push('/products')}
            title="الانتقال إلى إدارة المنتجات لمتابعة المخزون"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
              <CardTitle className="text-xs font-medium text-destructive/90">مخزون منخفض</CardTitle>
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0.5">
              <div className="text-xl font-bold font-headline text-destructive">١٢</div>
              <p className="text-xs text-destructive/70 pt-0.5">منتجات تحتاج للمتابعة</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <Card className="shadow-md col-span-1 lg:col-span-1">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="font-headline text-lg text-foreground flex items-center"><BarChart2 className="ml-2 text-primary h-5 w-5"/>أداء المبيعات والأرباح</CardTitle>
              <CardDescription className="text-xs">نظرة شهرية على اتجاهات المبيعات والأرباح.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] p-0 pr-4">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <RechartsBarChart data={salesData} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} fontSize={10} />
                  <YAxis dataKey="month" type="category" axisLine={false} tickLine={false} width={50} fontSize={10} />
                  <Tooltip content={<ChartTooltipContent />} cursor={{fill: 'hsl(var(--muted))'}}/>
                  <Legend content={<ChartLegendContent />} />
                  <Bar dataKey="sales" fill="var(--color-sales)" radius={[0, 4, 4, 0]} name={chartConfig.sales.label} />
                  <Bar dataKey="profit" fill="var(--color-profit)" radius={[0, 4, 4, 0]} name={chartConfig.profit.label} />
                </RechartsBarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-md col-span-1 lg:col-span-1">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="font-headline text-lg text-foreground flex items-center"><TrendingUp className="ml-2 text-accent h-5 w-5"/>نشاط العملاء</CardTitle>
              <CardDescription className="text-xs">تتبع اكتساب العملاء ومعدلات النشاط.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] p-0 pr-4">
             <ChartContainer config={chartConfig} className="w-full h-full">
                <RechartsLineChart data={customerActivityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                  <XAxis type="number" axisLine={false} tickLine={false} fontSize={10}/>
                  <YAxis dataKey="date" type="category" tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG', { month: 'short' })} axisLine={false} tickLine={false} width={50} fontSize={10}/>
                  <Tooltip content={<ChartTooltipContent />} cursor={{stroke: 'hsl(var(--muted))', strokeWidth: 2}}/>
                  <Legend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="new" stroke="var(--color-newCustomers)" strokeWidth={2} dot={{r: 3, fill: 'var(--color-newCustomers)'}} activeDot={{r: 5}} name={chartConfig.newCustomers.label} />
                  <Line type="monotone" dataKey="active" stroke="var(--color-activeCustomers)" strokeWidth={2} dot={{r: 3, fill: 'var(--color-activeCustomers)'}} activeDot={{r: 5}} name={chartConfig.activeCustomers.label}/>
                </RechartsLineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
           <Card className="shadow-md">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="font-headline text-lg text-foreground flex items-center"><PieChart className="ml-2 text-primary h-5 w-5"/>أفضل المنتجات مبيعًا</CardTitle>
              <CardDescription className="text-xs">المنتجات الأكثر طلبًا هذا الشهر.</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] p-0">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    <RechartsBarChart data={topProductsData} layout="horizontal" margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={10}/>
                        <YAxis orientation="right" axisLine={false} tickLine={false} tickMargin={8} fontSize={10}/>
                        <Tooltip content={<ChartTooltipContent />} cursor={{fill: 'hsl(var(--muted))'}}/>
                        <Bar dataKey="value" fill="var(--color-topProduct)" radius={[4, 4, 0, 0]} name="المبيعات (ل.س)" />
                    </RechartsBarChart>
                </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="font-headline text-base text-foreground flex items-center"><FileSpreadsheet className="ml-2 text-accent h-4 w-4"/>ملخصات سريعة</CardTitle>
              <CardDescription className="text-xs">بيانات مالية ومخزنية هامة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 px-3 pt-1.5 pb-2">
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded-md text-xs">
                <span className="text-muted-foreground">متوسط قيمة الطلب:</span>
                <span className="font-semibold text-foreground">١٢٥٫٥٠ ل.س</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded-md text-xs">
                <span className="text-muted-foreground">إجمالي عدد المنتجات:</span>
                <span className="font-semibold text-foreground">٣٥٠ منتج</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded-md text-xs">
                <span className="text-muted-foreground">معدل دوران المخزون:</span>
                <span className="font-semibold text-foreground">٤.٢ مرة/شهر</span>
              </div>
            </CardContent>
          </Card>
        </div>
        

        {/* Market Indicators - Luxury Stock Exchange Style */}
        <Card className="shadow-md overflow-hidden border-2 border-primary/20">
          <CardHeader className="bg-primary/5 py-2 px-4">
            <CardTitle className="font-headline text-md text-primary flex items-center"><TrendingUp className="ml-2 h-5 w-5"/>مؤشرات السوق (تجريبي)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-card-foreground/5 text-foreground h-12 flex items-center">
              <div className="whitespace-nowrap animate-marquee">
                <span className="mx-4 text-xs">منتج أ: <span className="font-code text-green-500">١٠٫٥٠ ل.س <TrendingUp className="inline h-3 w-3" /></span></span>
                <span className="mx-4 text-xs">منتج ب: <span className="font-code text-red-500">٢٢٫٣٠ ل.س <TrendingUp className="inline h-3 w-3 transform rotate-180" /></span></span>
                <span className="mx-4 text-xs">منتج ج: <span className="font-code text-green-500">٥٫٧٥ ل.س <TrendingUp className="inline h-3 w-3" /></span></span>
                <span className="mx-4 text-xs">منتج د: <span className="font-code text-green-500">١٠٢٫٠٠ ل.س <TrendingUp className="inline h-3 w-3" /></span></span>
                <span className="mx-4 text-xs">منتج هـ: <span className="font-code text-red-500">٣٣٫١٥ ل.س <TrendingUp className="inline h-3 w-3 transform rotate-180" /></span></span>
                {/* Duplicate for seamless loop */}
                <span className="mx-4 text-xs">منتج أ: <span className="font-code text-green-500">١٠٫٥٠ ل.س <TrendingUp className="inline h-3 w-3" /></span></span>
                <span className="mx-4 text-xs">منتج ب: <span className="font-code text-red-500">٢٢٫٣٠ ل.س <TrendingUp className="inline h-3 w-3 transform rotate-180" /></span></span>
                <span className="mx-4 text-xs">منتج ج: <span className="font-code text-green-500">٥٫٧٥ ل.س <TrendingUp className="inline h-3 w-3" /></span></span>
                <span className="mx-4 text-xs">منتج د: <span className="font-code text-green-500">١٠٢٫٠٠ ل.س <TrendingUp className="inline h-3 w-3" /></span></span>
                <span className="mx-4 text-xs">منتج هـ: <span className="font-code text-red-500">٣٣٫١٥ ل.س <TrendingUp className="inline h-3 w-3 transform rotate-180" /></span></span>
              </div>
            </div>
          </CardContent>
        </Card>
        <style jsx global>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); } 
          }
          .animate-marquee {
            animation: marquee 30s linear infinite;
            display: inline-block; 
          }
        `}</style>

      </div>
    </AppLayout>
  );
};

export default DashboardPage;

    
