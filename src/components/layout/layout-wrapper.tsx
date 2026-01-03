'use client'

import { usePathname } from 'next/navigation'
import { AppSidebar } from '@/components/layout/app-sidebar'

interface LayoutWrapperProps {
    children: React.ReactNode
}

// Routes that should NOT show the sidebar
const noSidebarRoutes = ['/login', '/admin']

export function LayoutWrapper({ children }: LayoutWrapperProps) {
    const pathname = usePathname()

    // Check if current route should hide sidebar
    const hideSidebar = noSidebarRoutes.some(route => pathname?.startsWith(route))

    if (hideSidebar) {
        // Render without sidebar
        return (
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        )
    }

    // Render with sidebar
    return (
        <div className="flex h-screen overflow-hidden">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
