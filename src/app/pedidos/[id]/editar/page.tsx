'use client'

import { AppHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { PRIORITY_DESCRIPTIONS } from '@/types'

interface OrderData {
    id: string
    patient_id: string
    data_pedido: string
    tipo_paciente: string
    medico_solicitante: string | null
    medico_executor: string | null
    necessidade_sedacao: string
    prioridade: number
    status: string
    observacoes_medicas: string | null
    scheduled_date: string | null
    scheduled_time: string | null
    patient?: {
        nome_completo: string
    }
}

export default function EditarPedidoPage() {
    const router = useRouter()
    const params = useParams()
    const orderId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<OrderData | null>(null)

    useEffect(() => {
        if (orderId) {
            fetchOrder()
        }
    }, [orderId])

    const fetchOrder = async () => {
        try {
            const response = await fetch(`/api/pedidos/${orderId}`)
            if (!response.ok) throw new Error('Pedido não encontrado')
            const data = await response.json()
            setFormData(data)
        } catch (error) {
            toast.error('Erro ao carregar pedido')
            console.error(error)
            router.push('/pedidos')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData) return

        setSaving(true)
        try {
            const response = await fetch(`/api/pedidos/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data_pedido: formData.data_pedido,
                    tipo_paciente: formData.tipo_paciente,
                    medico_solicitante: formData.medico_solicitante,
                    medico_executor: formData.medico_executor,
                    necessidade_sedacao: formData.necessidade_sedacao,
                    prioridade: formData.prioridade,
                    status: formData.status,
                    observacoes_medicas: formData.observacoes_medicas,
                    scheduled_date: formData.scheduled_date,
                    scheduled_time: formData.scheduled_time,
                }),
            })

            if (!response.ok) throw new Error('Erro ao salvar')

            toast.success('Pedido atualizado com sucesso!')
            router.push('/pedidos')
        } catch (error) {
            toast.error('Erro ao salvar pedido')
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    const updateField = (field: keyof OrderData, value: string | number) => {
        if (!formData) return
        setFormData({ ...formData, [field]: value })
    }

    if (loading) {
        return (
            <>
                <AppHeader title="Editar Pedido" />
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            </>
        )
    }

    if (!formData) return null

    return (
        <>
            <AppHeader title="Editar Pedido" />

            <div className="p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-6">
                        <Button variant="ghost" asChild>
                            <Link href="/pedidos">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar
                            </Link>
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Pedido - {formData.patient?.nome_completo || 'Paciente'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Data Pedido e Status */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="data_pedido">Data do Pedido</Label>
                                        <Input
                                            id="data_pedido"
                                            type="date"
                                            value={formData.data_pedido || ''}
                                            onChange={(e) => updateField('data_pedido', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value) => updateField('status', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Pendente">Pendente</SelectItem>
                                                <SelectItem value="Agendado">Agendado</SelectItem>
                                                <SelectItem value="Concluido">Concluído</SelectItem>
                                                <SelectItem value="Cancelado">Cancelado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Prioridade e Tipo */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="prioridade">Prioridade</Label>
                                        <Select
                                            value={formData.prioridade.toString()}
                                            onValueChange={(value) => updateField('prioridade', parseInt(value))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">P1 - {PRIORITY_DESCRIPTIONS[1]}</SelectItem>
                                                <SelectItem value="2">P2 - {PRIORITY_DESCRIPTIONS[2]}</SelectItem>
                                                <SelectItem value="3">P3 - {PRIORITY_DESCRIPTIONS[3]}</SelectItem>
                                                <SelectItem value="4">P4 - {PRIORITY_DESCRIPTIONS[4]}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tipo_paciente">Tipo</Label>
                                        <Select
                                            value={formData.tipo_paciente}
                                            onValueChange={(value) => updateField('tipo_paciente', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Ambulatorio">Ambulatório</SelectItem>
                                                <SelectItem value="Internado">Internado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Sedação */}
                                <div className="space-y-2">
                                    <Label htmlFor="necessidade_sedacao">Necessidade de Sedação</Label>
                                    <Select
                                        value={formData.necessidade_sedacao}
                                        onValueChange={(value) => updateField('necessidade_sedacao', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Sem">Sem Sedação</SelectItem>
                                            <SelectItem value="Com">Com Sedação</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Médicos */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="medico_solicitante">Médico Solicitante</Label>
                                        <Input
                                            id="medico_solicitante"
                                            value={formData.medico_solicitante || ''}
                                            onChange={(e) => updateField('medico_solicitante', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="medico_executor">Médico Executor</Label>
                                        <Input
                                            id="medico_executor"
                                            value={formData.medico_executor || ''}
                                            onChange={(e) => updateField('medico_executor', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Agendamento */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="scheduled_date">Data Agendada</Label>
                                        <Input
                                            id="scheduled_date"
                                            type="date"
                                            value={formData.scheduled_date || ''}
                                            onChange={(e) => updateField('scheduled_date', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="scheduled_time">Horário</Label>
                                        <Input
                                            id="scheduled_time"
                                            value={formData.scheduled_time || ''}
                                            onChange={(e) => updateField('scheduled_time', e.target.value)}
                                            placeholder="Ex: Slot 1, 08:00"
                                        />
                                    </div>
                                </div>

                                {/* Observações */}
                                <div className="space-y-2">
                                    <Label htmlFor="observacoes_medicas">Observações Médicas</Label>
                                    <Textarea
                                        id="observacoes_medicas"
                                        value={formData.observacoes_medicas || ''}
                                        onChange={(e) => updateField('observacoes_medicas', e.target.value)}
                                        placeholder="Observações sobre o pedido"
                                        rows={4}
                                    />
                                </div>

                                {/* Submit */}
                                <div className="flex gap-4 pt-4">
                                    <Button type="submit" disabled={saving} className="flex-1">
                                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar Alterações
                                    </Button>
                                    <Button type="button" variant="outline" asChild>
                                        <Link href="/pedidos">Cancelar</Link>
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}
