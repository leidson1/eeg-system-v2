'use client'

import { AppHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CalendarCheck, Plus, CheckCircle, XCircle, Printer } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

// Dados de demonstração
const mockSchedule = [
    {
        id: '1',
        patient_name: 'João Pedro Silva',
        scheduled_time: 'Slot 1',
        tipo_paciente: 'Ambulatorio',
        necessidade_sedacao: 'Sem',
        municipio: 'Palmas',
        status: 'Agendado',
    },
    {
        id: '2',
        patient_name: 'Ana Clara Santos',
        scheduled_time: 'Slot 2',
        tipo_paciente: 'Ambulatorio',
        necessidade_sedacao: 'Com',
        municipio: 'Araguaína',
        status: 'Agendado',
    },
    {
        id: '3',
        patient_name: 'Lucas Oliveira',
        scheduled_time: 'Encaixe',
        tipo_paciente: 'Internado',
        necessidade_sedacao: 'Sem',
        municipio: 'Gurupi',
        status: 'Agendado',
    },
]

export default function AgendamentosPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())

    const formattedDate = format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })

    return (
        <>
            <AppHeader title="Agendamentos" />

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Calendar */}
                    <Card className="lg:col-span-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Selecione a Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && setSelectedDate(date)}
                                className="rounded-md"
                            />
                        </CardContent>
                    </Card>

                    {/* Schedule */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-semibold capitalize">{formattedDate}</h2>
                                <p className="text-sm text-slate-500">
                                    {mockSchedule.length} paciente(s) agendado(s)
                                </p>
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

                        {/* Capacity Info */}
                        <div className="flex gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <CalendarCheck className="h-5 w-5 text-blue-600" />
                            <div className="text-sm">
                                <span className="font-medium text-blue-900">Capacidade do dia: </span>
                                <span className="text-blue-700">4 vagas eletivas | 3 ocupadas | 1 disponível</span>
                            </div>
                        </div>

                        {/* Table */}
                        <Card>
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
                                    {mockSchedule.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                                Nenhum paciente agendado para este dia.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        mockSchedule.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-slate-50">
                                                <TableCell className="font-medium">{item.scheduled_time}</TableCell>
                                                <TableCell>{item.patient_name}</TableCell>
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
                                                <TableCell>{item.municipio}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-green-600 hover:text-green-700"
                                                            title="Marcar como Concluído"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700"
                                                            title="Remover da Agenda"
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
                        </Card>
                    </div>
                </div>
            </div>
        </>
    )
}
