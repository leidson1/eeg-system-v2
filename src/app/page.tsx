'use client'

import { AppHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  Stethoscope,
  Phone,
  Printer,
  FileText,
  Bell,
  AlertCircle,
  Timer,
  UserCheck,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { PRIORITY_COLORS, PRIORITY_DESCRIPTIONS } from '@/types'
import { useState, useEffect } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
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
  necessidade_sedacao: string
  status: string
  data_pedido: string
  patient: {
    nome_completo: string
    municipio: string | null
    whatsapp: string | null
  } | null
}

const CHART_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e']

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

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

    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Calculate derived data
  const today = new Date().toISOString().split('T')[0]
  const todayScheduled = orders.filter(o => o.scheduled_date === today && o.status === 'Agendado')
  const todayCompleted = orders.filter(o => o.scheduled_date === today && (o.status === 'Concluido' || o.status === 'Concluído'))
  const urgentPending = orders.filter(o => o.status === 'Pendente' && (o.prioridade === 1 || o.prioridade === 2))
  const pendingOrders = orders.filter(o => o.status === 'Pendente')

  // Próximos agendamentos (hoje e futuros) - ordenados por data
  const upcomingScheduled = orders
    .filter(o => o.scheduled_date && o.scheduled_date >= today && o.status === 'Agendado')
    .sort((a, b) => {
      const dateA = a.scheduled_date + (a.scheduled_time || '00:00')
      const dateB = b.scheduled_date + (b.scheduled_time || '00:00')
      return dateA.localeCompare(dateB)
    })

  // Agrupar próximos agendamentos por data
  const groupedUpcoming = upcomingScheduled.reduce((acc, order) => {
    const date = order.scheduled_date || 'sem-data'
    if (!acc[date]) acc[date] = []
    acc[date].push(order)
    return acc
  }, {} as Record<string, Order[]>)

  // Próximas datas com agendamentos (máximo 5 datas)
  const upcomingDates = Object.keys(groupedUpcoming).slice(0, 5)

  // Priority breakdown for pending orders
  const priorityBreakdown = pendingOrders.reduce((acc, o) => {
    acc[o.prioridade] = (acc[o.prioridade] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  // Chart data - Priority distribution
  const priorityData = [
    { name: 'P1', value: priorityBreakdown[1] || 0 },
    { name: 'P2', value: priorityBreakdown[2] || 0 },
    { name: 'P3', value: priorityBreakdown[3] || 0 },
    { name: 'P4', value: priorityBreakdown[4] || 0 },
  ].filter(d => d.value > 0)

  const todayProgress = todayScheduled.length + todayCompleted.length > 0
    ? Math.round((todayCompleted.length / (todayScheduled.length + todayCompleted.length)) * 100)
    : 0

  const greeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

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

      <div className="p-4 md:p-6 space-y-4">
        {/* Welcome & Time */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{greeting()}! 👋</h2>
            <p className="text-slate-500">
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="h-5 w-5" />
            <span className="text-xl font-semibold">
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Alerts Section */}
        {(urgentPending.length > 0 || todayScheduled.length > 0) && (
          <div className="space-y-2">
            {urgentPending.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="flex-1 font-medium">
                  {urgentPending.length} pedido{urgentPending.length > 1 ? 's' : ''} urgente{urgentPending.length > 1 ? 's' : ''} (P1/P2) aguardando agendamento
                </span>
                <Button size="sm" variant="destructive" asChild>
                  <Link href="/pedidos">Ver Pedidos</Link>
                </Button>
              </div>
            )}
            {todayScheduled.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                <Calendar className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <span className="flex-1 font-medium">
                  {todayScheduled.length} exame{todayScheduled.length > 1 ? 's' : ''} agendado{todayScheduled.length > 1 ? 's' : ''} para hoje
                </span>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
                  <Link href="/agendamentos">Ver Agenda</Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button asChild className="h-auto py-4 bg-blue-600 hover:bg-blue-700 flex-col gap-2">
            <Link href="/pacientes/novo">
              <Plus className="h-6 w-6" />
              <span>Novo Paciente</span>
            </Link>
          </Button>
          <Button asChild className="h-auto py-4 bg-green-600 hover:bg-green-700 flex-col gap-2">
            <Link href="/pedidos/novo">
              <ClipboardList className="h-6 w-6" />
              <span>Criar Pedido</span>
            </Link>
          </Button>
          <Button asChild className="h-auto py-4 bg-amber-500 hover:bg-amber-600 flex-col gap-2">
            <Link href="/agendamentos">
              <CalendarCheck className="h-6 w-6" />
              <span>Ver Agenda</span>
            </Link>
          </Button>
          <Button asChild className="h-auto py-4 bg-purple-600 hover:bg-purple-700 flex-col gap-2">
            <Link href="/mapa-impressao">
              <Printer className="h-6 w-6" />
              <span>Imprimir Mapa</span>
            </Link>
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Today's Progress */}
          <Card className="col-span-2">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Progresso de Hoje</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {todayCompleted.length}/{todayScheduled.length + todayCompleted.length}
                </span>
              </div>
              <Progress value={todayProgress} className="h-3" />
              <p className="text-xs text-slate-500 mt-1">
                {todayCompleted.length} concluído{todayCompleted.length !== 1 ? 's' : ''} • {todayScheduled.length} pendente{todayScheduled.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          {/* Pending Total */}
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Na Fila</p>
                  <p className="text-3xl font-bold text-orange-600">{pendingOrders.length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          {/* Total Patients */}
          <Card className="border-l-4 border-l-indigo-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Pacientes</p>
                  <p className="text-3xl font-bold text-indigo-600">{stats?.totalPatients ?? 0}</p>
                </div>
                <Users className="h-8 w-8 text-indigo-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Próximos Agendamentos */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Próximos Agendamentos
                  {upcomingScheduled.length > 0 && (
                    <Badge variant="secondary">{upcomingScheduled.length}</Badge>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/mapa-impressao">
                      <Printer className="h-4 w-4 mr-1" />
                      Mapa
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/agendamentos">
                      Ver Todos <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingScheduled.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum exame agendado</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/pedidos">Agendar pedidos pendentes</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingDates.map((date) => {
                    const dateOrders = groupedUpcoming[date] || []
                    const isToday = date === today
                    const dateObj = new Date(date + 'T00:00:00')
                    const dateLabel = isToday
                      ? 'Hoje'
                      : dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })

                    return (
                      <div key={date}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={isToday ? 'default' : 'outline'}
                            className={isToday ? 'bg-blue-600' : ''}
                          >
                            {dateLabel}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {dateOrders.length} exame{dateOrders.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="space-y-2 pl-2 border-l-2 border-blue-200">
                          {dateOrders.slice(0, 4).map((order) => (
                            <div
                              key={order.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 text-center font-mono font-semibold text-slate-700">
                                  {order.scheduled_time || '--:--'}
                                </div>
                                <div className={`w-2 h-6 rounded-full ${PRIORITY_COLORS[order.prioridade as 1 | 2 | 3 | 4]}`} />
                                <div>
                                  <p className="font-medium text-sm">
                                    {order.patient?.nome_completo || 'N/D'}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>{order.tipo_paciente === 'Internado' ? '🏥' : '🚶'}</span>
                                    {order.necessidade_sedacao === 'Com' && <span>💊</span>}
                                    {order.patient?.municipio && <span>📍 {order.patient.municipio}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {order.patient?.whatsapp && (
                                  <Button size="sm" variant="ghost" asChild>
                                    <a href={`https://wa.me/55${order.patient.whatsapp.replace(/\D/g, '')}`} target="_blank">
                                      <Phone className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" asChild>
                                  <Link href={`/pedidos/${order.id}/editar`}>
                                    <ChevronRight className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          ))}
                          {dateOrders.length > 4 && (
                            <p className="text-xs text-slate-500 pl-2">
                              + {dateOrders.length - 4} mais agendados
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Priority Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Fila por Prioridade
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingOrders.length === 0 ? (
                  <div className="text-center py-4 text-green-600">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Nenhum pedido pendente!</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={priorityData}
                            cx="50%"
                            cy="50%"
                            innerRadius={20}
                            outerRadius={40}
                            dataKey="value"
                          >
                            {priorityData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[1, 2, 3, 4].map(p => (
                        <div key={p} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[p as 1 | 2 | 3 | 4]}`} />
                            <span>P{p}</span>
                          </div>
                          <span className="font-semibold">{priorityBreakdown[p] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Urgent Pending Quick List */}
            {urgentPending.length > 0 && (
              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-red-600">
                    <Bell className="h-4 w-4" />
                    Urgentes Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {urgentPending.slice(0, 4).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                        <div className="flex items-center gap-2">
                          <Badge className={PRIORITY_COLORS[order.prioridade as 1 | 2 | 3 | 4]}>
                            P{order.prioridade}
                          </Badge>
                          <span className="text-sm truncate max-w-[120px]">
                            {order.patient?.nome_completo || 'N/D'}
                          </span>
                        </div>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/pedidos/${order.id}/editar`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                    {urgentPending.length > 4 && (
                      <Button variant="link" size="sm" asChild className="w-full">
                        <Link href="/pedidos?status=Pendente&prioridade=urgente">
                          Ver mais {urgentPending.length - 4} urgentes...
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-slate-500" />
                  Acesso Rápido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/pedidos">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Gerenciar Pedidos
                    <Badge variant="secondary" className="ml-auto">{pendingOrders.length}</Badge>
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/pacientes">
                    <Users className="h-4 w-4 mr-2" />
                    Lista de Pacientes
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/relatorios">
                    <FileText className="h-4 w-4 mr-2" />
                    Relatórios
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/arquivados">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Arquivados
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
