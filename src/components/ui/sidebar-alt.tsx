// src/components/ui/sidebar-alt.tsx
"use client"

import * as React from "react"
import Link, { LinkProps } from "next/link"
import { cn } from "@/lib/utils"
import { Button, ButtonProps } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

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
  const [isOpen, setIsOpen] = React.useState(true) // Default to open on desktop
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // Tailwind's md breakpoint
      if (window.innerWidth < 768) setIsOpen(false); // Close sidebar by default on mobile
      else setIsOpen(true); // Open sidebar by default on desktop
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

  if (isMobile) return null // Handled by SidebarMobileDrawer

  return (
    <aside
      ref={ref}
      className={cn(
        "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out",
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
    className={cn("p-4 border-t border-sidebar-border mt-auto", className)}
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
      <SheetContent side="left" className="w-64 bg-sidebar text-sidebar-foreground p-0 border-r border-sidebar-border flex flex-col">
         <SidebarHeader>
            <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setIsSheetOpen(false)}>
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-sidebar-primary"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              <h1 className="text-xl font-headline font-semibold text-sidebar-primary">Al-Waseet</h1>
            </Link>
          </SidebarHeader>
        <SidebarMain>
            <SidebarNav>
                {children}
            </SidebarNav>
        </SidebarMain>
        <SidebarFooter>
            {/* Mobile footer content if any */}
        </SidebarFooter>
      </SheetContent>
    </Sheet>
  )
}
