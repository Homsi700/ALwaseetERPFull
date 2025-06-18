// src/components/layout/AppLayout.tsx
"use client";

import React, { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarMain,
  SidebarNav,
  SidebarNavMain,
  SidebarNavLink,
  SidebarFooter,
  SidebarMobileDrawer,
  SidebarToggle,
  SidebarNavHeader,
  SidebarNavHeaderTitle,
} from '@/components/ui/sidebar-alt'; // Using an alternative or custom sidebar structure
import {
  LayoutDashboard, Package, ShoppingCart, Truck, Users, FileText, LogOut, Building, Menu
} from 'lucide-react';
import Image from 'next/image';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/products', icon: Package, label: 'Products' },
  { href: '/pos', icon: ShoppingCart, label: 'Point of Sale' },
  { href: '/purchasing', icon: Truck, label: 'Purchasing' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/reports', icon: FileText, label: 'Financial Reports' },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 border-b bg-card shadow-sm">
          <div className="flex items-center">
             <SidebarMobileDrawer>
                <Menu className="h-6 w-6 text-primary" />
             </SidebarMobileDrawer>
            <Link href="/dashboard" className="flex items-center gap-2 ml-4 md:ml-0">
              <Building className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-headline font-semibold text-primary">Al-Waseet UI</h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">Welcome, {user.name}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="person letter" />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex flex-1">
          <Sidebar className="border-r shadow-md">
            <SidebarHeader className="p-4">
              {/* Optional: Can add a toggle button here if not using global toggle */}
            </SidebarHeader>
            <SidebarMain className="flex-1 overflow-y-auto">
              <SidebarNav>
                <SidebarNavMain>
                  {navItems.map((item) => (
                    <SidebarNavLink 
                      key={item.href} 
                      href={item.href} 
                      active={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard')}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </SidebarNavLink>
                  ))}
                </SidebarNavMain>
              </SidebarNav>
            </SidebarMain>
            <SidebarFooter className="p-4">
              {/* Footer content like app version or quick links */}
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 p-6 bg-background overflow-y-auto">
            <div className="container mx-auto">
             {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
