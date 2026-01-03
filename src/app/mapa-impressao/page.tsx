'use client'

import { AppHeader } from '@/components/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Printer, Calendar, Loader2, FileText, Eye } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ScheduledOrder {
    id: string
    scheduled_time: string | null
    tipo_paciente: string
    necessidade_sedacao: string
    observacoes_medicas: string | null
    prioridade: number
    patient: {
        nome_completo: string
        data_nascimento: string
        nome_responsavel: string
        municipio: string | null
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

function formatShortDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR')
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
    const [isPrinting, setIsPrinting] = useState(false)

    const formattedDate = selectedDate ? formatDateBR(selectedDate) : ''
    const shortDate = selectedDate ? formatShortDate(selectedDate) : ''

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/pedidos?status=Agendado')
            if (!response.ok) throw new Error('Erro ao carregar')
            const data = await response.json()
            // Filter by selected date and sort by time
            const filtered = data
                .filter((o: { scheduled_date: string }) => o.scheduled_date === selectedDate)
                .sort((a: ScheduledOrder, b: ScheduledOrder) =>
                    (a.scheduled_time || '').localeCompare(b.scheduled_time || '')
                )
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

    const handlePrint = () => {
        setIsPrinting(true)
        setTimeout(() => {
            window.print()
            setIsPrinting(false)
        }, 100)
    }

    // Print Layout - Clean and professional
    if (isPrinting) {
        return (
            <div className="p-4 bg-white text-black min-h-screen print:p-2">
                {/* Header */}
                <div className="text-center border-b-2 border-black pb-3 mb-4">
                    <h1 className="text-lg font-bold">HOSPITAL GERAL DE PALMAS</h1>
                    <p className="text-sm">Setor de Eletroencefalograma Pediátrico</p>
                    <h2 className="text-base font-bold mt-2">MAPA DE AGENDAMENTOS - {shortDate}</h2>
                    <p className="text-sm capitalize">{formattedDate}</p>
                </div>

                {/* Summary */}
                <div className="flex justify-between text-xs mb-3 px-2">
                    <span><strong>Total:</strong> {orders.length} paciente(s)</span>
                    <span><strong>INT:</strong> {orders.filter(o => o.tipo_paciente === 'Internado').length}</span>
                    <span><strong>AMB:</strong> {orders.filter(o => o.tipo_paciente !== 'Internado').length}</span>
                    <span><strong>Com Sedação:</strong> {orders.filter(o => o.necessidade_sedacao === 'Com').length}</span>
                </div>

                {/* Table */}
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-black p-1 text-left w-12">Hora</th>
                            <th className="border border-black p-1 text-left">Paciente</th>
                            <th className="border border-black p-1 text-center w-16">Idade</th>
                            <th className="border border-black p-1 text-center w-12">Tipo</th>
                            <th className="border border-black p-1 text-center w-12">Sed.</th>
                            <th className="border border-black p-1 text-left">Responsável</th>
                            <th className="border border-black p-1 text-left w-20">Município</th>
                            <th className="border border-black p-1 text-left w-24">Contato</th>
                            <th className="border border-black p-1 text-center w-10">OK</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((item, index) => (
                            <tr key={item.id} className={index % 2 === 0 ? '' : 'bg-gray-100'}>
                                <td className="border border-black p-1 font-mono font-semibold">
                                    {item.scheduled_time || '--:--'}
                                </td>
                                <td className="border border-black p-1 font-medium">
                                    {item.patient?.nome_completo || 'N/D'}
                                </td>
                                <td className="border border-black p-1 text-center">
                                    {item.patient?.data_nascimento ? calculateAge(item.patient.data_nascimento) : '-'}
                                </td>
                                <td className="border border-black p-1 text-center font-semibold">
                                    {item.tipo_paciente === 'Internado' ? 'INT' : 'AMB'}
                                </td>
                                <td className="border border-black p-1 text-center">
                                    {item.necessidade_sedacao === 'Com' ? '✓' : '—'}
                                </td>
                                <td className="border border-black p-1">
                                    {item.patient?.nome_responsavel || '-'}
                                </td>
                                <td className="border border-black p-1 text-xs">
                                    {item.patient?.municipio || '-'}
                                </td>
                                <td className="border border-black p-1 font-mono text-xs">
                                    {item.patient?.whatsapp || '-'}
                                </td>
                                <td className="border border-black p-1 text-center">☐</td>
                            </tr>
                        ))}
                        {/* Empty rows for notes */}
                        {orders.length < 8 && Array.from({ length: 8 - orders.length }).map((_, i) => (
                            <tr key={`empty-${i}`}>
                                <td className="border border-black p-1 h-6"></td>
                                <td className="border border-black p-1"></td>
                                <td className="border border-black p-1"></td>
                                <td className="border border-black p-1"></td>
                                <td className="border border-black p-1"></td>
                                <td className="border border-black p-1"></td>
                                <td className="border border-black p-1"></td>
                                <td className="border border-black p-1"></td>
                                <td className="border border-black p-1 text-center">☐</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Observations Section */}
                {orders.some(o => o.observacoes_medicas) && (
                    <div className="mt-3 text-xs">
                        <p className="font-bold border-b border-black pb-1 mb-1">Observações:</p>
                        {orders.filter(o => o.observacoes_medicas).map(o => (
                            <p key={o.id} className="ml-2">
                                • <strong>{o.scheduled_time}</strong> - {o.patient?.nome_completo}: {o.observacoes_medicas}
                            </p>
                        ))}
                    </div>
                )}

                {/* Notes area */}
                <div className="mt-4 border border-black p-2">
                    <p className="text-xs font-bold mb-1">Anotações:</p>
                    <div className="h-16 border-t border-dashed border-gray-400"></div>
                </div>

                {/* Footer */}
                <div className="mt-3 pt-2 border-t border-black flex justify-between text-xs text-gray-600">
                    <p>Legenda: INT=Internado, AMB=Ambulatório, Sed.=Sedação</p>
                    <p>Impresso em: {getCurrentDateTime()}</p>
                </div>
            </div>
        )
    }

    // Normal View
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
                                <Eye className="mr-2 h-4 w-4" />
                                Visualizar
                            </Button>
                            <Button
                                onClick={handlePrint}
                                disabled={!showPreview || orders.length === 0}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Preview Area */}
                {showPreview && (
                    <Card>
                        <CardContent className="pt-6">
                            {/* Preview Header */}
                            <div className="text-center mb-6 pb-4 border-b">
                                <p className="text-sm text-slate-500">Hospital Geral de Palmas - EEG Pediátrico</p>
                                <h2 className="text-xl font-bold mt-1">MAPA DE AGENDAMENTOS</h2>
                                <p className="text-lg font-medium capitalize mt-1 text-blue-600">{formattedDate}</p>
                            </div>

                            {orders.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                    <p>Nenhum paciente agendado para esta data.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Summary Bar */}
                                    <div className="flex flex-wrap gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
                                        <span className="text-sm"><strong>Total:</strong> {orders.length}</span>
                                        <span className="text-sm"><strong>Internados:</strong> {orders.filter(o => o.tipo_paciente === 'Internado').length}</span>
                                        <span className="text-sm"><strong>Ambulatório:</strong> {orders.filter(o => o.tipo_paciente !== 'Internado').length}</span>
                                        <span className="text-sm"><strong>Com Sedação:</strong> {orders.filter(o => o.necessidade_sedacao === 'Com').length}</span>
                                    </div>

                                    {/* Table Preview */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border text-sm">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="border p-2 text-left">Hora</th>
                                                    <th className="border p-2 text-left">Paciente</th>
                                                    <th className="border p-2 text-center">Idade</th>
                                                    <th className="border p-2 text-center">Tipo</th>
                                                    <th className="border p-2 text-center">Sedação</th>
                                                    <th className="border p-2 text-left">Responsável</th>
                                                    <th className="border p-2 text-left">Município</th>
                                                    <th className="border p-2 text-left">Contato</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orders.map((item) => (
                                                    <tr key={item.id} className="hover:bg-slate-50">
                                                        <td className="border p-2 font-mono font-medium">
                                                            {item.scheduled_time || '--:--'}
                                                        </td>
                                                        <td className="border p-2 font-medium">
                                                            {item.patient?.nome_completo || 'N/D'}
                                                        </td>
                                                        <td className="border p-2 text-center whitespace-nowrap">
                                                            {item.patient?.data_nascimento ? calculateAge(item.patient.data_nascimento) : '-'}
                                                        </td>
                                                        <td className="border p-2 text-center">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.tipo_paciente === 'Internado'
                                                                    ? 'bg-red-100 text-red-700'
                                                                    : 'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                {item.tipo_paciente === 'Internado' ? 'INT' : 'AMB'}
                                                            </span>
                                                        </td>
                                                        <td className="border p-2 text-center">
                                                            {item.necessidade_sedacao === 'Com' ? (
                                                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">SIM</span>
                                                            ) : (
                                                                <span className="text-slate-400">NÃO</span>
                                                            )}
                                                        </td>
                                                        <td className="border p-2">{item.patient?.nome_responsavel || '-'}</td>
                                                        <td className="border p-2">{item.patient?.municipio || '-'}</td>
                                                        <td className="border p-2 font-mono text-sm">{item.patient?.whatsapp || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Observations */}
                                    {orders.some(o => o.observacoes_medicas) && (
                                        <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                                            <p className="font-medium text-amber-800 mb-2">📝 Observações:</p>
                                            {orders.filter(o => o.observacoes_medicas).map(o => (
                                                <p key={o.id} className="text-sm text-amber-700 ml-4">
                                                    • <strong>{o.scheduled_time}</strong> - {o.patient?.nome_completo}: {o.observacoes_medicas}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {!showPreview && (
                    <Card>
                        <CardContent className="py-12 text-center text-slate-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p>Selecione uma data e clique em &quot;Visualizar&quot; para ver o mapa.</p>
                            <p className="text-sm mt-2">O layout de impressão será limpo e pronto para imprimir.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    )
}
