'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { FileText, Loader2, Calendar, AlertCircle } from 'lucide-react'

interface Order {
    id: string
    data_pedido: string
    status: string
    prioridade: number
    tipo_paciente: string
    necessidade_sedacao: string
    scheduled_date?: string
    medico_solicitante?: string
}

interface PatientOrdersModalProps {
    open: boolean
    onClose: () => void
    patientId: string
    patientName: string
}

const priorityColors: Record<number, string> = {
    1: 'bg-red-500 text-white',
    2: 'bg-orange-500 text-white',
    3: 'bg-yellow-500 text-white',
    4: 'bg-green-500 text-white',
}

const statusColors: Record<string, string> = {
    'Pendente': 'bg-gray-100 text-gray-700',
    'Agendado': 'bg-blue-100 text-blue-700',
    'Concluido': 'bg-green-100 text-green-700',
    'Cancelado': 'bg-red-100 text-red-700',
}

export function PatientOrdersModal({ open, onClose, patientId, patientName }: PatientOrdersModalProps) {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (open && patientId) {
            fetchOrders()
        }
    }, [open, patientId])

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/pedidos?patient_id=${patientId}`)
            if (!response.ok) throw new Error('Erro ao carregar')
            const data = await response.json()
            setOrders(data)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR')
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Pedidos do Paciente
                    </DialogTitle>
                    <DialogDescription>
                        {patientName}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                            <p>Nenhum pedido encontrado para este paciente.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {orders.map(order => (
                                <div
                                    key={order.id}
                                    className="p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge className={priorityColors[order.prioridade]}>
                                                    P{order.prioridade}
                                                </Badge>
                                                <Badge className={statusColors[order.status] || 'bg-gray-100'}>
                                                    {order.status}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {order.tipo_paciente === 'Internado' ? 'INT' : 'AMB'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-600">
                                                Pedido em: {formatDate(order.data_pedido)}
                                            </p>
                                            {order.scheduled_date && (
                                                <p className="text-sm text-blue-600 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Agendado: {formatDate(order.scheduled_date)}
                                                </p>
                                            )}
                                            {order.medico_solicitante && (
                                                <p className="text-xs text-slate-500">
                                                    Solicitante: {order.medico_solicitante}
                                                </p>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={`/pedidos/${order.id}/editar`}>Ver</a>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                    <p className="text-sm text-slate-500">
                        {orders.length} pedido(s) encontrado(s)
                    </p>
                    <Button variant="outline" onClick={onClose}>
                        Fechar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
