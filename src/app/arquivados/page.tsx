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
import { Search, Undo2, Eye } from 'lucide-react'
import { useState } from 'react'
import { PRIORITY_DESCRIPTIONS } from '@/types'

// Dados de demonstração
const mockArchived = [
    {
        id: '1',
        patient_name: 'Maria Eduarda Costa',
        data_pedido: '2025-11-15',
        archived_at: '2025-12-20',
        prioridade: 3,
        necessidade_sedacao: 'Sem',
        tipo_paciente: 'Ambulatorio',
        medico_solicitante: 'Dr. José Almeida',
    },
    {
        id: '2',
        patient_name: 'Pedro Henrique Lima',
        data_pedido: '2025-10-20',
        archived_at: '2025-11-30',
        prioridade: 2,
        necessidade_sedacao: 'Com',
        tipo_paciente: 'Internado',
        medico_solicitante: 'Dra. Ana Paula',
    },
]

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR')
}

export default function ArquivadosPage() {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredArchived = mockArchived.filter(order => {
        return searchTerm === '' ||
            order.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.medico_solicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.includes(searchTerm)
    })

    return (
        <>
            <AppHeader title="Pedidos Arquivados" />

            <div className="p-6 space-y-6">
                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nome, solicitante ou ID..."
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
                            {filteredArchived.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                                        Nenhum pedido arquivado encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredArchived.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium">{order.patient_name}</TableCell>
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
                                        <TableCell className="text-sm">{order.medico_solicitante}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" title="Ver Detalhes">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title="Desarquivar"
                                                    className="text-green-600 hover:text-green-700"
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
