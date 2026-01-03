'use client'

import { Bell, User, LogOut, Settings, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AppHeaderProps {
    title?: string
}

export function AppHeader({ title }: AppHeaderProps) {
    const router = useRouter()
    const supabase = createClient()
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [userInitials, setUserInitials] = useState('U')

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.email) {
                setUserEmail(user.email)
                // Get initials from email
                const name = user.email.split('@')[0]
                const initials = name.substring(0, 2).toUpperCase()
                setUserInitials(initials)
            }
        }
        getUser()
    }, [supabase])

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            toast.success('Logout realizado com sucesso')
            router.push('/login')
            router.refresh()
        } catch {
            toast.error('Erro ao fazer logout')
        }
    }

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 print:hidden">
            {/* Page Title */}
            <div>
                {title && (
                    <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {/* Notifications - placeholder */}
                <Button variant="ghost" size="icon" className="relative" onClick={() => toast.info('Notificações em desenvolvimento')}>
                    <Bell className="h-5 w-5 text-slate-600" />
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 px-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-slate-700 hidden sm:inline max-w-[150px] truncate">
                                {userEmail || 'Usuário'}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                            <div className="flex flex-col">
                                <span>Minha Conta</span>
                                {userEmail && (
                                    <span className="text-xs font-normal text-slate-500 truncate">{userEmail}</span>
                                )}
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/configuracoes" className="cursor-pointer">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Configurações</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/admin" className="cursor-pointer">
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Administração</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sair</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
