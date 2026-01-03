'use client'

import { AppHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, History, Archive, Filter, Loader2, CalendarCheck } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { PRIORITY_DESCRIPTIONS, PRIORITY_COLORS } from '@/types'
import { ScheduleModal, OrderDetailsModal } from '@/components/modals'

interface OrderWithPatient {
    id: string
    patient_id: string
    status: string
    prioridade: number
    tipo_paciente: string
    necessidade_sedacao: string
    medico_solicitante: string | null
    data_pedido: string
    scheduled_date: string | null
    patient: {
        nome_completo: string
        municipio: string | null
    } | null
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR')
}

const statusColors: Record<string, string> = {
    Pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Agendado: 'bg-blue-100 text-blue-800 border-blue-200',
    Concluido: 'bg-green-100 text-green-800 border-green-200',
    Cancelado: 'bg-red-100 text-red-800 border-red-200',
}

export default function PedidosPage() {
    const [orders, setOrders] = useState<OrderWithPatient[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [showFilters, setShowFilters] = useState(false)

    // Modal de agendamento
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<{ id: string; patientName: string } | null>(null)

    // Modal de detalhes
    const [detailsModalOpen, setDetailsModalOpen] = useState(false)
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderWithPatient | null>(null)

    // Ler filtros da URL no primeiro render (client-side)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const paciente = params.get('paciente')
        const status = params.get('status')
        const prioridade = params.get('prioridade')

        if (paciente) setSearchTerm(paciente)
        if (status) {
            setStatusFilter(status)
            setShowFilters(true)
        }
        if (prioridade) {
            setPriorityFilter(prioridade)
            setShowFilters(true)
        }
    }, [])

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/pedidos')
            if (!response.ok) throw new Error('Erro ao carregar pedidos')
            const data = await response.json()
            setOrders(data)
        } catch (error) {
            toast.error('Erro ao carregar pedidos')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleArchive = async (id: string) => {
        if (!confirm('Deseja arquivar este pedido?')) return

        try {
            const response = await fetch(`/api/pedidos/${id}`, { method: 'DELETE' })
            if (!response.ok) throw new Error('Erro ao arquivar')
            toast.success('Pedido arquivado')
            fetchOrders()
        } catch {
            toast.error('Erro ao arquivar pedido')
        }
    }

    const handleSchedule = (id: string, patientName: string) => {
        setSelectedOrder({ id, patientName })
        setScheduleModalOpen(true)
    }

    const handleConfirmSchedule = async (date: string, time: string) => {
        if (!selectedOrder) return

        const response = await fetch(`/api/pedidos/${selectedOrder.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'Agendado',
                scheduled_date: date,
                scheduled_time: time
            }),
        })
        if (!response.ok) throw new Error('Erro ao agendar')
        toast.success('Pedido agendado com sucesso!')
        fetchOrders()
    }

    const filteredOrders = orders.filter(order => {
        const searchLower = searchTerm.toLowerCase()
        const patientName = order.patient?.nome_completo || ''
        const municipio = order.patient?.municipio || ''

        // Busca em todos os campos relevantes
        const matchesSearch = searchTerm === '' ||
            patientName.toLowerCase().includes(searchLower) ||
            municipio.toLowerCase().includes(searchLower) ||
            (order.medico_solicitante || '').toLowerCase().includes(searchLower) ||
            order.tipo_paciente.toLowerCase().includes(searchLower) ||
            order.necessidade_sedacao.toLowerCase().includes(searchLower) ||
            order.id.toLowerCase().includes(searchLower)

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter

        // Suporte para filtro 'urgente' (P1 ou P2)
        let matchesPriority = priorityFilter === 'all'
        if (priorityFilter === 'urgente') {
            matchesPriority = order.prioridade <= 2
        } else if (priorityFilter !== 'all') {
            matchesPriority = order.prioridade.toString() === priorityFilter
        }

        return matchesSearch && matchesStatus && matchesPriority
    })

    return (
        <>
            <AppHeader title="Gerenciamento de Pedidos" />

            <div className="p-6 space-y-6">
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex flex-1 gap-3 max-w-xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por paciente, município, médico..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className={showFilters ? 'bg-slate-100' : ''}
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            Filtros
                        </Button>
                    </div>

                    <Button asChild className="bg-green-600 hover:bg-green-700">
                        <Link href="/pedidos/novo">
                            <Plus className="mr-2 h-4 w-4" />
                            Criar Pedido
                        </Link>
                    </Button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-slate-50 p-4 rounded-lg border flex flex-wrap gap-4">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px] bg-white">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos Status</SelectItem>
                                <SelectItem value="Pendente">Pendente</SelectItem>
                                <SelectItem value="Agendado">Agendado</SelectItem>
                                <SelectItem value="Concluido">Concluído</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-[280px] bg-white">
                                <SelectValue placeholder="Prioridade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas Prioridades</SelectItem>
                                <SelectItem value="1">P1 - {PRIORITY_DESCRIPTIONS[1]}</SelectItem>
                                <SelectItem value="2">P2 - {PRIORITY_DESCRIPTIONS[2]}</SelectItem>
                                <SelectItem value="3">P3 - {PRIORITY_DESCRIPTIONS[3]}</SelectItem>
                                <SelectItem value="4">P4 - {PRIORITY_DESCRIPTIONS[4]}</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="ghost"
                            onClick={() => {
                                setStatusFilter('all')
                                setPriorityFilter('all')
                                setSearchTerm('')
                            }}
                        >
                            Limpar Filtros
                        </Button>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead>Paciente</TableHead>
                                <TableHead>Data Pedido</TableHead>
                                <TableHead>Prioridade</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Data Agendada</TableHead>
                                <TableHead>Sedação</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Solicitante</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                                        {orders.length === 0
                                            ? 'Nenhum pedido cadastrado ainda.'
                                            : 'Nenhum pedido encontrado com os filtros atuais.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium">{order.patient?.nome_completo || 'N/D'}</TableCell>
                                        <TableCell>{formatDate(order.data_pedido)}</TableCell>
                                        <TableCell>
                                            <Badge
                                                className={`${PRIORITY_COLORS[order.prioridade as 1 | 2 | 3 | 4]} text-white border-0`}
                                                title={PRIORITY_DESCRIPTIONS[order.prioridade as 1 | 2 | 3 | 4]}
                                            >
                                                P{order.prioridade}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={statusColors[order.status] || ''}>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(order.scheduled_date)}</TableCell>
                                        <TableCell>
                                            <Badge variant={order.necessidade_sedacao === 'Com' ? 'default' : 'outline'}>
                                                {order.necessidade_sedacao}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs">
                                                {order.tipo_paciente === 'Internado' ? 'INT' : 'AMB'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm">{order.medico_solicitante || '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                {order.status === 'Pendente' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        title="Agendar"
                                                        className="text-blue-600"
                                                        onClick={() => handleSchedule(order.id, order.patient?.nome_completo || 'Paciente')}
                                                    >
                                                        <CalendarCheck className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title="Ver Detalhes"
                                                    onClick={() => {
                                                        setSelectedOrderDetails(order)
                                                        setDetailsModalOpen(true)
                                                    }}
                                                >
                                                    <History className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" title="Editar" asChild>
                                                    <Link href={`/pedidos/${order.id}/editar`}>
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title="Arquivar"
                                                    className="text-orange-600"
                                                    onClick={() => handleArchive(order.id)}
                                                >
                                                    <Archive className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Count */}
                <p className="text-sm text-slate-500">
                    {filteredOrders.length} pedido(s) encontrado(s)
                </p>
            </div>

            {/* Modal de Agendamento */}
            {selectedOrder && (
                <ScheduleModal
                    open={scheduleModalOpen}
                    onClose={() => {
                        setScheduleModalOpen(false)
                        setSelectedOrder(null)
                    }}
                    onConfirm={handleConfirmSchedule}
                    patientName={selectedOrder.patientName}
                />
            )}

            {/* Modal de Detalhes */}
            <OrderDetailsModal
                open={detailsModalOpen}
                onClose={() => {
                    setDetailsModalOpen(false)
                    setSelectedOrderDetails(null)
                }}
                order={selectedOrderDetails}
            />
        </>
    )
}
