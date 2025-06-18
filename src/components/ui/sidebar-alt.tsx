
// src/components/ui/sidebar-alt.tsx
"use client"

import * as React from "react"
import Link, { LinkProps } from "next/link"
import { cn } from "@/lib/utils"
import { Button, ButtonProps } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Building } from "lucide-react";


interface SidebarContextProps {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  isMobile: boolean
}

const SidebarContext = React.createContext<SidebarContextProps | undefined>(undefined)

export function useSidebarAlt() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebarAlt must be used within a SidebarProvider")
  }
  return context
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(true) 
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      const mobileCheck = window.innerWidth < 768; // Tailwind's md breakpoint
      setIsMobile(mobileCheck);
      if (mobileCheck) setIsOpen(false); 
      else setIsOpen(true); 
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])
  
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isMobile }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isOpen, isMobile } = useSidebarAlt()

  if (isMobile) return null

  return (
    <aside
      ref={ref}
      className={cn(
        "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-l border-sidebar-border transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16",
        className
      )}
      {...props}
    />
  )
})
Sidebar.displayName = "Sidebar"


export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isOpen } = useSidebarAlt()
  return (
  <div
    ref={ref}
    className={cn(
        "p-4 border-b border-sidebar-border flex items-center", 
        isOpen ? "justify-between" : "justify-center",
        className
    )}
    {...props}
  />
  )
})
SidebarHeader.displayName = "SidebarHeader"


export const SidebarMain = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-y-auto py-4", className)}
    {...props}
  />
))
SidebarMain.displayName = "SidebarMain"

export const SidebarNav = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    className={cn("flex flex-col px-2 gap-1", className)}
    {...props}
  />
))
SidebarNav.displayName = "SidebarNav"

export const SidebarNavHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isOpen } = useSidebarAlt()
  return (
    <div
      ref={ref}
      className={cn(
        "text-xs font-semibold uppercase text-sidebar-foreground/60 tracking-wider",
        isOpen ? "px-2 py-3" : "py-3 text-center",
        className
      )}
      {...props}
    />
  )
})
SidebarNavHeader.displayName = "SidebarNavHeader"

export const SidebarNavHeaderTitle = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  const { isOpen } = useSidebarAlt()
  if(!isOpen) return null;
  return (
    <span
      ref={ref}
      className={cn(className)}
      {...props}
    />
  )
})
SidebarNavHeaderTitle.displayName = "SidebarNavHeaderTitle"

export const SidebarNavMain = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props} />
))
SidebarNavMain.displayName = "SidebarNavMain"

interface SidebarNavLinkProps extends LinkProps {
  children: React.ReactNode
  className?: string
  active?: boolean
}

export function SidebarNavLink({ href, active, children, className, ...props }: SidebarNavLinkProps) {
  const { isOpen } = useSidebarAlt()
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150",
        "focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-1 focus:ring-offset-sidebar",
        isOpen ? "px-3 py-2 text-sm" : "justify-center p-3",
        active && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  )
}

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-4 border-b border-sidebar-border mt-auto", className)} // Changed border-t to border-b for RTL consistency if footer is at bottom
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"


export const SidebarToggle = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, ...props }, ref) => {
  const { isOpen, setIsOpen, isMobile } = useSidebarAlt()
  if(isMobile) return null;
  
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", isOpen ? "" : "hidden", className)}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    />
  )
})
SidebarToggle.displayName = "SidebarToggle"


export function SidebarMobileDrawer({ children, trigger }: { children: React.ReactNode, trigger: React.ReactNode }) {
  const { isMobile, isOpen : isSheetOpen, setIsOpen: setIsSheetOpen } = useSidebarAlt()

  if (!isMobile) return null

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild className="md:hidden">
        {trigger}
      </SheetTrigger>
      <SheetContent side="right" className="w-64 bg-sidebar text-sidebar-foreground p-0 border-l border-sidebar-border flex flex-col">
         <SidebarHeader>
            <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setIsSheetOpen(false)}>
               <Building className="h-7 w-7 text-sidebar-primary" />
              <h1 className="text-xl font-headline font-semibold text-sidebar-primary">الوسيط</h1>
            </Link>
          </SidebarHeader>
        <SidebarMain>
            <SidebarNav>
                {children}
            </SidebarNav>
        </SidebarMain>
        <SidebarFooter>
        </SidebarFooter>
      </SheetContent>
    </Sheet>
  )
}
