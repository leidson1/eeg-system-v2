'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Shield,
    Users,
    UserPlus,
    Trash2,
    Download,
    Upload,
    Loader2,
    Key,
    ArrowLeft,
    Database,
    AlertTriangle,
    Lock
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

// Senha padrão do administrador
const ADMIN_PASSWORD = 'hgp2026admin'

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [passwordInput, setPasswordInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [newEmail, setNewEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [resetEmail, setResetEmail] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState('')
    const supabase = createClient()

    // Verificar se já está autenticado (session storage)
    useEffect(() => {
        const isAuth = sessionStorage.getItem('admin_authenticated')
        if (isAuth === 'true') {
            setIsAuthenticated(true)
        }
    }, [])

    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (passwordInput === ADMIN_PASSWORD) {
            setIsAuthenticated(true)
            sessionStorage.setItem('admin_authenticated', 'true')
            toast.success('Acesso liberado!')
        } else {
            toast.error('Senha incorreta')
        }
    }

    const handleLogout = () => {
        setIsAuthenticated(false)
        sessionStorage.removeItem('admin_authenticated')
        setPasswordInput('')
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newEmail || !newPassword) {
            toast.error('Preencha e-mail e senha')
            return
        }

        setLoading(true)
        try {
            const { data, error } = await supabase.auth.signUp({
                email: newEmail,
                password: newPassword,
                options: {
                    emailRedirectTo: 'https://eeghgp.vercel.app',
                    data: {
                        email_confirmed: true, // Auto-confirm if Supabase allows
                    }
                }
            })

            // Check if user needs email confirmation
            if (data?.user && !data.user.email_confirmed_at) {
                toast.info('Usuário criado! Se necessário, confirme o e-mail enviado.')
            }

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
                redirectTo: 'https://eeghgp.vercel.app/admin/reset-password',
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
            const { data: patients } = await supabase.from('patients').select('*')
            const { data: orders } = await supabase.from('orders').select('*')

            const backup = {
                exportedAt: new Date().toISOString(),
                patients: patients || [],
                orders: orders || [],
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

            toast.success(`Backup restaurado! ${backup.patients.length} pacientes, ${backup.orders.length} pedidos.`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao importar backup')
        } finally {
            setLoading(false)
            e.target.value = ''
        }
    }

    const handleClearDatabase = async () => {
        if (deleteConfirm !== 'EXCLUIR TUDO') {
            toast.error('Digite "EXCLUIR TUDO" para confirmar')
            return
        }

        if (!confirm('ATENÇÃO: Esta ação é IRREVERSÍVEL! Todos os dados serão perdidos. Deseja continuar?')) {
            return
        }

        setLoading(true)
        try {
            // Delete orders first (foreign key)
            const { error: ordersError } = await supabase
                .from('orders')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

            if (ordersError) throw ordersError

            // Delete patients
            const { error: patientsError } = await supabase
                .from('patients')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

            if (patientsError) throw patientsError

            toast.success('Banco de dados limpo com sucesso!')
            setDeleteConfirm('')
        } catch (error) {
            toast.error('Erro ao limpar banco: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
        } finally {
            setLoading(false)
        }
    }

    // Tela de Login
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <Card className="w-full max-w-md bg-slate-800 border-slate-700">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
                            <Lock className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-white text-2xl">Área Restrita</CardTitle>
                        <CardDescription className="text-slate-400">
                            Digite a senha de administrador para acessar
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdminLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder="Digite a senha..."
                                    className="bg-slate-700 border-slate-600 text-white"
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                                <Key className="mr-2 h-4 w-4" />
                                Acessar
                            </Button>
                        </form>
                        <div className="mt-6">
                            <Button variant="ghost" asChild className="w-full text-slate-400 hover:text-white">
                                <Link href="/">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Voltar para o Sistema
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Painel Admin
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
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-600 rounded-lg">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Painel Admin</h1>
                                <p className="text-sm text-slate-400">Gerenciamento do Sistema</p>
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="border-slate-600 text-slate-300">
                        Sair
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="users" className="space-y-6">
                    <TabsList className="bg-slate-800 border border-slate-700">
                        <TabsTrigger value="users" className="data-[state=active]:bg-slate-700">
                            <Users className="mr-2 h-4 w-4" />
                            Usuários
                        </TabsTrigger>
                        <TabsTrigger value="backup" className="data-[state=active]:bg-slate-700">
                            <Download className="mr-2 h-4 w-4" />
                            Backup
                        </TabsTrigger>
                        <TabsTrigger value="migrate" className="data-[state=active]:bg-slate-700">
                            <Database className="mr-2 h-4 w-4" />
                            Migrar
                        </TabsTrigger>
                        <TabsTrigger value="danger" className="data-[state=active]:bg-red-900 text-red-400">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Perigo
                        </TabsTrigger>
                    </TabsList>

                    {/* Usuários Tab */}
                    <TabsContent value="users" className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Create User Card */}
                            <Card className="bg-slate-800 border-slate-700">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <UserPlus className="h-5 w-5 text-green-400" />
                                        Criar Usuário
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">
                                        Adicione novos usuários ao sistema
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreateUser} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-slate-300">E-mail</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                placeholder="usuario@exemplo.com"
                                                className="bg-slate-700 border-slate-600 text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="newpass" className="text-slate-300">Senha</Label>
                                            <Input
                                                id="newpass"
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Mínimo 6 caracteres"
                                                className="bg-slate-700 border-slate-600 text-white"
                                            />
                                        </div>
                                        <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Criar Usuário
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Reset Password Card */}
                            <Card className="bg-slate-800 border-slate-700">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Key className="h-5 w-5 text-amber-400" />
                                        Resetar Senha
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">
                                        Enviar e-mail de recuperação de senha
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="reset-email" className="text-slate-300">E-mail do Usuário</Label>
                                            <Input
                                                id="reset-email"
                                                type="email"
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                placeholder="usuario@exemplo.com"
                                                className="bg-slate-700 border-slate-600 text-white"
                                            />
                                        </div>
                                        <Button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700">
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Enviar E-mail
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Backup Tab */}
                    <TabsContent value="backup" className="space-y-6">
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white">Backup e Restauração</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Exporte ou importe dados do sistema
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Button
                                        onClick={handleExportData}
                                        disabled={loading}
                                        className="bg-green-600 hover:bg-green-700 h-auto py-4"
                                    >
                                        {loading ? (
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        ) : (
                                            <Download className="mr-2 h-5 w-5" />
                                        )}
                                        <div className="text-left">
                                            <div className="font-medium">Exportar Backup</div>
                                            <div className="text-xs opacity-80">Baixar JSON com todos os dados</div>
                                        </div>
                                    </Button>

                                    <div>
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={handleImportData}
                                            className="hidden"
                                            id="import-file"
                                        />
                                        <label htmlFor="import-file">
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="w-full h-auto py-4 border-slate-600 cursor-pointer"
                                            >
                                                <span>
                                                    <Upload className="mr-2 h-5 w-5" />
                                                    <div className="text-left">
                                                        <div className="font-medium">Restaurar Backup</div>
                                                        <div className="text-xs opacity-80">Importar JSON de backup</div>
                                                    </div>
                                                </span>
                                            </Button>
                                        </label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Migrate Tab */}
                    <TabsContent value="migrate" className="space-y-6">
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Database className="h-5 w-5 text-blue-400" />
                                    Migração de Dados
                                </CardTitle>
                                <CardDescription className="text-slate-400">
                                    Importar dados do sistema antigo (localStorage)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 bg-slate-700/50 rounded-lg mb-4">
                                    <p className="text-sm text-slate-300">
                                        Use esta ferramenta para importar os dados do backup JSON do sistema antigo.
                                        A migração converte os campos para o novo formato e importa em lotes.
                                    </p>
                                </div>
                                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                                    <Link href="/admin/migrate">
                                        <Database className="mr-2 h-4 w-4" />
                                        Abrir Ferramenta de Migração
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Danger Zone Tab */}
                    <TabsContent value="danger" className="space-y-6">
                        <Card className="bg-red-950/50 border-red-800">
                            <CardHeader>
                                <CardTitle className="text-red-400 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Zona de Perigo
                                </CardTitle>
                                <CardDescription className="text-red-300/70">
                                    Ações destrutivas e irreversíveis
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Clear Database */}
                                <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Trash2 className="h-5 w-5 text-red-400" />
                                        <div>
                                            <p className="font-medium text-red-300">Limpar Banco de Dados</p>
                                            <p className="text-sm text-red-400/70">
                                                Remove TODOS os pacientes e pedidos. Esta ação é IRREVERSÍVEL.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-red-300">
                                            Digite &quot;EXCLUIR TUDO&quot; para confirmar:
                                        </Label>
                                        <Input
                                            value={deleteConfirm}
                                            onChange={(e) => setDeleteConfirm(e.target.value)}
                                            placeholder="EXCLUIR TUDO"
                                            className="bg-red-900/30 border-red-800 text-white"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleClearDatabase}
                                        disabled={loading || deleteConfirm !== 'EXCLUIR TUDO'}
                                        variant="destructive"
                                        className="w-full"
                                    >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Excluir Todos os Dados
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
