'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    FileText,
    CalendarCheck,
    Archive,
    BarChart3,
    Settings,
    Printer,
    ChevronLeft,
    ChevronRight,
    Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const menuItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/pacientes', label: 'Pacientes', icon: Users },
    { href: '/pedidos', label: 'Pedidos', icon: FileText },
    { href: '/agendamentos', label: 'Agendamentos', icon: CalendarCheck },
    { href: '/mapa-impressao', label: 'Mapa Impressão', icon: Printer },
    { href: '/arquivados', label: 'Arquivados', icon: Archive },
    { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
    { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function AppSidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside
            className={cn(
                "h-screen bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 print:hidden",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Header */}
            <div className={cn(
                "flex items-center h-16 px-4 border-b border-slate-800",
                collapsed ? "justify-center" : "gap-3"
            )}>
                <Activity className="h-8 w-8 text-blue-400 flex-shrink-0" />
                {!collapsed && (
                    <div className="flex flex-col">
                        <span className="font-semibold text-white text-sm">HGP EEG</span>
                        <span className="text-xs text-slate-400">Pediátrico</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
                <ul className="space-y-1 px-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href))

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                                        "hover:bg-slate-800 hover:text-white hover:translate-x-1",
                                        isActive && "bg-blue-600 text-white shadow-lg shadow-blue-600/20",
                                        collapsed && "justify-center px-2"
                                    )}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <item.icon className="h-5 w-5 flex-shrink-0" />
                                    {!collapsed && (
                                        <span className="text-sm font-medium">{item.label}</span>
                                    )}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* Toggle Button */}
            <div className="p-4 border-t border-slate-800">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        "w-full text-slate-400 hover:text-white hover:bg-slate-800",
                        collapsed && "px-2"
                    )}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            <span>Recolher</span>
                        </>
                    )}
                </Button>
            </div>

            {/* Footer */}
            {!collapsed && (
                <div className="p-4 text-center text-xs text-slate-500 border-t border-slate-800">
                    <p>Desenvolvido com ❤️</p>
                    <p className="mt-1">Outliers.team & EEG HGP</p>
                </div>
            )}
        </aside>
    )
}
