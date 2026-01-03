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
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { PRIORITY_DESCRIPTIONS, type Patient } from '@/types'

export default function NovoPedidoPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [patients, setPatients] = useState<Patient[]>([])
    const [formData, setFormData] = useState({
        patient_id: '',
        prioridade: '3',
        tipo_paciente: 'Ambulatorio',
        necessidade_sedacao: 'Sem',
        medico_solicitante: '',
        observacoes_medicas: '',
        data_pedido: new Date().toISOString().split('T')[0],
    })

    useEffect(() => {
        // Load patients for dropdown
        fetch('/api/pacientes')
            .then(res => res.json())
            .then(data => setPatients(data))
            .catch(err => console.error('Error loading patients:', err))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.patient_id) {
            toast.error('Selecione um paciente')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient_id: formData.patient_id,
                    prioridade: parseInt(formData.prioridade),
                    tipo_paciente: formData.tipo_paciente,
                    necessidade_sedacao: formData.necessidade_sedacao,
                    medico_solicitante: formData.medico_solicitante || null,
                    observacoes_medicas: formData.observacoes_medicas || null,
                    data_pedido: formData.data_pedido,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erro ao criar pedido')
            }

            toast.success('Pedido criado com sucesso!')
            router.push('/pedidos')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao criar pedido')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <AppHeader title="Novo Pedido" />

            <div className="p-6">
                <div className="mb-6">
                    <Button variant="ghost" asChild>
                        <Link href="/pedidos">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Link>
                    </Button>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Criar Novo Pedido de Exame</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="paciente">Paciente *</Label>
                                    <Select
                                        value={formData.patient_id}
                                        onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o paciente..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {patients.map((patient) => (
                                                <SelectItem key={patient.id} value={patient.id}>
                                                    {patient.nome_completo}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-slate-500">
                                        <Link href="/pacientes/novo" className="text-blue-600 hover:underline">
                                            Ou cadastre um novo paciente
                                        </Link>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="data">Data do Pedido *</Label>
                                    <Input
                                        id="data"
                                        type="date"
                                        value={formData.data_pedido}
                                        onChange={(e) => setFormData({ ...formData, data_pedido: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="prioridade">Prioridade *</Label>
                                    <Select
                                        value={formData.prioridade}
                                        onValueChange={(value) => setFormData({ ...formData, prioridade: value })}
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
                                    <Label htmlFor="tipo">Tipo de Paciente</Label>
                                    <Select
                                        value={formData.tipo_paciente}
                                        onValueChange={(value) => setFormData({ ...formData, tipo_paciente: value })}
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

                                <div className="space-y-2">
                                    <Label htmlFor="sedacao">Necessidade de Sedação</Label>
                                    <Select
                                        value={formData.necessidade_sedacao}
                                        onValueChange={(value) => setFormData({ ...formData, necessidade_sedacao: value })}
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

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="solicitante">Médico Solicitante</Label>
                                    <Input
                                        id="solicitante"
                                        value={formData.medico_solicitante}
                                        onChange={(e) => setFormData({ ...formData, medico_solicitante: e.target.value })}
                                        placeholder="Nome do médico que solicitou o exame"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="observacoes">Observações Médicas</Label>
                                    <Textarea
                                        id="observacoes"
                                        rows={3}
                                        value={formData.observacoes_medicas}
                                        onChange={(e) => setFormData({ ...formData, observacoes_medicas: e.target.value })}
                                        placeholder="Indicação clínica, histórico relevante, etc."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Criar Pedido
                                </Button>
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
