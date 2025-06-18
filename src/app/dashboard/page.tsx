
// src/app/dashboard/page.tsx
"use client";

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Users, DollarSign, ShoppingBag, AlertTriangle, PieChart, BarChart2, FileSpreadsheet } from 'lucide-react';
import { BarChart, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from 'recharts'; // Removed ResponsiveContainer as ChartContainer handles it
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import React from 'react';

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
    label: "المبيعات",
    color: "hsl(var(--chart-1))",
  },
  profit: {
    label: "الأرباح",
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
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-headline font-semibold text-foreground">نظرة عامة على لوحة التحكم</h1>
          <Button variant="outline" className="mt-4 sm:mt-0 border-primary text-primary hover:bg-primary/10">
            <Download className="ml-2 h-4 w-4" /> تصدير البيانات
          </Button>
        </div>

        {/* Key Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline text-foreground">٤٥٬٢٣١٫٨٩ ر.س</div>
              <p className="text-xs text-green-500 pt-1 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" /> ٢٠٫١٪+ عن الشهر الماضي
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">العملاء النشطون</CardTitle>
              <Users className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline text-foreground">٢٬٣٥٠+</div>
              <p className="text-xs text-green-500 pt-1 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" /> ١٨٠٫١٪+ عن الشهر الماضي
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-secondary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">مبيعات اليوم</CardTitle>
              <ShoppingBag className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline text-foreground">١٬٢٣٤+</div>
              <p className="text-xs text-green-500 pt-1 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" /> ١٩٪+ عن الأمس
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-destructive/5 border-l-4 border-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive/90">مخزون منخفض</CardTitle>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline text-destructive">١٢</div>
              <p className="text-xs text-destructive/70 pt-1">منتجات تحتاج للمتابعة</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card className="shadow-lg col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground flex items-center"><BarChart2 className="ml-2 text-primary"/>أداء المبيعات والأرباح</CardTitle>
              <CardDescription>نظرة شهرية على اتجاهات المبيعات والأرباح.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] p-0 pr-4">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <BarChart data={salesData} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis dataKey="month" type="category" axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<ChartTooltipContent />} cursor={{fill: 'hsl(var(--muted))'}}/>
                  <Legend content={<ChartLegendContent />} />
                  <Bar dataKey="sales" fill="var(--color-sales)" radius={[0, 4, 4, 0]} name={chartConfig.sales.label} />
                  <Bar dataKey="profit" fill="var(--color-profit)" radius={[0, 4, 4, 0]} name={chartConfig.profit.label} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-lg col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground flex items-center"><TrendingUp className="ml-2 text-accent"/>نشاط العملاء</CardTitle>
              <CardDescription>تتبع اكتساب العملاء ومعدلات النشاط.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] p-0 pr-4">
             <ChartContainer config={chartConfig} className="w-full h-full">
                <LineChart data={customerActivityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis dataKey="date" type="category" tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG', { month: 'short' })} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<ChartTooltipContent />} cursor={{stroke: 'hsl(var(--muted))', strokeWidth: 2}}/>
                  <Legend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="new" stroke="var(--color-newCustomers)" strokeWidth={2} dot={{r: 4, fill: 'var(--color-newCustomers)'}} activeDot={{r: 6}} name={chartConfig.newCustomers.label} />
                  <Line type="monotone" dataKey="active" stroke="var(--color-activeCustomers)" strokeWidth={2} dot={{r: 4, fill: 'var(--color-activeCustomers)'}} activeDot={{r: 6}} name={chartConfig.activeCustomers.label}/>
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground flex items-center"><PieChart className="ml-2 text-primary"/>أفضل المنتجات مبيعًا</CardTitle>
              <CardDescription>المنتجات الأكثر طلبًا هذا الشهر.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] p-0">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    <BarChart data={topProductsData} layout="horizontal" margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis orientation="right" axisLine={false} tickLine={false} tickMargin={8} />
                        <Tooltip content={<ChartTooltipContent />} cursor={{fill: 'hsl(var(--muted))'}}/>
                        <Bar dataKey="value" fill="var(--color-topProduct)" radius={[4, 4, 0, 0]} name="المبيعات" />
                    </BarChart>
                </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground flex items-center"><FileSpreadsheet className="ml-2 text-accent"/>ملخصات سريعة</CardTitle>
              <CardDescription>بيانات مالية ومخزنية هامة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <span className="text-muted-foreground">متوسط قيمة الطلب:</span>
                <span className="font-semibold text-foreground">١٢٥.٥٠ ر.س</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <span className="text-muted-foreground">إجمالي عدد المنتجات:</span>
                <span className="font-semibold text-foreground">٣٥٠ منتج</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                <span className="text-muted-foreground">معدل دوران المخزون:</span>
                <span className="font-semibold text-foreground">٤.٢ مرة/شهر</span>
              </div>
            </CardContent>
          </Card>
        </div>
        

        {/* Market Indicators - Luxury Stock Exchange Style */}
        <Card className="shadow-lg overflow-hidden border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="font-headline text-lg text-primary flex items-center"><TrendingUp className="ml-2"/>مؤشرات السوق (تجريبي)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-card-foreground/5 text-foreground h-14 flex items-center">
              <div className="whitespace-nowrap animate-marquee">
                <span className="mx-6 text-sm">منتج أ: <span className="font-code text-green-500">١٠٫٥٠ ر.س <TrendingUp className="inline h-4 w-4" /></span></span>
                <span className="mx-6 text-sm">منتج ب: <span className="font-code text-red-500">٢٢٫٣٠ ر.س <TrendingUp className="inline h-4 w-4 transform rotate-180" /></span></span>
                <span className="mx-6 text-sm">منتج ج: <span className="font-code text-green-500">٥٫٧٥ ر.س <TrendingUp className="inline h-4 w-4" /></span></span>
                <span className="mx-6 text-sm">منتج د: <span className="font-code text-green-500">١٠٢٫٠٠ ر.س <TrendingUp className="inline h-4 w-4" /></span></span>
                <span className="mx-6 text-sm">منتج هـ: <span className="font-code text-red-500">٣٣٫١٥ ر.س <TrendingUp className="inline h-4 w-4 transform rotate-180" /></span></span>
                {/* Duplicate for seamless loop */}
                <span className="mx-6 text-sm">منتج أ: <span className="font-code text-green-500">١٠٫٥٠ ر.س <TrendingUp className="inline h-4 w-4" /></span></span>
                <span className="mx-6 text-sm">منتج ب: <span className="font-code text-red-500">٢٢٫٣٠ ر.س <TrendingUp className="inline h-4 w-4 transform rotate-180" /></span></span>
                <span className="mx-6 text-sm">منتج ج: <span className="font-code text-green-500">٥٫٧٥ ر.س <TrendingUp className="inline h-4 w-4" /></span></span>
                <span className="mx-6 text-sm">منتج د: <span className="font-code text-green-500">١٠٢٫٠٠ ر.س <TrendingUp className="inline h-4 w-4" /></span></span>
                <span className="mx-6 text-sm">منتج هـ: <span className="font-code text-red-500">٣٣٫١٥ ر.س <TrendingUp className="inline h-4 w-4 transform rotate-180" /></span></span>
              </div>
            </div>
          </CardContent>
        </Card>
        <style jsx global>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); } /* Adjusted for RTL, content moves left */
          }
          .animate-marquee {
            animation: marquee 30s linear infinite;
            display: inline-block; /* Ensure it's an inline block for transform to work as expected */
          }
        `}</style>

      </div>
    </AppLayout>
  );
};

export default DashboardPage;

    
