'use client'

import { AppHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Printer, Calendar } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Dados de demonstração
const mockSchedule = [
    {
        slot: 'Slot 1',
        patient_name: 'João Pedro Silva',
        age: '5 anos',
        tipo: 'AMB',
        sedacao: 'NÃO',
        responsavel: 'Maria Silva',
        procedencia: 'Palmas',
        contato: '(63) 99999-1111',
        obs: '',
    },
    {
        slot: 'Slot 2',
        patient_name: 'Ana Clara Santos',
        age: '6 anos',
        tipo: 'AMB',
        sedacao: 'SIM',
        responsavel: 'Carlos Santos',
        procedencia: 'Araguaína',
        contato: '(63) 98888-2222',
        obs: 'Paciente ansiosa',
    },
    {
        slot: 'Encaixe',
        patient_name: 'Lucas Oliveira',
        age: '4 anos',
        tipo: 'INT',
        sedacao: 'NÃO',
        responsavel: 'Fernanda Oliveira',
        procedencia: 'Gurupi',
        contato: '(63) 97777-3333',
        obs: 'UTI Pediátrica',
    },
]

export default function MapaImpressaoPage() {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [showPreview, setShowPreview] = useState(false)

    const formattedDate = selectedDate
        ? format(new Date(selectedDate + 'T00:00:00'), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        : ''

    return (
        <>
            <AppHeader title="Mapa para Impressão" />

            <div className="p-6 space-y-6">
                {/* Controls */}
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
                            <Button onClick={() => setShowPreview(true)}>
                                <Calendar className="mr-2 h-4 w-4" />
                                Gerar Mapa
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.print()}
                                disabled={!showPreview}
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Preview Area */}
                {showPreview && (
                    <div className="bg-white border rounded-lg p-8 print:p-4 print:border-0">
                        {/* Print Header */}
                        <div className="text-center mb-6 print:mb-4">
                            <p className="text-sm text-slate-600 print:text-xs">Hospital Geral de Palmas - EEG Pediátrico</p>
                            <h1 className="text-xl font-bold mt-2 print:text-lg">
                                MAPA DE AGENDAMENTOS
                            </h1>
                            <p className="text-lg font-medium capitalize mt-1 print:text-base">
                                {formattedDate}
                            </p>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border text-sm">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="border p-2 text-left">Slot</th>
                                        <th className="border p-2 text-left">Paciente</th>
                                        <th className="border p-2 text-center">Idade</th>
                                        <th className="border p-2 text-center">Tipo</th>
                                        <th className="border p-2 text-center">Sedação</th>
                                        <th className="border p-2 text-left">Responsável</th>
                                        <th className="border p-2 text-left">Procedência</th>
                                        <th className="border p-2 text-left">Contato</th>
                                        <th className="border p-2 text-left">Obs.</th>
                                        <th className="border p-2 text-center">Orient.?</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockSchedule.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50">
                                            <td className="border p-2 font-medium">{item.slot}</td>
                                            <td className="border p-2">{item.patient_name}</td>
                                            <td className="border p-2 text-center whitespace-nowrap">{item.age}</td>
                                            <td className="border p-2 text-center">{item.tipo}</td>
                                            <td className="border p-2 text-center">{item.sedacao}</td>
                                            <td className="border p-2">{item.responsavel}</td>
                                            <td className="border p-2">{item.procedencia}</td>
                                            <td className="border p-2">{item.contato}</td>
                                            <td className="border p-2 text-xs">{item.obs}</td>
                                            <td className="border p-2 text-center">( ) S ( ) N</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 flex justify-between text-xs text-slate-500 print:mt-4">
                            <p>Legenda: INT=Internado, AMB=Ambulatório, S=Sim, N=Não</p>
                            <p>Mapa gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                        </div>
                    </div>
                )}

                {!showPreview && (
                    <Card>
                        <CardContent className="py-12 text-center text-slate-500">
                            <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p>Selecione uma data e clique em &quot;Gerar Mapa&quot; para visualizar.</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Print Styles */}
            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:p-4,
          .print\\:p-4 * {
            visibility: visible;
          }
          .print\\:p-4 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
        </>
    )
}
