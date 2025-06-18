// src/app/dashboard/page.tsx
"use client";

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Users, DollarSign, ShoppingBag, AlertTriangle } from 'lucide-react';
import { BarChart, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import React from 'react';

const salesData = [
  { month: 'Jan', sales: 4000, profit: 2400 },
  { month: 'Feb', sales: 3000, profit: 1398 },
  { month: 'Mar', sales: 2000, profit: 9800 },
  { month: 'Apr', sales: 2780, profit: 3908 },
  { month: 'May', sales: 1890, profit: 4800 },
  { month: 'Jun', sales: 2390, profit: 3800 },
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
    label: "Sales",
    color: "hsl(var(--chart-1))",
  },
  profit: {
    label: "Profit",
    color: "hsl(var(--chart-2))",
  },
  newCustomers: {
    label: "New Customers",
    color: "hsl(var(--chart-1))",
  },
  activeCustomers: {
    label: "Active Customers",
    color: "hsl(var(--chart-2))",
  },
} satisfies React.ComponentProps<typeof ChartContainer>["config"];


const DashboardPage = () => {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-headline font-semibold text-foreground">Dashboard Overview</h1>
          <Button variant="outline" className="mt-4 sm:mt-0">
            <Download className="mr-2 h-4 w-4" /> Export Data
          </Button>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline text-foreground">$45,231.89</div>
              <p className="text-xs text-muted-foreground pt-1">+20.1% from last month</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline text-foreground">+2,350</div>
              <p className="text-xs text-muted-foreground pt-1">+180.1% from last month</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sales Today</CardTitle>
              <ShoppingBag className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline text-foreground">+1,234</div>
              <p className="text-xs text-muted-foreground pt-1">+19% from yesterday</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-destructive/10 border-destructive/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Low Stock Items</CardTitle>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline text-destructive">12</div>
              <p className="text-xs text-destructive/80 pt-1">Items needing attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card className="shadow-lg col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground">Sales & Profit Performance</CardTitle>
              <CardDescription>Monthly sales and profit trends.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] p-0">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <BarChart data={salesData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
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
              <CardTitle className="font-headline text-xl text-foreground">Customer Activity</CardTitle>
              <CardDescription>New vs. Active customer trends.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] p-0">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <LineChart data={customerActivityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })} tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="new" stroke="var(--color-newCustomers)" strokeWidth={2} dot={true} />
                  <Line type="monotone" dataKey="active" stroke="var(--color-activeCustomers)" strokeWidth={2} dot={true} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Mock Ticker - For "Stock Exchange" Feel */}
        <Card className="shadow-lg overflow-hidden">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-foreground">Market Movers (Mock)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-card-foreground/5 text-foreground h-12 flex items-center">
              <div className="whitespace-nowrap animate-marquee">
                <span className="mx-4">ITEM A: $10.50 <TrendingUp className="inline h-4 w-4 text-green-500" /></span>
                <span className="mx-4">ITEM B: $22.30 <TrendingUp className="inline h-4 w-4 text-red-500 transform rotate-180" /></span>
                <span className="mx-4">ITEM C: $5.75 <TrendingUp className="inline h-4 w-4 text-green-500" /></span>
                <span className="mx-4">ITEM D: $102.00 <TrendingUp className="inline h-4 w-4 text-green-500" /></span>
                <span className="mx-4">ITEM E: $33.15 <TrendingUp className="inline h-4 w-4 text-red-500 transform rotate-180" /></span>
                 {/* Duplicate for seamless scroll */}
                <span className="mx-4">ITEM A: $10.50 <TrendingUp className="inline h-4 w-4 text-green-500" /></span>
                <span className="mx-4">ITEM B: $22.30 <TrendingUp className="inline h-4 w-4 text-red-500 transform rotate-180" /></span>
                <span className="mx-4">ITEM C: $5.75 <TrendingUp className="inline h-4 w-4 text-green-500" /></span>
                <span className="mx-4">ITEM D: $102.00 <TrendingUp className="inline h-4 w-4 text-green-500" /></span>
                <span className="mx-4">ITEM E: $33.15 <TrendingUp className="inline h-4 w-4 text-red-500 transform rotate-180" /></span>
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
            display: inline-block; /* Necessary for the animation to work on the parent */
          }
        `}</style>

      </div>
    </AppLayout>
  );
};

export default DashboardPage;
