'use client'

import { AppHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Undo2, Eye, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { PRIORITY_DESCRIPTIONS } from '@/types'
import Link from 'next/link'

interface ArchivedOrder {
    id: string
    patient_id: string
    data_pedido: string
    archived_at: string | null
    prioridade: number
    necessidade_sedacao: string
    tipo_paciente: string
    medico_solicitante: string | null
    patient: {
        nome_completo: string
    } | null
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR')
}

export default function ArquivadosPage() {
    const [orders, setOrders] = useState<ArchivedOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchArchivedOrders()
    }, [])

    const fetchArchivedOrders = async () => {
        try {
            const response = await fetch('/api/pedidos?archived=true')
            if (!response.ok) throw new Error('Erro ao carregar')
            const data = await response.json()
            setOrders(data)
        } catch (error) {
            toast.error('Erro ao carregar pedidos arquivados')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleUnarchive = async (id: string) => {
        if (!confirm('Deseja desarquivar este pedido? Ele voltará para a lista de pedidos.')) return

        try {
            const response = await fetch(`/api/pedidos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archived: false, archived_at: null })
            })
            if (!response.ok) throw new Error('Erro ao desarquivar')
            toast.success('Pedido desarquivado com sucesso!')
            fetchArchivedOrders()
        } catch (error) {
            toast.error('Erro ao desarquivar pedido')
            console.error(error)
        }
    }

    const filteredArchived = orders.filter(order => {
        const patientName = order.patient?.nome_completo || ''
        return searchTerm === '' ||
            patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.medico_solicitante || '').toLowerCase().includes(searchTerm.toLowerCase())
    })

    return (
        <>
            <AppHeader title="Pedidos Arquivados" />

            <div className="p-6 space-y-6">
                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nome ou solicitante..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg border shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead>Paciente</TableHead>
                                <TableHead>Data Pedido</TableHead>
                                <TableHead>Data Arquiv.</TableHead>
                                <TableHead>Prioridade</TableHead>
                                <TableHead>Sedação</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Solicitante</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredArchived.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                                        Nenhum pedido arquivado encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredArchived.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium">
                                            {order.patient?.nome_completo || 'N/D'}
                                        </TableCell>
                                        <TableCell>{formatDate(order.data_pedido)}</TableCell>
                                        <TableCell>{formatDate(order.archived_at)}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                title={PRIORITY_DESCRIPTIONS[order.prioridade as 1 | 2 | 3 | 4]}
                                            >
                                                P{order.prioridade}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{order.necessidade_sedacao}</TableCell>
                                        <TableCell>
                                            {order.tipo_paciente === 'Internado' ? 'INT' : 'AMB'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {order.medico_solicitante || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title="Ver Detalhes"
                                                    asChild
                                                >
                                                    <Link href={`/pedidos/${order.id}/editar`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title="Desarquivar"
                                                    className="text-green-600 hover:text-green-700"
                                                    onClick={() => handleUnarchive(order.id)}
                                                >
                                                    <Undo2 className="h-4 w-4" />
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
                    {filteredArchived.length} pedido(s) arquivado(s)
                </p>
            </div>
        </>
    )
}
