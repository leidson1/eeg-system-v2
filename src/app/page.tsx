'use client'

import { AppHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ClipboardList,
  Calendar,
  Users,
  AlertTriangle,
  Plus,
  CalendarCheck,
  TrendingUp,
  Loader2,
  Clock,
  CheckCircle,
  Activity,
  MapPin,
  ArrowRight,
  Stethoscope
} from 'lucide-react'
import Link from 'next/link'
import { PRIORITY_COLORS } from '@/types'
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
  Legend
} from 'recharts'

interface Stats {
  pendingTotal: number
  pendingByPriority: Record<number, number>
  scheduledToday: number
  scheduledNext7Days: number
  capacityToday: number
  usedCapacityToday: number
  totalPatients: number
}

interface Order {
  id: string
  scheduled_date: string | null
  scheduled_time: string | null
  prioridade: number
  tipo_paciente: string
  status: string
  patient: {
    nome_completo: string
    municipio: string | null
  } | null
}

const CHART_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e']
const STATUS_COLORS = {
  'Pendente': '#f97316',
  'Agendado': '#3b82f6',
  'Concluido': '#22c55e',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/pedidos')
        ])

        const statsData = await statsRes.json()
        const ordersData = await ordersRes.json()

        setStats(statsData)
        setOrders(ordersData)
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate derived data
  const today = new Date().toISOString().split('T')[0]
  const todayScheduled = orders.filter(o => o.scheduled_date === today && o.status === 'Agendado')
  const urgentPending = orders.filter(o => o.status === 'Pendente' && (o.prioridade === 1 || o.prioridade === 2))

  // Chart data - Priority distribution
  const priorityData = stats ? [
    { name: 'P1 - Muito Urgente', value: stats.pendingByPriority[1] || 0 },
    { name: 'P2 - Urgente', value: stats.pendingByPriority[2] || 0 },
    { name: 'P3 - Regular', value: stats.pendingByPriority[3] || 0 },
    { name: 'P4 - Eletivo', value: stats.pendingByPriority[4] || 0 },
  ] : []

  // Chart data - Status distribution
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statusData = [
    { name: 'Pendentes', value: statusCounts['Pendente'] || 0, fill: STATUS_COLORS['Pendente'] },
    { name: 'Agendados', value: statusCounts['Agendado'] || 0, fill: STATUS_COLORS['Agendado'] },
    { name: 'Concluídos', value: statusCounts['Concluido'] || 0, fill: STATUS_COLORS['Concluido'] },
  ]

  // Chart data - By municipio
  const municipioCounts = orders
    .filter(o => o.status === 'Pendente')
    .reduce((acc, o) => {
      const city = o.patient?.municipio || 'Não informado'
      acc[city] = (acc[city] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  const municipioData = Object.entries(municipioCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }))

  const availableToday = stats ? Math.max(0, stats.capacityToday - stats.usedCapacityToday) : 0
  const capacityPercentage = stats && stats.capacityToday > 0
    ? Math.round((stats.usedCapacityToday / stats.capacityToday) * 100)
    : 0

  if (loading) {
    return (
      <>
        <AppHeader title="Dashboard" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </>
    )
  }

  return (
    <>
      <AppHeader title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-8 w-8" />
              <h2 className="text-3xl font-bold">Sistema EEG Pediátrico</h2>
            </div>
            <p className="text-blue-100 text-lg">Hospital Geral de Palmas - Visão geral em tempo real</p>

            <div className="flex flex-wrap gap-3 mt-6">
              <Button asChild className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30">
                <Link href="/pacientes/novo">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Paciente
                </Link>
              </Button>
              <Button asChild className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30">
                <Link href="/pedidos/novo">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Criar Pedido
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white/50 text-white hover:bg-white/10">
                <Link href="/agendamentos">
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  Ver Agenda
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pedidos Pendentes */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-orange-500 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Pedidos Pendentes
              </CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <ClipboardList className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-600">
                {stats?.pendingTotal ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Aguardando agendamento
              </p>
              {urgentPending.length > 0 && (
                <Badge variant="destructive" className="mt-2">
                  {urgentPending.length} urgente(s)
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Agendados Hoje */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Agendados Hoje
              </CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">
                {stats?.scheduledToday ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Próx. 7 dias: <span className="font-semibold text-blue-600">{stats?.scheduledNext7Days ?? 0}</span>
              </p>
            </CardContent>
          </Card>

          {/* Capacidade do Dia */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-green-500 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Capacidade Hoje
              </CardTitle>
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">
                {stats?.usedCapacityToday ?? 0}/{stats?.capacityToday ?? 0}
              </div>
              <div className="mt-2">
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                    style={{ width: `${capacityPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {availableToday} vaga{availableToday !== 1 ? 's' : ''} disponível{availableToday !== 1 ? 'is' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Pacientes */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-indigo-500 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Pacientes Cadastrados
              </CardTitle>
              <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-indigo-600">
                {stats?.totalPatients ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Stethoscope className="h-3 w-3" />
                Pacientes ativos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Priority Chart */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Pendentes por Prioridade
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.pendingTotal === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-slate-400">
                  <CheckCircle className="h-8 w-8 mr-2" />
                  Nenhum pedido pendente
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {priorityData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Status Chart */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Distribuição por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Municipio Chart */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-500" />
                Top 5 Municípios (Pendentes)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {municipioData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-slate-400">
                  Nenhum dado disponível
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={municipioData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Agenda de Hoje
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/agendamentos" className="text-blue-600">
                  Ver todos <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {todayScheduled.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum exame agendado para hoje</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayScheduled.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[order.prioridade as 1 | 2 | 3 | 4]}`} />
                        <div>
                          <p className="font-medium text-sm">{order.patient?.nome_completo || 'N/D'}</p>
                          <p className="text-xs text-slate-500">{order.scheduled_time || 'Horário não definido'}</p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {order.tipo_paciente === 'Internado' ? 'INT' : 'AMB'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Urgent Pending */}
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-red-400">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Pedidos Urgentes Pendentes
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/pedidos" className="text-red-600">
                  Ver todos <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {urgentPending.length === 0 ? (
                <div className="text-center py-8 text-green-600">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                  <p>Nenhum pedido urgente pendente!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {urgentPending.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge className={PRIORITY_COLORS[order.prioridade as 1 | 2 | 3 | 4]}>
                          P{order.prioridade}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{order.patient?.nome_completo || 'N/D'}</p>
                          <p className="text-xs text-slate-500">{order.patient?.municipio || 'Município não informado'}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/pedidos/${order.id}/editar`}>
                          Agendar
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
