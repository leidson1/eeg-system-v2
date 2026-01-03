'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { FileText, Calendar, User, MapPin, Stethoscope, Clock, Phone, Edit } from 'lucide-react'
import Link from 'next/link'

interface OrderDetailsModalProps {
    open: boolean
    onClose: () => void
    order: {
        id: string
        data_pedido: string
        status: string
        prioridade: number
        tipo_paciente: string
        necessidade_sedacao: string
        scheduled_date?: string | null
        scheduled_time?: string | null
        medico_solicitante?: string | null
        observacoes?: string | null
        patient?: {
            nome_completo: string
            municipio?: string | null
            whatsapp?: string | null
            nome_responsavel?: string | null
        } | null
    } | null
}

const priorityLabels: Record<number, string> = {
    1: 'P1 - Muito Urgente',
    2: 'P2 - Urgente',
    3: 'P3 - Regular',
    4: 'P4 - Eletivo',
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

export function OrderDetailsModal({ open, onClose, order }: OrderDetailsModalProps) {
    if (!order) return null

    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR')
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Detalhes do Pedido
                    </DialogTitle>
                    <DialogDescription>
                        Visualização rápida do pedido
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Status e Prioridade */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={priorityColors[order.prioridade]}>
                            {priorityLabels[order.prioridade]}
                        </Badge>
                        <Badge className={statusColors[order.status] || 'bg-gray-100'}>
                            {order.status}
                        </Badge>
                        <Badge variant="outline">
                            {order.tipo_paciente === 'Internado' ? '🏥 Internado' : '🚶 Ambulatório'}
                        </Badge>
                        {order.necessidade_sedacao === 'Com' && (
                            <Badge variant="outline">💊 Com Sedação</Badge>
                        )}
                    </div>

                    {/* Paciente */}
                    <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 font-medium">
                            <User className="h-4 w-4 text-slate-500" />
                            {order.patient?.nome_completo || 'Paciente não identificado'}
                        </div>
                        {order.patient?.nome_responsavel && (
                            <p className="text-sm text-slate-600 ml-6">
                                Responsável: {order.patient.nome_responsavel}
                            </p>
                        )}
                        {order.patient?.municipio && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 ml-6">
                                <MapPin className="h-3 w-3" />
                                {order.patient.municipio}
                            </div>
                        )}
                        {order.patient?.whatsapp && (
                            <div className="flex items-center gap-2 text-sm ml-6">
                                <Phone className="h-3 w-3 text-green-500" />
                                <a
                                    href={`https://wa.me/55${order.patient.whatsapp.replace(/\D/g, '')}`}
                                    target="_blank"
                                    className="text-green-600 hover:underline"
                                >
                                    {order.patient.whatsapp}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Datas */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 mb-1">Data do Pedido</p>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <span className="font-medium">{formatDate(order.data_pedido)}</span>
                            </div>
                        </div>
                        {order.scheduled_date && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-xs text-blue-500 mb-1">Agendado para</p>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-400" />
                                    <span className="font-medium text-blue-700">
                                        {formatDate(order.scheduled_date)}
                                        {order.scheduled_time && ` às ${order.scheduled_time}`}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Médico Solicitante */}
                    {order.medico_solicitante && (
                        <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 mb-1">Médico Solicitante</p>
                            <div className="flex items-center gap-2">
                                <Stethoscope className="h-4 w-4 text-slate-400" />
                                <span className="font-medium">{order.medico_solicitante}</span>
                            </div>
                        </div>
                    )}

                    {/* Observações */}
                    {order.observacoes && (
                        <div className="p-3 bg-amber-50 rounded-lg">
                            <p className="text-xs text-amber-600 mb-1">Observações</p>
                            <p className="text-sm">{order.observacoes}</p>
                        </div>
                    )}
                </div>

                {/* Ações */}
                <div className="flex justify-between pt-2 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Fechar
                    </Button>
                    <Button asChild>
                        <Link href={`/pedidos/${order.id}/editar`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Pedido
                        </Link>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
