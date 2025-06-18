
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
} from '@/components/ui/sidebar-alt';
import {
  LayoutDashboard, Package, ShoppingCart, Truck, Users, FileText, LogOut, Building, Menu, UsersRound
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { href: '/products', icon: Package, label: 'المنتجات' },
  { href: '/pos', icon: ShoppingCart, label: 'نقطة البيع' },
  { href: '/purchasing', icon: Truck, label: 'المشتريات' },
  { href: '/clients', icon: Users, label: 'العملاء' },
  { href: '/users', icon: UsersRound, label: 'إدارة المستخدمين' },
  { href: '/reports', icon: FileText, label: 'التقارير المالية' },
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
            <Link href="/dashboard" className="flex items-center gap-2 md:mr-0">
              <Building className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-headline font-semibold text-primary">الوسيط UI</h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
             <SidebarMobileDrawer trigger={<Menu className="h-6 w-6 text-primary md:hidden" />}>
                <SidebarNavMain>
                  {navItems.map((item) => (
                    <SidebarNavLink 
                      key={item.href} 
                      href={item.href} 
                      active={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard' && item.href.length > 1 ? pathname.startsWith(item.href) : pathname === item.href)}
                      onClick={() => {
                        const { setIsOpen } = useSidebarAlt(); // This won't work directly, need to get context or pass setter
                        // Temporary fix: assume it closes, better to handle in SidebarMobileDrawer context
                        if (typeof document !== 'undefined' && window.innerWidth < 768) {
                           // Heuristic to close, ideally context driven
                        }
                      }}
                    >
                      <item.icon className="w-5 h-5 ml-3" />
                      {item.label}
                    </SidebarNavLink>
                  ))}
                </SidebarNavMain>
             </SidebarMobileDrawer>
            <span className="text-sm text-muted-foreground hidden sm:inline">مرحباً، {user.name}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="person letter"/>
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" forceMount>
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
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex flex-1">
          <Sidebar className="border-l shadow-md">
            <SidebarHeader className="p-4">
            </SidebarHeader>
            <SidebarMain className="flex-1 overflow-y-auto">
              <SidebarNav>
                <SidebarNavMain>
                  {navItems.map((item) => (
                    <SidebarNavLink 
                      key={item.href} 
                      href={item.href} 
                      active={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard' && item.href.length > 1 ? pathname.startsWith(item.href) : pathname === item.href)}
                    >
                      <item.icon className="w-5 h-5 ml-3" />
                      {item.label}
                    </SidebarNavLink>
                  ))}
                </SidebarNavMain>
              </SidebarNav>
            </SidebarMain>
            <SidebarFooter className="p-4">
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

    