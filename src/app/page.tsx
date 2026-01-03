'use client'

import { AppHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ClipboardList,
  Calendar,
  Users,
  AlertTriangle,
  Plus,
  CalendarCheck,
  TrendingUp,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { PRIORITY_COLORS } from '@/types'
import { useState, useEffect } from 'react'

interface Stats {
  pendingTotal: number
  pendingByPriority: Record<number, number>
  scheduledToday: number
  scheduledNext7Days: number
  capacityToday: number
  usedCapacityToday: number
  totalPatients: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Error loading stats:', err))
      .finally(() => setLoading(false))
  }, [])

  const availableToday = stats ? Math.max(0, stats.capacityToday - stats.usedCapacityToday) : 0

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
        {/* Welcome message */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Bem-vindo ao Sistema EEG</h2>
          <p className="text-blue-100">Visão geral do estado atual do sistema de agendamento.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pedidos Pendentes */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Pedidos Pendentes
              </CardTitle>
              <ClipboardList className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {stats?.pendingTotal ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Aguardando agendamento
              </p>
            </CardContent>
          </Card>

          {/* Por Prioridade */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Pendentes por Prioridade
              </CardTitle>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mt-2">
                {stats && Object.entries(stats.pendingByPriority).map(([priority, count]) => (
                  <div
                    key={priority}
                    className="flex flex-col items-center"
                    title={`Prioridade ${priority}`}
                  >
                    <span className={`w-8 h-8 rounded-full ${PRIORITY_COLORS[parseInt(priority) as 1 | 2 | 3 | 4]} text-white text-sm font-bold flex items-center justify-center`}>
                      {count}
                    </span>
                    <span className="text-xs text-slate-400 mt-1">P{priority}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Próximos Agendamentos */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Próximos Agendamentos
              </CardTitle>
              <Calendar className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Hoje</span>
                  <span className="font-semibold text-blue-600">{stats?.scheduledToday ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Próx. 7 dias</span>
                  <span className="font-semibold text-blue-600">{stats?.scheduledNext7Days ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacidade */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Capacidade Hoje
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats?.usedCapacityToday ?? 0}/{stats?.capacityToday ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {availableToday} vaga{availableToday !== 1 ? 's' : ''} disponível{availableToday !== 1 ? 'is' : ''}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Total Pacientes */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Total de Pacientes
              </CardTitle>
              <Users className="h-5 w-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">
                {stats?.totalPatients ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pacientes cadastrados
              </p>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card className="lg:col-span-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/pacientes/novo">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Paciente
                  </Link>
                </Button>
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <Link href="/pedidos/novo">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Criar Pedido
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/agendamentos">
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Ver Agenda de Hoje
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
