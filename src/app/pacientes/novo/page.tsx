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
import { useState } from 'react'
import { toast } from 'sonner'
import { CIDADES_TOCANTINS } from '@/types'

export default function NovoPacientePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        nome_completo: '',
        data_nascimento: '',
        cartao_sus: '',
        nome_responsavel: '',
        whatsapp: '',
        telefone2: '',
        email: '',
        municipio: '',
        observacoes: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const telefones = [formData.whatsapp, formData.telefone2].filter(Boolean)

            const response = await fetch('/api/pacientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome_completo: formData.nome_completo,
                    data_nascimento: formData.data_nascimento,
                    cartao_sus: formData.cartao_sus || null,
                    nome_responsavel: formData.nome_responsavel,
                    telefones: telefones,
                    whatsapp: formData.whatsapp || null,
                    email: formData.email || null,
                    municipio: formData.municipio || null,
                    observacoes: formData.observacoes || null,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erro ao criar paciente')
            }

            toast.success('Paciente cadastrado com sucesso!')
            router.push('/pacientes')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao cadastrar paciente')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <AppHeader title="Novo Paciente" />

            <div className="p-6">
                <div className="mb-6">
                    <Button variant="ghost" asChild>
                        <Link href="/pacientes">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Link>
                    </Button>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Cadastrar Novo Paciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="nome">Nome Completo *</Label>
                                    <Input
                                        id="nome"
                                        value={formData.nome_completo}
                                        onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nascimento">Data de Nascimento *</Label>
                                    <Input
                                        id="nascimento"
                                        type="date"
                                        value={formData.data_nascimento}
                                        onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sus">Cartão SUS</Label>
                                    <Input
                                        id="sus"
                                        value={formData.cartao_sus}
                                        onChange={(e) => setFormData({ ...formData, cartao_sus: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="responsavel">Nome do Responsável *</Label>
                                    <Input
                                        id="responsavel"
                                        value={formData.nome_responsavel}
                                        onChange={(e) => setFormData({ ...formData, nome_responsavel: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp">WhatsApp</Label>
                                    <Input
                                        id="whatsapp"
                                        placeholder="(63) 99999-9999"
                                        value={formData.whatsapp}
                                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="telefone2">Telefone Secundário</Label>
                                    <Input
                                        id="telefone2"
                                        placeholder="(63) 99999-9999"
                                        value={formData.telefone2}
                                        onChange={(e) => setFormData({ ...formData, telefone2: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">E-mail</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="municipio">Município</Label>
                                    <Select
                                        value={formData.municipio}
                                        onValueChange={(value) => setFormData({ ...formData, municipio: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
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

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="observacoes">Observações</Label>
                                    <Textarea
                                        id="observacoes"
                                        rows={3}
                                        value={formData.observacoes}
                                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Paciente
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
