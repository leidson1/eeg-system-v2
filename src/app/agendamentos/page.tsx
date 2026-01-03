'use client'

import { AppHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { CalendarCheck, Plus, CheckCircle, XCircle, Printer, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

interface ScheduledOrder {
    id: string
    scheduled_time: string | null
    tipo_paciente: string
    necessidade_sedacao: string
    patient: {
        nome_completo: string
        municipio: string | null
    } | null
}

export default function AgendamentosPage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [orders, setOrders] = useState<ScheduledOrder[]>([])
    const [loading, setLoading] = useState(false)

    const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long'
    })

    useEffect(() => {
        fetchOrders()
    }, [selectedDate])

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/pedidos?status=Agendado`)
            if (!response.ok) throw new Error('Erro ao carregar')
            const data = await response.json()
            // Filter by selected date
            const filtered = data.filter((o: { scheduled_date: string }) => o.scheduled_date === selectedDate)
            setOrders(filtered)
        } catch {
            toast.error('Erro ao carregar agendamentos')
        } finally {
            setLoading(false)
        }
    }

    const handleComplete = async (id: string) => {
        if (!confirm('Marcar como concluído?')) return
        try {
            await fetch(`/api/pedidos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Concluido', data_conclusao: new Date().toISOString() })
            })
            toast.success('Exame marcado como concluído!')
            fetchOrders()
        } catch {
            toast.error('Erro ao marcar como concluído')
        }
    }

    const handleRemove = async (id: string) => {
        if (!confirm('Remover da agenda? O pedido voltará para Pendente.')) return
        try {
            await fetch(`/api/pedidos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Pendente', scheduled_date: null, scheduled_time: null })
            })
            toast.success('Pedido removido da agenda')
            fetchOrders()
        } catch {
            toast.error('Erro ao remover da agenda')
        }
    }

    return (
        <>
            <AppHeader title="Agendamentos" />

            <div className="p-6 space-y-6">
                {/* Date Selector */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="space-y-2">
                                <Label htmlFor="date">Selecione a Data</Label>
                                <Input
                                    type="date"
                                    id="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-[200px]"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Preencher Eletiva
                                </Button>
                                <Button variant="outline">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Adicionar Internado
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href="/mapa-impressao">
                                        <Printer className="mr-2 h-4 w-4" />
                                        Imprimir
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-semibold capitalize">{formattedDate}</h2>
                        <p className="text-sm text-slate-500">
                            {orders.length} paciente(s) agendado(s)
                        </p>
                    </div>
                </div>

                {/* Capacity Info */}
                <div className="flex gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <CalendarCheck className="h-5 w-5 text-blue-600" />
                    <div className="text-sm">
                        <span className="font-medium text-blue-900">Agenda do dia: </span>
                        <span className="text-blue-700">{orders.length} paciente(s) agendado(s)</span>
                    </div>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Pacientes Agendados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead>Slot/Ordem</TableHead>
                                    <TableHead>Paciente</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Sedação</TableHead>
                                    <TableHead>Município</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                                        </TableCell>
                                    </TableRow>
                                ) : orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                            Nenhum paciente agendado para este dia.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map((item, idx) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50">
                                            <TableCell className="font-medium">Slot {idx + 1}</TableCell>
                                            <TableCell>{item.patient?.nome_completo || 'N/D'}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.tipo_paciente === 'Internado' ? 'default' : 'outline'}>
                                                    {item.tipo_paciente === 'Internado' ? 'INT' : 'AMB'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={item.necessidade_sedacao === 'Com' ? 'default' : 'secondary'}>
                                                    {item.necessidade_sedacao}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{item.patient?.municipio || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-green-600 hover:text-green-700"
                                                        title="Marcar como Concluído"
                                                        onClick={() => handleComplete(item.id)}
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                        title="Remover da Agenda"
                                                        onClick={() => handleRemove(item.id)}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
