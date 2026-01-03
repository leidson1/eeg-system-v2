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
import { CIDADES_TOCANTINS } from '@/types'

interface PatientData {
    id: string
    nome_completo: string
    data_nascimento: string
    cartao_sus: string | null
    nome_responsavel: string
    telefone_responsavel: string | null
    telefone_secundario: string | null
    email_responsavel: string | null
    municipio: string | null
    observacoes: string | null
}

export default function EditarPacientePage() {
    const router = useRouter()
    const params = useParams()
    const patientId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<PatientData | null>(null)

    useEffect(() => {
        if (patientId) {
            fetchPatient()
        }
    }, [patientId])

    const fetchPatient = async () => {
        try {
            const response = await fetch(`/api/pacientes/${patientId}`)
            if (!response.ok) throw new Error('Paciente não encontrado')
            const data = await response.json()
            setFormData(data)
        } catch (error) {
            toast.error('Erro ao carregar paciente')
            console.error(error)
            router.push('/pacientes')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData) return

        setSaving(true)
        try {
            const response = await fetch(`/api/pacientes/${patientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Erro ao salvar')

            toast.success('Paciente atualizado com sucesso!')
            router.push('/pacientes')
        } catch (error) {
            toast.error('Erro ao salvar paciente')
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    const updateField = (field: keyof PatientData, value: string) => {
        if (!formData) return
        setFormData({ ...formData, [field]: value })
    }

    if (loading) {
        return (
            <>
                <AppHeader title="Editar Paciente" />
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            </>
        )
    }

    if (!formData) return null

    return (
        <>
            <AppHeader title="Editar Paciente" />

            <div className="p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-6">
                        <Button variant="ghost" asChild>
                            <Link href="/pacientes">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar
                            </Link>
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Dados do Paciente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Nome Completo */}
                                <div className="space-y-2">
                                    <Label htmlFor="nome_completo">Nome Completo *</Label>
                                    <Input
                                        id="nome_completo"
                                        value={formData.nome_completo}
                                        onChange={(e) => updateField('nome_completo', e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Data Nascimento */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                                        <Input
                                            id="data_nascimento"
                                            type="date"
                                            value={formData.data_nascimento}
                                            onChange={(e) => updateField('data_nascimento', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cartao_sus">Cartão SUS</Label>
                                        <Input
                                            id="cartao_sus"
                                            value={formData.cartao_sus || ''}
                                            onChange={(e) => updateField('cartao_sus', e.target.value)}
                                            placeholder="Número do CNS"
                                        />
                                    </div>
                                </div>

                                {/* Responsável */}
                                <div className="space-y-2">
                                    <Label htmlFor="nome_responsavel">Nome do Responsável *</Label>
                                    <Input
                                        id="nome_responsavel"
                                        value={formData.nome_responsavel}
                                        onChange={(e) => updateField('nome_responsavel', e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Contatos */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="telefone_responsavel">Telefone Principal</Label>
                                        <Input
                                            id="telefone_responsavel"
                                            value={formData.telefone_responsavel || ''}
                                            onChange={(e) => updateField('telefone_responsavel', e.target.value)}
                                            placeholder="(63) 99999-9999"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="telefone_secundario">Telefone Secundário</Label>
                                        <Input
                                            id="telefone_secundario"
                                            value={formData.telefone_secundario || ''}
                                            onChange={(e) => updateField('telefone_secundario', e.target.value)}
                                            placeholder="(63) 99999-9999"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email_responsavel">E-mail</Label>
                                    <Input
                                        id="email_responsavel"
                                        type="email"
                                        value={formData.email_responsavel || ''}
                                        onChange={(e) => updateField('email_responsavel', e.target.value)}
                                        placeholder="email@exemplo.com"
                                    />
                                </div>

                                {/* Município */}
                                <div className="space-y-2">
                                    <Label htmlFor="municipio">Município *</Label>
                                    <Select
                                        value={formData.municipio || ''}
                                        onValueChange={(value) => updateField('municipio', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o município" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CIDADES_TOCANTINS.map((city) => (
                                                <SelectItem key={city} value={city}>
                                                    {city}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Observações */}
                                <div className="space-y-2">
                                    <Label htmlFor="observacoes">Observações</Label>
                                    <Textarea
                                        id="observacoes"
                                        value={formData.observacoes || ''}
                                        onChange={(e) => updateField('observacoes', e.target.value)}
                                        placeholder="Observações gerais sobre o paciente"
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
                                        <Link href="/pacientes">Cancelar</Link>
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
