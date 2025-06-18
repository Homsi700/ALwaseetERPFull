
// src/app/dashboard/page.tsx
"use client";

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Users, DollarSign, ShoppingBag, AlertTriangle } from 'lucide-react';
import { BarChart, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from 'recharts';
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
} satisfies React.ComponentProps<typeof ChartContainer>["config"];


const DashboardPage = () => {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-headline font-semibold text-foreground">نظرة عامة على لوحة التحكم</h1>
          <Button variant="outline" className="mt-4 sm:mt-0">
            <Download className="ml-2 h-4 w-4" /> تصدير البيانات
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline text-foreground">٤٥٬٢٣١٫٨٩ ر.س</div>
              <p className="text-xs text-muted-foreground pt-1">٢٠٫١٪+ عن الشهر الماضي</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">العملاء النشطون</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline text-foreground">٢٬٣٥٠+</div>
              <p className="text-xs text-muted-foreground pt-1">١٨٠٫١٪+ عن الشهر الماضي</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">مبيعات اليوم</CardTitle>
              <ShoppingBag className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline text-foreground">١٬٢٣٤+</div>
              <p className="text-xs text-muted-foreground pt-1">١٩٪+ عن الأمس</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-destructive/10 border-destructive/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive">منتجات مخزونها منخفض</CardTitle>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline text-destructive">١٢</div>
              <p className="text-xs text-destructive/80 pt-1">منتجات تحتاج إلى متابعة</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card className="shadow-lg col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground">أداء المبيعات والأرباح</CardTitle>
              <CardDescription>اتجاهات المبيعات والأرباح الشهرية.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] p-0">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <BarChart data={salesData} margin={{ top: 5, right: 0, left: 20, bottom: 5 }} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} reversed={false} orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="var(--color-profit)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-lg col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground">نشاط العملاء</CardTitle>
              <CardDescription>اتجاهات العملاء الجدد مقابل العملاء النشطين.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] p-0">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <LineChart data={customerActivityData} margin={{ top: 5, right: 0, left: 20, bottom: 5 }} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG', { month: 'short' })} tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="new" stroke="var(--color-newCustomers)" strokeWidth={2} dot={true} />
                  <Line type="monotone" dataKey="active" stroke="var(--color-activeCustomers)" strokeWidth={2} dot={true} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg overflow-hidden">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-foreground">مؤشرات السوق (تجريبي)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-card-foreground/5 text-foreground h-12 flex items-center">
              <div className="whitespace-nowrap animate-marquee">
                <span className="mx-4">منتج أ: ١٠٫٥٠ ر.س <TrendingUp className="inline h-4 w-4 text-green-500" /></span>
                <span className="mx-4">منتج ب: ٢٢٫٣٠ ر.س <TrendingUp className="inline h-4 w-4 text-red-500 transform rotate-180" /></span>
                <span className="mx-4">منتج ج: ٥٫٧٥ ر.س <TrendingUp className="inline h-4 w-4 text-green-500" /></span>
                <span className="mx-4">منتج د: ١٠٢٫٠٠ ر.س <TrendingUp className="inline h-4 w-4 text-green-500" /></span>
                <span className="mx-4">منتج هـ: ٣٣٫١٥ ر.س <TrendingUp className="inline h-4 w-4 text-red-500 transform rotate-180" /></span>
                <span className="mx-4">منتج أ: ١٠٫٥٠ ر.س <TrendingUp className="inline h-4 w-4 text-green-500" /></span>
                <span className="mx-4">منتج ب: ٢٢٫٣٠ ر.س <TrendingUp className="inline h-4 w-4 text-red-500 transform rotate-180" /></span>
                <span className="mx-4">منتج ج: ٥٫٧٥ ر.س <TrendingUp className="inline h-4 w-4 text-green-500" /></span>
                <span className="mx-4">منتج د: ١٠٢٫٠٠ ر.س <TrendingUp className="inline h-4 w-4 text-green-500" /></span>
                <span className="mx-4">منتج هـ: ٣٣٫١٥ ر.س <TrendingUp className="inline h-4 w-4 text-red-500 transform rotate-180" /></span>
              </div>
            </div>
          </CardContent>
        </Card>
        <style jsx global>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(50%); }
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
