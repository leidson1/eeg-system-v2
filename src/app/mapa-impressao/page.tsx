'use client'

import { AppHeader } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Printer, Calendar, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface ScheduledOrder {
    id: string
    scheduled_time: string | null
    tipo_paciente: string
    necessidade_sedacao: string
    observacoes_medicas: string | null
    patient: {
        nome_completo: string
        data_nascimento: string
        nome_responsavel: string
        municipio: string | null
        telefone_responsavel: string | null
        whatsapp: string | null
    } | null
}

function formatDateBR(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })
}

function getCurrentDateTime(): string {
    return new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

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
    return 'RN'
}

export default function MapaImpressaoPage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [orders, setOrders] = useState<ScheduledOrder[]>([])
    const [loading, setLoading] = useState(false)
    const [showPreview, setShowPreview] = useState(false)

    const formattedDate = selectedDate ? formatDateBR(selectedDate) : ''

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/pedidos?status=Agendado')
            if (!response.ok) throw new Error('Erro ao carregar')
            const data = await response.json()
            // Filter by selected date
            const filtered = data.filter((o: { scheduled_date: string }) => o.scheduled_date === selectedDate)
            setOrders(filtered)
            setShowPreview(true)
        } catch (error) {
            toast.error('Erro ao carregar agendamentos')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleGenerate = () => {
        fetchOrders()
    }

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
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value)
                                        setShowPreview(false)
                                    }}
                                    className="w-[200px]"
                                />
                            </div>
                            <Button onClick={handleGenerate} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Calendar className="mr-2 h-4 w-4" />
                                Gerar Mapa
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.print()}
                                disabled={!showPreview || orders.length === 0}
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Preview Area */}
                {showPreview && (
                    <div className="bg-white border rounded-lg p-8 print:p-4 print:border-0" id="print-area">
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

                        {orders.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                Nenhum paciente agendado para esta data.
                            </div>
                        ) : (
                            <>
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
                                            {orders.map((item, index) => (
                                                <tr key={item.id} className="hover:bg-slate-50">
                                                    <td className="border p-2 font-medium">
                                                        {item.scheduled_time || `Slot ${index + 1}`}
                                                    </td>
                                                    <td className="border p-2">
                                                        {item.patient?.nome_completo || 'N/D'}
                                                    </td>
                                                    <td className="border p-2 text-center whitespace-nowrap">
                                                        {item.patient?.data_nascimento
                                                            ? calculateAge(item.patient.data_nascimento)
                                                            : '-'}
                                                    </td>
                                                    <td className="border p-2 text-center">
                                                        {item.tipo_paciente === 'Internado' ? 'INT' : 'AMB'}
                                                    </td>
                                                    <td className="border p-2 text-center">
                                                        {item.necessidade_sedacao === 'Com' ? 'SIM' : 'NÃO'}
                                                    </td>
                                                    <td className="border p-2">
                                                        {item.patient?.nome_responsavel || '-'}
                                                    </td>
                                                    <td className="border p-2">
                                                        {item.patient?.municipio || '-'}
                                                    </td>
                                                    <td className="border p-2">
                                                        {item.patient?.whatsapp || item.patient?.telefone_responsavel || '-'}
                                                    </td>
                                                    <td className="border p-2 text-xs">
                                                        {item.observacoes_medicas || ''}
                                                    </td>
                                                    <td className="border p-2 text-center">( ) S ( ) N</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer */}
                                <div className="mt-6 flex justify-between text-xs text-slate-500 print:mt-4">
                                    <p>Legenda: INT=Internado, AMB=Ambulatório, S=Sim, N=Não</p>
                                    <p>Mapa gerado em: {getCurrentDateTime()}</p>
                                </div>
                            </>
                        )}
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
                    #print-area,
                    #print-area * {
                        visibility: visible;
                    }
                    #print-area {
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
