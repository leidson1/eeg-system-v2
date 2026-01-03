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
import { Plus, Search, Edit, History, UserX, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { CIDADES_TOCANTINS, type Patient } from '@/types'

function calculateAge(dob: string): string {
    const birthDate = new Date(dob + 'T00:00:00')
    const today = new Date()
    let years = today.getFullYear() - birthDate.getFullYear()
    let months = today.getMonth() - birthDate.getMonth()

    if (months < 0) {
        years--
        months += 12
    }

    if (years > 1) return `${years} anos`
    if (years === 1) return `1 ano${months > 0 ? ` e ${months}m` : ''}`
    if (months > 1) return `${months} meses`
    if (months === 1) return '1 mês'
    return 'Recém-nascido'
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR')
}

export default function PacientesPage() {
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [cityFilter, setCityFilter] = useState('all')

    useEffect(() => {
        fetchPatients()
    }, [])

    const fetchPatients = async () => {
        try {
            const response = await fetch('/api/pacientes')
            if (!response.ok) throw new Error('Erro ao carregar pacientes')
            const data = await response.json()
            setPatients(data)
        } catch (error) {
            toast.error('Erro ao carregar pacientes')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleInactivate = async (id: string, name: string) => {
        if (!confirm(`Deseja inativar o paciente "${name}"?`)) return

        try {
            const response = await fetch(`/api/pacientes/${id}`, { method: 'DELETE' })
            if (!response.ok) throw new Error('Erro ao inativar')
            toast.success('Paciente inativado')
            fetchPatients()
        } catch {
            toast.error('Erro ao inativar paciente')
        }
    }

    const filteredPatients = patients.filter(patient => {
        const searchLower = searchTerm.toLowerCase()

        // Busca em todos os campos relevantes
        const matchesSearch = searchTerm === '' ||
            patient.nome_completo.toLowerCase().includes(searchLower) ||
            patient.nome_responsavel.toLowerCase().includes(searchLower) ||
            (patient.whatsapp || '').toLowerCase().includes(searchLower) ||
            (patient.email || '').toLowerCase().includes(searchLower) ||
            (patient.cartao_sus || '').toLowerCase().includes(searchLower) ||
            (patient.municipio || '').toLowerCase().includes(searchLower) ||
            (patient.telefones || []).some(t => t.toLowerCase().includes(searchLower)) ||
            (patient.observacoes || '').toLowerCase().includes(searchLower)

        const matchesCity = cityFilter === 'all' || patient.municipio === cityFilter

        return matchesSearch && matchesCity
    })

    return (
        <>
            <AppHeader title="Gerenciamento de Pacientes" />

            <div className="p-6 space-y-6">
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex flex-1 gap-3 max-w-xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por nome, telefone, município, SUS..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={cityFilter} onValueChange={setCityFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Município" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos Municípios</SelectItem>
                                {CIDADES_TOCANTINS.map(city => (
                                    <SelectItem key={city} value={city}>{city}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <Link href="/pacientes/novo">
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Paciente
                        </Link>
                    </Button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg border shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead>Nome Completo</TableHead>
                                <TableHead>Data Nasc.</TableHead>
                                <TableHead>Idade</TableHead>
                                <TableHead>Responsável</TableHead>
                                <TableHead>Contato</TableHead>
                                <TableHead>Município</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredPatients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                        {patients.length === 0
                                            ? 'Nenhum paciente cadastrado ainda.'
                                            : 'Nenhum paciente encontrado com os filtros atuais.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPatients.map((patient) => (
                                    <TableRow key={patient.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium">{patient.nome_completo}</TableCell>
                                        <TableCell>{formatDate(patient.data_nascimento)}</TableCell>
                                        <TableCell>{calculateAge(patient.data_nascimento)}</TableCell>
                                        <TableCell>{patient.nome_responsavel}</TableCell>
                                        <TableCell>{patient.whatsapp || (patient.telefones?.[0]) || 'N/D'}</TableCell>
                                        <TableCell>
                                            {patient.municipio && <Badge variant="outline">{patient.municipio}</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" title="Editar" asChild>
                                                    <Link href={`/pacientes/${patient.id}/editar`}>
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title="Histórico"
                                                    onClick={() => toast.info(`Histórico de ${patient.nome_completo} - Em desenvolvimento`)}
                                                >
                                                    <History className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title="Inativar"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => handleInactivate(patient.id, patient.nome_completo)}
                                                >
                                                    <UserX className="h-4 w-4" />
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
                    {filteredPatients.length} paciente(s) encontrado(s)
                </p>
            </div>
        </>
    )
}
