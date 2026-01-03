'use client'

import { AppHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Save, Download, Upload, Users, Calendar, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'

interface TeamMember {
    id: string
    name: string
    role: string
}

interface CapacityConfig {
    id: string
    date: string
    capacity: number
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR')
}

export default function ConfiguracoesPage() {
    const [newDate, setNewDate] = useState('')
    const [newCapacity, setNewCapacity] = useState('4')
    const [capacityList, setCapacityList] = useState<CapacityConfig[]>([])
    const [loadingCapacity, setLoadingCapacity] = useState(true)
    const [savingCapacity, setSavingCapacity] = useState(false)

    // Team state
    const [medicos, setMedicos] = useState<string[]>([])
    const [enfermeiros, setEnfermeiros] = useState<string[]>([])
    const [tecnicos, setTecnicos] = useState<string[]>([])
    const [solicitantes, setSolicitantes] = useState<string[]>([])
    const [newMember, setNewMember] = useState('')

    // Set default date to today
    useEffect(() => {
        setNewDate(new Date().toISOString().split('T')[0])
        // Simulate loading capacity from localStorage or API
        const saved = localStorage.getItem('eeg_capacity_config')
        if (saved) {
            setCapacityList(JSON.parse(saved))
        }
        setLoadingCapacity(false)

        // Load team from localStorage
        const savedTeam = localStorage.getItem('eeg_team_config')
        if (savedTeam) {
            const team = JSON.parse(savedTeam)
            if (team.medicos) setMedicos(team.medicos)
            if (team.enfermeiros) setEnfermeiros(team.enfermeiros)
            if (team.tecnicos) setTecnicos(team.tecnicos)
            if (team.solicitantes) setSolicitantes(team.solicitantes)
        }
    }, [])

    const handleAddCapacity = () => {
        if (!newDate) {
            toast.error('Selecione uma data')
            return
        }
        const capacity = parseInt(newCapacity) || 0

        // Check if date already exists
        if (capacityList.some(c => c.date === newDate)) {
            toast.error('Esta data já foi configurada')
            return
        }

        const newConfig: CapacityConfig = {
            id: Date.now().toString(),
            date: newDate,
            capacity
        }

        const updated = [...capacityList, newConfig].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        setCapacityList(updated)
        localStorage.setItem('eeg_capacity_config', JSON.stringify(updated))
        toast.success('Capacidade adicionada!')

        // Move date to next day
        const nextDay = new Date(newDate)
        nextDay.setDate(nextDay.getDate() + 1)
        setNewDate(nextDay.toISOString().split('T')[0])
    }

    const handleDeleteCapacity = (id: string) => {
        const updated = capacityList.filter(c => c.id !== id)
        setCapacityList(updated)
        localStorage.setItem('eeg_capacity_config', JSON.stringify(updated))
        toast.success('Capacidade removida')
    }

    const handleAddTeamMember = (type: 'medicos' | 'enfermeiros' | 'tecnicos' | 'solicitantes') => {
        const name = prompt('Digite o nome:')
        if (!name) return

        switch (type) {
            case 'medicos':
                setMedicos([...medicos, name])
                break
            case 'enfermeiros':
                setEnfermeiros([...enfermeiros, name])
                break
            case 'tecnicos':
                setTecnicos([...tecnicos, name])
                break
            case 'solicitantes':
                setSolicitantes([...solicitantes, name])
                break
        }
        toast.success('Membro adicionado!')
    }

    const handleRemoveTeamMember = (type: 'medicos' | 'enfermeiros' | 'tecnicos' | 'solicitantes', index: number) => {
        if (!confirm('Deseja remover este membro?')) return

        switch (type) {
            case 'medicos':
                setMedicos(medicos.filter((_, i) => i !== index))
                break
            case 'enfermeiros':
                setEnfermeiros(enfermeiros.filter((_, i) => i !== index))
                break
            case 'tecnicos':
                setTecnicos(tecnicos.filter((_, i) => i !== index))
                break
            case 'solicitantes':
                setSolicitantes(solicitantes.filter((_, i) => i !== index))
                break
        }
        toast.success('Membro removido')
    }

    const handleSaveTeam = () => {
        const teamData = { medicos, enfermeiros, tecnicos, solicitantes }
        localStorage.setItem('eeg_team_config', JSON.stringify(teamData))
        toast.success('Equipe salva com sucesso!')
    }

    const handleExportBackup = async () => {
        try {
            const response = await fetch('/api/pacientes')
            const patients = await response.json()

            const ordersResponse = await fetch('/api/pedidos')
            const orders = await ordersResponse.json()

            const backup = {
                exportedAt: new Date().toISOString(),
                patients,
                orders,
                team: { medicos, enfermeiros, tecnicos, solicitantes },
                capacity: capacityList,
            }

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `backup-eeg-${new Date().toISOString().split('T')[0]}.json`
            a.click()
            URL.revokeObjectURL(url)

            toast.success('Backup exportado com sucesso!')
        } catch (error) {
            toast.error('Erro ao exportar backup')
            console.error(error)
        }
    }

    const handleImportBackup = () => {
        toast.info('Para importar dados, acesse a página Admin (/admin)')
    }

    return (
        <>
            <AppHeader title="Configurações" />

            <div className="p-6 space-y-6">
                <Tabs defaultValue="capacity" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="capacity" className="flex gap-2">
                            <Calendar className="h-4 w-4" />
                            Capacidade
                        </TabsTrigger>
                        <TabsTrigger value="team" className="flex gap-2">
                            <Users className="h-4 w-4" />
                            Equipe
                        </TabsTrigger>
                        <TabsTrigger value="backup">Backup</TabsTrigger>
                    </TabsList>

                    {/* Capacidade Tab */}
                    <TabsContent value="capacity" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Definir Capacidade Eletiva por Dia</CardTitle>
                                <p className="text-sm text-slate-500">
                                    Adicione os dias em que haverá exames eletivos e a capacidade de cada dia.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-4 items-end">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Data</Label>
                                        <Input
                                            type="date"
                                            id="date"
                                            value={newDate}
                                            onChange={(e) => setNewDate(e.target.value)}
                                            className="w-[180px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="capacity">Capacidade Eletiva</Label>
                                        <Input
                                            type="number"
                                            id="capacity"
                                            min="0"
                                            value={newCapacity}
                                            onChange={(e) => setNewCapacity(e.target.value)}
                                            className="w-[120px]"
                                        />
                                    </div>
                                    <Button onClick={handleAddCapacity}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Adicionar
                                    </Button>
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50">
                                                <TableHead>Data</TableHead>
                                                <TableHead>Capacidade Eletiva</TableHead>
                                                <TableHead className="text-right">Ação</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loadingCapacity ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-8">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                                                    </TableCell>
                                                </TableRow>
                                            ) : capacityList.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                                                        Nenhuma capacidade configurada.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                capacityList.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>{formatDate(item.date)}</TableCell>
                                                        <TableCell className="text-center">{item.capacity}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-600"
                                                                onClick={() => handleDeleteCapacity(item.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Equipe Tab */}
                    <TabsContent value="team" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Médicas */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Médica(s) Executora(s)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {medicos.map((name, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input value={name} readOnly className="flex-1" />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600"
                                                onClick={() => handleRemoveTeamMember('medicos', index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleAddTeamMember('medicos')}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Adicionar Médica
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Enfermeiras */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Enfermeira(s)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {enfermeiros.map((name, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input value={name} readOnly className="flex-1" />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600"
                                                onClick={() => handleRemoveTeamMember('enfermeiros', index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleAddTeamMember('enfermeiros')}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Adicionar Enfermeira
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Técnicas */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Técnica(s)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {tecnicos.map((name, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input value={name} readOnly className="flex-1" />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600"
                                                onClick={() => handleRemoveTeamMember('tecnicos', index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleAddTeamMember('tecnicos')}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Adicionar Técnica
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Solicitantes */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Médicos Solicitantes</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {solicitantes.length === 0 ? (
                                        <p className="text-sm text-slate-500 text-center py-4">
                                            Nenhum solicitante cadastrado
                                        </p>
                                    ) : (
                                        solicitantes.map((name, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Input value={name} readOnly className="flex-1" />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600"
                                                    onClick={() => handleRemoveTeamMember('solicitantes', index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleAddTeamMember('solicitantes')}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Adicionar Solicitante
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        <Button className="bg-blue-600" onClick={handleSaveTeam}>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Equipe
                        </Button>
                    </TabsContent>

                    {/* Backup Tab */}
                    <TabsContent value="backup">
                        <Card>
                            <CardHeader>
                                <CardTitle>Backup e Restauração de Dados</CardTitle>
                                <p className="text-sm text-slate-500">
                                    Faça backups regularmente para evitar perda de dados.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <p className="text-sm">
                                        <span className="font-medium">Dica:</span>{' '}
                                        <span className="text-slate-600">
                                            Os dados são armazenados no Supabase na nuvem.
                                        </span>
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    <Button
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={handleExportBackup}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Exportar Dados (Backup)
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                        asChild
                                    >
                                        <Link href="/admin">
                                            <Upload className="mr-2 h-4 w-4" />
                                            Importar Dados (Admin)
                                        </Link>
                                    </Button>
                                </div>

                                <p className="text-sm text-slate-500">
                                    Para importar dados ou migrar do sistema antigo, acesse a{' '}
                                    <Link href="/admin" className="text-blue-600 underline">
                                        página de Administração
                                    </Link>.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    )
}
