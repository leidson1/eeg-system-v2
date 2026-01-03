'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
    Shield,
    Users,
    UserPlus,
    Trash2,
    Download,
    Upload,
    Loader2,
    Key,
    ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface UserData {
    id: string
    email: string
    created_at: string
    last_sign_in_at: string | null
}

export default function AdminPage() {
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState<UserData[]>([])
    const [newEmail, setNewEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [resetEmail, setResetEmail] = useState('')
    const supabase = createClient()

    useEffect(() => {
        // Note: Listing users requires admin API - this is a placeholder
        // In production, use Supabase Edge Functions or server-side API
    }, [])

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newEmail || !newPassword) {
            toast.error('Preencha e-mail e senha')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.signUp({
                email: newEmail,
                password: newPassword,
                options: {
                    emailRedirectTo: undefined, // No email confirmation needed
                }
            })

            if (error) {
                toast.error(error.message)
            } else {
                toast.success('Usuário criado com sucesso!')
                setNewEmail('')
                setNewPassword('')
            }
        } catch {
            toast.error('Erro ao criar usuário')
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resetEmail) {
            toast.error('Digite o e-mail do usuário')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: `${window.location.origin}/admin/reset-password`,
            })

            if (error) {
                toast.error(error.message)
            } else {
                toast.success('E-mail de recuperação enviado!')
                setResetEmail('')
            }
        } catch {
            toast.error('Erro ao enviar e-mail de recuperação')
        } finally {
            setLoading(false)
        }
    }

    const handleExportData = async () => {
        setLoading(true)
        try {
            // Export patients
            const { data: patients } = await supabase.from('patients').select('*')
            // Export orders
            const { data: orders } = await supabase.from('orders').select('*')
            // Export team
            const { data: team } = await supabase.from('team_members').select('*')
            // Export capacity
            const { data: capacity } = await supabase.from('capacity_config').select('*')

            const backup = {
                exportedAt: new Date().toISOString(),
                patients: patients || [],
                orders: orders || [],
                team_members: team || [],
                capacity_config: capacity || [],
            }

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `backup-eeg-${new Date().toISOString().split('T')[0]}.json`
            a.click()
            URL.revokeObjectURL(url)

            toast.success('Backup exportado com sucesso!')
        } catch {
            toast.error('Erro ao exportar backup')
        } finally {
            setLoading(false)
        }
    }

    const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        try {
            const text = await file.text()
            const backup = JSON.parse(text)

            if (!backup.patients || !backup.orders) {
                throw new Error('Arquivo de backup inválido')
            }

            // Import patients
            if (backup.patients.length > 0) {
                const { error: patientsError } = await supabase
                    .from('patients')
                    .upsert(backup.patients, { onConflict: 'id' })
                if (patientsError) throw patientsError
            }

            // Import orders
            if (backup.orders.length > 0) {
                const { error: ordersError } = await supabase
                    .from('orders')
                    .upsert(backup.orders, { onConflict: 'id' })
                if (ordersError) throw ordersError
            }

            // Import team members
            if (backup.team_members?.length > 0) {
                const { error: teamError } = await supabase
                    .from('team_members')
                    .upsert(backup.team_members, { onConflict: 'id' })
                if (teamError) throw teamError
            }

            // Import capacity config
            if (backup.capacity_config?.length > 0) {
                const { error: capacityError } = await supabase
                    .from('capacity_config')
                    .upsert(backup.capacity_config, { onConflict: 'id' })
                if (capacityError) throw capacityError
            }

            toast.success(`Backup restaurado! ${backup.patients.length} pacientes, ${backup.orders.length} pedidos.`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao importar backup')
        } finally {
            setLoading(false)
            e.target.value = '' // Reset input
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="text-white hover:bg-slate-800">
                            <Link href="/">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Shield className="h-6 w-6 text-yellow-500" />
                                Painel Administrativo
                            </h1>
                            <p className="text-slate-400 text-sm">Acesso restrito</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="users" className="space-y-4">
                    <TabsList className="bg-slate-800">
                        <TabsTrigger value="users" className="data-[state=active]:bg-slate-700">
                            <Users className="h-4 w-4 mr-2" />
                            Usuários
                        </TabsTrigger>
                        <TabsTrigger value="backup" className="data-[state=active]:bg-slate-700">
                            <Download className="h-4 w-4 mr-2" />
                            Backup
                        </TabsTrigger>
                        <TabsTrigger value="migrate" className="data-[state=active]:bg-slate-700">
                            <Upload className="h-4 w-4 mr-2" />
                            Migrar
                        </TabsTrigger>
                    </TabsList>

                    {/* Users Tab */}
                    <TabsContent value="users" className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Create User */}
                            <Card className="bg-slate-800 border-slate-700">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <UserPlus className="h-5 w-5 text-green-500" />
                                        Criar Novo Usuário
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">
                                        Adicione um novo usuário ao sistema
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreateUser} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">E-mail</Label>
                                            <Input
                                                type="email"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                placeholder="usuario@email.com"
                                                className="bg-slate-700 border-slate-600 text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Senha</Label>
                                            <Input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Mínimo 6 caracteres"
                                                minLength={6}
                                                className="bg-slate-700 border-slate-600 text-white"
                                            />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={loading}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Criar Usuário
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Reset Password */}
                            <Card className="bg-slate-800 border-slate-700">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Key className="h-5 w-5 text-yellow-500" />
                                        Recuperar Senha
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">
                                        Envie e-mail de recuperação de senha
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">E-mail do Usuário</Label>
                                            <Input
                                                type="email"
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                placeholder="usuario@email.com"
                                                className="bg-slate-700 border-slate-600 text-white"
                                            />
                                        </div>
                                        <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Enviar E-mail de Recuperação
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Backup Tab */}
                    <TabsContent value="backup" className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Export */}
                            <Card className="bg-slate-800 border-slate-700">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Download className="h-5 w-5 text-blue-500" />
                                        Exportar Backup
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">
                                        Baixe todos os dados do sistema em JSON
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-400 mb-4">
                                        O backup inclui: pacientes, pedidos, equipe e configurações de capacidade.
                                    </p>
                                    <Button onClick={handleExportData} className="w-full" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Download className="mr-2 h-4 w-4" />
                                        Baixar Backup
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Import */}
                            <Card className="bg-slate-800 border-slate-700">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Upload className="h-5 w-5 text-orange-500" />
                                        Restaurar Backup
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">
                                        Importe dados de um arquivo de backup
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-400 mb-4">
                                        ⚠️ Dados existentes serão atualizados. Novos registros serão adicionados.
                                    </p>
                                    <label className="w-full">
                                        <Button variant="secondary" className="w-full cursor-pointer" disabled={loading} asChild>
                                            <span>
                                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                <Upload className="mr-2 h-4 w-4" />
                                                Selecionar Arquivo
                                            </span>
                                        </Button>
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={handleImportData}
                                            className="hidden"
                                        />
                                    </label>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Migrate Tab */}
                    <TabsContent value="migrate" className="space-y-4">
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Upload className="h-5 w-5 text-purple-500" />
                                    Migrar Sistema Antigo
                                </CardTitle>
                                <CardDescription className="text-slate-400">
                                    Importe dados do backup JSON do sistema antigo (localStorage)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-slate-400">
                                    Use esta ferramenta para importar pacientes e pedidos do sistema antigo para o novo banco de dados.
                                </p>
                                <Button asChild className="w-full">
                                    <Link href="/admin/migrate">
                                        <Upload className="mr-2 h-4 w-4" />
                                        Abrir Ferramenta de Migração
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Footer */}
                <p className="text-center text-xs text-slate-500">
                    Página administrativa oculta - URL: /admin
                </p>
            </div>
        </div>
    )
}
