'use client'

import { AppHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Printer,
    FileText,
    Loader2,
    TrendingUp,
    TrendingDown,
    Users,
    Clock,
    CheckCircle,
    AlertTriangle,
    MapPin,
    Stethoscope,
    Calendar,
    Activity,
    Filter,
    Eye,
    EyeOff
} from 'lucide-react'
import { useState, useEffect } from 'react'
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
    CartesianGrid
} from 'recharts'

interface Order {
    id: string
    data_pedido: string
    scheduled_date: string | null
    data_conclusao: string | null
    prioridade: number
    tipo_paciente: string
    necessidade_sedacao: string
    status: string
    medico_solicitante: string | null
    medico_executor: string | null
    patient: {
        municipio: string | null
    } | null
}

const PRIORITY_COLORS = ['#dc2626', '#f97316', '#eab308', '#22c55e']
const STATUS_COLORS = {
    'Pendente': '#f97316',
    'Agendado': '#3b82f6',
    'Concluido': '#22c55e',
}

export default function RelatoriosPage() {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [orders, setOrders] = useState<Order[]>([])
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    const [showPrintView, setShowPrintView] = useState(false)

    // Visibility toggles for report sections
    const [showSections, setShowSections] = useState({
        resumo: true,
        status: true,
        prioridade: true,
        municipio: true,
        tipo: true,
        sedacao: true,
        medicos: true,
    })

    // Set default dates (last 12 months to capture historical data)
    useEffect(() => {
        const now = new Date()
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        setStartDate(oneYearAgo.toISOString().split('T')[0])
        setEndDate(lastDay.toISOString().split('T')[0])
    }, [])

    // Load data automatically
    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch('/api/pedidos')
                if (!response.ok) throw new Error('Erro ao carregar')
                const data = await response.json()
                setOrders(data)
            } catch (error) {
                console.error('Error loading orders:', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    // Filter data when dates change
    useEffect(() => {
        if (!startDate || !endDate || orders.length === 0) {
            setFilteredOrders(orders)
            return
        }

        const startTime = new Date(startDate + 'T00:00:00').getTime()
        const endTime = new Date(endDate + 'T23:59:59').getTime()

        const filtered = orders.filter(o => {
            if (!o.data_pedido) return false
            const orderTime = new Date(o.data_pedido + 'T00:00:00').getTime()
            return orderTime >= startTime && orderTime <= endTime
        })

        setFilteredOrders(filtered)
    }, [startDate, endDate, orders])

    // Calculate statistics
    const pendingOrders = filteredOrders.filter(o => o.status === 'Pendente')
    const scheduledOrders = filteredOrders.filter(o => o.status === 'Agendado')
    const completedOrders = filteredOrders.filter(o => o.status === 'Concluido' || o.status === 'Concluído')

    const totalOrders = filteredOrders.length
    const completionRate = totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 100) : 0

    // Pedidos pendentes há mais de 30 dias
    const today = new Date()
    const pendingOldOrders = pendingOrders.filter(o => {
        const orderDate = new Date(o.data_pedido + 'T00:00:00')
        const diffDays = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays > 30
    })

    // Diversidade de municípios (quantos diferentes)
    const uniqueMunicipios = new Set(
        filteredOrders
            .map(o => o.patient?.municipio)
            .filter(Boolean)
    )
    const diversidadeMunicipios = uniqueMunicipios.size

    // Priority distribution
    const byPriority = filteredOrders.reduce((acc, o) => {
        acc[o.prioridade] = (acc[o.prioridade] || 0) + 1
        return acc
    }, {} as Record<number, number>)

    const priorityData = [
        { name: 'P1 - Muito Urgente', value: byPriority[1] || 0, fill: PRIORITY_COLORS[0] },
        { name: 'P2 - Urgente', value: byPriority[2] || 0, fill: PRIORITY_COLORS[1] },
        { name: 'P3 - Regular', value: byPriority[3] || 0, fill: PRIORITY_COLORS[2] },
        { name: 'P4 - Eletivo', value: byPriority[4] || 0, fill: PRIORITY_COLORS[3] },
    ]

    // Status distribution
    const statusData = [
        { name: 'Pendentes', value: pendingOrders.length, fill: STATUS_COLORS['Pendente'] },
        { name: 'Agendados', value: scheduledOrders.length, fill: STATUS_COLORS['Agendado'] },
        { name: 'Concluídos', value: completedOrders.length, fill: STATUS_COLORS['Concluido'] },
    ]

    // Municipio distribution
    const byMunicipio = filteredOrders.reduce((acc, o) => {
        const city = o.patient?.municipio || 'Não informado'
        acc[city] = (acc[city] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const municipioData = Object.entries(byMunicipio)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }))

    // Sedation distribution
    const bySedacao = filteredOrders.reduce((acc, o) => {
        const key = o.necessidade_sedacao === 'Com' ? 'Com Sedação' : 'Sem Sedação'
        acc[key] = (acc[key] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    // Type distribution
    const byTipo = filteredOrders.reduce((acc, o) => {
        const key = o.tipo_paciente === 'Internado' ? 'Internados' : 'Ambulatório'
        acc[key] = (acc[key] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    // Médicos solicitantes
    const byMedicoSolicitante = filteredOrders.reduce((acc, o) => {
        const medico = o.medico_solicitante || 'Não informado'
        acc[medico] = (acc[medico] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const medicoSolicitanteData = Object.entries(byMedicoSolicitante)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }))

    // Médicos executores
    const byMedicoExecutor = completedOrders.reduce((acc, o) => {
        const medico = o.medico_executor || 'Não informado'
        acc[medico] = (acc[medico] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const medicoExecutorData = Object.entries(byMedicoExecutor)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }))

    const handlePrint = () => {
        setShowPrintView(true)
        setTimeout(() => {
            window.print()
            setShowPrintView(false)
        }, 100)
    }

    const toggleSection = (key: keyof typeof showSections) => {
        setShowSections(prev => ({ ...prev, [key]: !prev[key] }))
    }

    if (loading) {
        return (
            <>
                <AppHeader title="Relatórios Gerenciais" />
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            </>
        )
    }

    // Print View - Clean layout for printing
    if (showPrintView) {
        return (
            <div className="p-8 bg-white text-black min-h-screen print:p-4">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold">Relatório Gerencial - EEG Pediátrico</h1>
                    <p className="text-gray-600">Hospital Geral de Palmas</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Período: {new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')} a {new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                </div>

                {showSections.resumo && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold border-b pb-2 mb-4">Resumo Geral</h2>
                        <table className="w-full border-collapse">
                            <tbody>
                                <tr className="border-b"><td className="py-2 font-medium">Total de Pedidos</td><td className="py-2 text-right">{totalOrders}</td></tr>
                                <tr className="border-b"><td className="py-2 font-medium">Pendentes</td><td className="py-2 text-right">{pendingOrders.length}</td></tr>
                                <tr className="border-b"><td className="py-2 font-medium">Agendados</td><td className="py-2 text-right">{scheduledOrders.length}</td></tr>
                                <tr className="border-b"><td className="py-2 font-medium">Concluídos</td><td className="py-2 text-right">{completedOrders.length}</td></tr>
                                <tr className="border-b"><td className="py-2 font-medium">Taxa de Conclusão</td><td className="py-2 text-right">{completionRate}%</td></tr>
                                <tr className="border-b bg-red-50"><td className="py-2 font-medium text-red-700">Pendentes há mais de 30 dias</td><td className="py-2 text-right font-bold text-red-700">{pendingOldOrders.length}</td></tr>
                                <tr className="border-b"><td className="py-2 font-medium">Municípios Atendidos</td><td className="py-2 text-right">{diversidadeMunicipios}</td></tr>
                                <tr className="border-b"><td className="py-2 font-medium">Com Sedação</td><td className="py-2 text-right">{filteredOrders.filter(o => o.necessidade_sedacao === 'Com').length}</td></tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {showSections.prioridade && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold border-b pb-2 mb-4">Por Prioridade</h2>
                        <table className="w-full border-collapse">
                            <tbody>
                                {priorityData.map((p) => (
                                    <tr key={p.name} className="border-b"><td className="py-2">{p.name}</td><td className="py-2 text-right">{p.value}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {showSections.municipio && municipioData.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold border-b pb-2 mb-4">Por Município</h2>
                        <table className="w-full border-collapse">
                            <tbody>
                                {municipioData.map((m) => (
                                    <tr key={m.name} className="border-b"><td className="py-2">{m.name}</td><td className="py-2 text-right">{m.value}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {showSections.medicos && (
                    <>
                        {medicoSolicitanteData.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-lg font-bold border-b pb-2 mb-4">Por Médico Solicitante</h2>
                                <table className="w-full border-collapse">
                                    <tbody>
                                        {medicoSolicitanteData.map((m) => (
                                            <tr key={m.name} className="border-b"><td className="py-2">{m.name}</td><td className="py-2 text-right">{m.value}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {medicoExecutorData.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-lg font-bold border-b pb-2 mb-4">Por Médico Executor (Concluídos)</h2>
                                <table className="w-full border-collapse">
                                    <tbody>
                                        {medicoExecutorData.map((m) => (
                                            <tr key={m.name} className="border-b"><td className="py-2">{m.name}</td><td className="py-2 text-right">{m.value}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {showSections.tipo && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold border-b pb-2 mb-4">Por Tipo de Paciente</h2>
                        <table className="w-full border-collapse">
                            <tbody>
                                {Object.entries(byTipo).map(([name, value]) => (
                                    <tr key={name} className="border-b"><td className="py-2">{name}</td><td className="py-2 text-right">{value}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {showSections.sedacao && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold border-b pb-2 mb-4">Necessidade de Sedação</h2>
                        <table className="w-full border-collapse">
                            <tbody>
                                {Object.entries(bySedacao).map(([name, value]) => (
                                    <tr key={name} className="border-b"><td className="py-2">{name}</td><td className="py-2 text-right">{value}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="text-center text-xs text-gray-400 mt-8">
                    Relatório gerado em {new Date().toLocaleString('pt-BR')}
                </div>
            </div>
        )
    }

    // Normal View
    return (
        <>
            <AppHeader title="Relatórios Gerenciais" />

            <div className="p-6 space-y-6">
                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="space-y-2">
                                <Label htmlFor="start">Data Inicial</Label>
                                <Input
                                    type="date"
                                    id="start"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-[160px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end">Data Final</Label>
                                <Input
                                    type="date"
                                    id="end"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-[160px]"
                                />
                            </div>
                            <Button
                                variant={showFilters ? "secondary" : "outline"}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="mr-2 h-4 w-4" />
                                {showFilters ? 'Ocultar Opções' : 'Opções de Impressão'}
                            </Button>
                            <Button onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir Relatório
                            </Button>
                        </div>

                        {/* Print Options */}
                        {showFilters && (
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-sm font-medium text-slate-700 mb-3">Selecione as seções para incluir no relatório:</p>
                                <div className="flex flex-wrap gap-4">
                                    {Object.entries(showSections).map(([key, value]) => {
                                        const labels: Record<string, string> = {
                                            resumo: 'Resumo Geral',
                                            status: 'Por Status',
                                            prioridade: 'Por Prioridade',
                                            municipio: 'Por Município',
                                            tipo: 'Por Tipo Paciente',
                                            sedacao: 'Por Sedação',
                                            medicos: 'Por Médicos',
                                        }
                                        return (
                                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                                                <Checkbox
                                                    checked={value}
                                                    onCheckedChange={() => toggleSection(key as keyof typeof showSections)}
                                                />
                                                <span className="text-sm">{labels[key]}</span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Main Stats Cards */}
                {showSections.resumo && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-orange-100 text-sm">Pendentes</p>
                                        <p className="text-4xl font-bold">{pendingOrders.length}</p>
                                    </div>
                                    <Clock className="h-10 w-10 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-sm">Agendados</p>
                                        <p className="text-4xl font-bold">{scheduledOrders.length}</p>
                                    </div>
                                    <Calendar className="h-10 w-10 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-sm">Concluídos</p>
                                        <p className="text-4xl font-bold">{completedOrders.length}</p>
                                    </div>
                                    <CheckCircle className="h-10 w-10 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-indigo-100 text-sm">Taxa Conclusão</p>
                                        <p className="text-4xl font-bold">{completionRate}%</p>
                                    </div>
                                    {completionRate >= 50 ? (
                                        <TrendingUp className="h-10 w-10 opacity-50" />
                                    ) : (
                                        <TrendingDown className="h-10 w-10 opacity-50" />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Extra Stats Row */}
                {showSections.resumo && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <Card className="border-l-4 border-l-red-500">
                            <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500">Pendentes &gt; 30 dias</p>
                                        <p className="text-2xl font-bold text-red-600">{pendingOldOrders.length}</p>
                                    </div>
                                    <AlertTriangle className="h-6 w-6 text-red-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-purple-500">
                            <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500">Municípios Atendidos</p>
                                        <p className="text-2xl font-bold text-purple-600">{diversidadeMunicipios}</p>
                                    </div>
                                    <MapPin className="h-6 w-6 text-purple-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-amber-500">
                            <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500">Com Sedação</p>
                                        <p className="text-2xl font-bold text-amber-600">
                                            {filteredOrders.filter(o => o.necessidade_sedacao === 'Com').length}
                                        </p>
                                    </div>
                                    <Activity className="h-6 w-6 text-amber-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-slate-500">
                            <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500">Total no Período</p>
                                        <p className="text-2xl font-bold text-slate-600">{totalOrders}</p>
                                    </div>
                                    <FileText className="h-6 w-6 text-slate-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Status Distribution */}
                    {showSections.status && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-500" />
                                    Distribuição por Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {/* Priority Distribution */}
                    {showSections.prioridade && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    Distribuição por Prioridade
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={priorityData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {priorityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Charts Row 2 - Médicos */}
                {showSections.medicos && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Médicos Solicitantes */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Stethoscope className="h-5 w-5 text-blue-500" />
                                    Pedidos por Médico Solicitante
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {medicoSolicitanteData.length === 0 ? (
                                    <div className="h-[200px] flex items-center justify-center text-slate-400">
                                        Nenhum dado disponível
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={medicoSolicitanteData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Médicos Executores */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-green-500" />
                                    Exames por Médico Executor
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {medicoExecutorData.length === 0 ? (
                                    <div className="h-[200px] flex items-center justify-center text-slate-400">
                                        Nenhum exame concluído no período
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={medicoExecutorData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Charts Row 3 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* By Municipio */}
                    {showSections.municipio && (
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-green-500" />
                                    Pedidos por Município (Top 10)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {municipioData.length === 0 ? (
                                    <div className="h-[200px] flex items-center justify-center text-slate-400">
                                        Nenhum dado disponível
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={municipioData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Summary Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-slate-500" />
                                Resumo do Período
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">Total de Pedidos</span>
                                    <Badge variant="outline" className="text-lg">{totalOrders}</Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                                    <span className="text-orange-700">Urgentes (P1+P2)</span>
                                    <Badge className="bg-orange-500">{(byPriority[1] || 0) + (byPriority[2] || 0)}</Badge>
                                </div>
                                {showSections.sedacao && (
                                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                        <span className="text-purple-700">Com Sedação</span>
                                        <Badge className="bg-purple-500">{bySedacao['Com Sedação'] || 0}</Badge>
                                    </div>
                                )}
                                {showSections.tipo && (
                                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                        <span className="text-red-700">Internados</span>
                                        <Badge className="bg-red-500">{byTipo['Internados'] || 0}</Badge>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-slate-400">
                    Dados do período: {new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')} a {new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR')} | {totalOrders} registros
                </div>
            </div>
        </>
    )
}
