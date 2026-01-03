'use client'

import { AppHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
    Activity
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
    LineChart,
    Line,
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

    // Set default dates (current month)
    useEffect(() => {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        setStartDate(firstDay.toISOString().split('T')[0])
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

    // Priority distribution
    const byPriority = filteredOrders
        .filter(o => o.status === 'Pendente')
        .reduce((acc, o) => {
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
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }))

    // Sedation distribution
    const bySedacao = filteredOrders.reduce((acc, o) => {
        const key = o.necessidade_sedacao === 'Com' ? 'Com Sedação' : 'Sem Sedação'
        acc[key] = (acc[key] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const sedacaoData = Object.entries(bySedacao).map(([name, value]) => ({
        name,
        value,
        fill: name === 'Com Sedação' ? '#8b5cf6' : '#06b6d4'
    }))

    // Type distribution
    const byTipo = filteredOrders.reduce((acc, o) => {
        const key = o.tipo_paciente === 'Internado' ? 'Internados' : 'Ambulatório'
        acc[key] = (acc[key] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const tipoData = Object.entries(byTipo).map(([name, value]) => ({
        name,
        value,
        fill: name === 'Internados' ? '#ef4444' : '#3b82f6'
    }))

    const handlePrint = () => {
        window.print()
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

    return (
        <>
            <AppHeader title="Relatórios Gerenciais" />

            <div className="p-6 space-y-6 print:p-2">
                {/* Filters */}
                <Card className="print:hidden">
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="space-y-2">
                                <Label htmlFor="start">Data Inicial</Label>
                                <Input
                                    type="date"
                                    id="start"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-[180px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end">Data Final</Label>
                                <Input
                                    type="date"
                                    id="end"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-[180px]"
                                />
                            </div>
                            <Button variant="outline" onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Print Header */}
                <div className="hidden print:block text-center mb-4">
                    <h1 className="text-xl font-bold">Relatório Gerencial - EEG Pediátrico</h1>
                    <p className="text-sm text-slate-500">
                        Período: {new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')} a {new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                </div>

                {/* Main Stats Cards */}
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

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Status Distribution */}
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
                                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
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

                    {/* Priority Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                Pendentes por Prioridade
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
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* By Municipio */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-green-500" />
                                Pedidos por Município
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={municipioData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* By Type */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-indigo-500" />
                                Por Tipo de Paciente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={tipoData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        dataKey="value"
                                    >
                                        {tipoData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 3 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* By Sedation */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Stethoscope className="h-5 w-5 text-purple-500" />
                                Necessidade de Sedação
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={sedacaoData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {sedacaoData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

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
                                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                    <span className="text-purple-700">Com Sedação</span>
                                    <Badge className="bg-purple-500">{bySedacao['Com Sedação'] || 0}</Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                    <span className="text-red-700">Internados</span>
                                    <Badge className="bg-red-500">{byTipo['Internados'] || 0}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-slate-400 print:text-slate-600">
                    Relatório gerado em {new Date().toLocaleString('pt-BR')} | Sistema EEG Pediátrico - HGP
                </div>
            </div>
        </>
    )
}
