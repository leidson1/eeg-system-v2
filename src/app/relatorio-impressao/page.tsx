'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

interface Order {
    id: string
    data_pedido: string
    scheduled_date: string | null
    data_conclusao: string | null
    prioridade: number
    tipo_paciente: string
    necessidade_sedacao: string
    status: string
    medico_solicitante: string | null
    medico_executor: string | null
    patient: {
        municipio: string | null
    } | null
}

function ReportContent() {
    const searchParams = useSearchParams()
    const startDate = searchParams.get('inicio') || ''
    const endDate = searchParams.get('fim') || ''

    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/pedidos')
                if (!response.ok) throw new Error('Erro ao carregar')
                const data = await response.json()

                // Filtrar por período se informado
                let filtered = data
                if (startDate && endDate) {
                    const startTime = new Date(startDate + 'T00:00:00').getTime()
                    const endTime = new Date(endDate + 'T23:59:59').getTime()
                    filtered = data.filter((o: Order) => {
                        if (!o.data_pedido) return false
                        const orderTime = new Date(o.data_pedido + 'T00:00:00').getTime()
                        return orderTime >= startTime && orderTime <= endTime
                    })
                }

                setOrders(filtered)
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [startDate, endDate])

    // Imprimir automaticamente após carregar
    useEffect(() => {
        if (!loading && orders.length > 0) {
            // Pequeno delay para garantir renderização
            setTimeout(() => {
                window.print()
            }, 500)
        }
    }, [loading, orders])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Carregando relatório...</p>
                </div>
            </div>
        )
    }

    // Calcular estatísticas
    const total = orders.length
    const pendentes = orders.filter(o => o.status === 'Pendente').length
    const agendados = orders.filter(o => o.status === 'Agendado').length
    const concluidos = orders.filter(o => o.status === 'Concluido').length
    const taxaConclusao = total > 0 ? Math.round((concluidos / total) * 100) : 0

    // Pendentes há mais de 30 dias
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const pendentesAntigos = orders.filter(o => {
        if (o.status !== 'Pendente') return false
        const dataPedido = new Date(o.data_pedido + 'T00:00:00')
        return dataPedido < thirtyDaysAgo
    }).length

    // Por prioridade
    const porPrioridade = [1, 2, 3, 4].map(p => ({
        label: p === 1 ? 'Muito Urgente' : p === 2 ? 'Urgente' : p === 3 ? 'Regular' : 'Eletivo',
        count: orders.filter(o => o.prioridade === p).length
    }))

    // Por município
    const municipios: Record<string, number> = {}
    orders.forEach(o => {
        const mun = o.patient?.municipio || 'Não informado'
        municipios[mun] = (municipios[mun] || 0) + 1
    })
    const topMunicipios = Object.entries(municipios)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)

    // Por sedação
    const comSedacao = orders.filter(o => o.necessidade_sedacao === 'Com').length
    const semSedacao = orders.filter(o => o.necessidade_sedacao === 'Sem').length

    // Por tipo de paciente
    const internados = orders.filter(o => o.tipo_paciente === 'Internado').length
    const ambulatoriais = orders.filter(o => o.tipo_paciente === 'Ambulatorio').length

    // Médicos solicitantes
    const medicos: Record<string, number> = {}
    orders.forEach(o => {
        const med = o.medico_solicitante || 'Não informado'
        medicos[med] = (medicos[med] || 0) + 1
    })
    const topMedicos = Object.entries(medicos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

    const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')
    const today = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <div className="p-8 max-w-4xl mx-auto bg-white print:p-4">
            {/* Cabeçalho */}
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Relatório Gerencial - EEG Pediátrico
                </h1>
                <p className="text-gray-600">Hospital Geral de Palmas</p>
                <p className="text-sm text-gray-500 mt-2">
                    {startDate && endDate
                        ? `Período: ${formatDate(startDate)} a ${formatDate(endDate)}`
                        : `Gerado em: ${today}`
                    }
                </p>
            </div>

            {/* Resumo Geral */}
            <section className="mb-6">
                <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">
                    Resumo Geral
                </h2>
                <table className="w-full">
                    <tbody>
                        <tr className="border-b border-gray-100">
                            <td className="py-1">Total de Pedidos</td>
                            <td className="py-1 text-right font-semibold">{total}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                            <td className="py-1">Pendentes</td>
                            <td className="py-1 text-right font-semibold">{pendentes}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                            <td className="py-1">Agendados</td>
                            <td className="py-1 text-right font-semibold">{agendados}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                            <td className="py-1">Concluídos</td>
                            <td className="py-1 text-right font-semibold">{concluidos}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                            <td className="py-1">Taxa de Conclusão</td>
                            <td className="py-1 text-right font-semibold">{taxaConclusao}%</td>
                        </tr>
                        <tr className="border-b border-gray-100 text-red-600">
                            <td className="py-1">Pendentes há mais de 30 dias</td>
                            <td className="py-1 text-right font-semibold">{pendentesAntigos}</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Por Prioridade */}
            <section className="mb-6">
                <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">
                    Por Prioridade
                </h2>
                <table className="w-full">
                    <tbody>
                        {porPrioridade.map((p, i) => (
                            <tr key={i} className="border-b border-gray-100">
                                <td className="py-1">P{i + 1} - {p.label}</td>
                                <td className="py-1 text-right font-semibold">{p.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* Por Tipo e Sedação */}
            <section className="mb-6 grid grid-cols-2 gap-8">
                <div>
                    <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">
                        Por Tipo de Paciente
                    </h2>
                    <table className="w-full">
                        <tbody>
                            <tr className="border-b border-gray-100">
                                <td className="py-1">Internados</td>
                                <td className="py-1 text-right font-semibold">{internados}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-1">Ambulatoriais</td>
                                <td className="py-1 text-right font-semibold">{ambulatoriais}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div>
                    <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">
                        Necessidade de Sedação
                    </h2>
                    <table className="w-full">
                        <tbody>
                            <tr className="border-b border-gray-100">
                                <td className="py-1">Com Sedação</td>
                                <td className="py-1 text-right font-semibold">{comSedacao}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-1">Sem Sedação</td>
                                <td className="py-1 text-right font-semibold">{semSedacao}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Por Município */}
            <section className="mb-6">
                <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">
                    Por Município (Top 15)
                </h2>
                <table className="w-full">
                    <tbody>
                        {topMunicipios.map(([mun, count], i) => (
                            <tr key={i} className="border-b border-gray-100">
                                <td className="py-1">{mun}</td>
                                <td className="py-1 text-right font-semibold">{count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* Por Médico Solicitante */}
            <section className="mb-6">
                <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-3">
                    Por Médico Solicitante (Top 10)
                </h2>
                <table className="w-full">
                    <tbody>
                        {topMedicos.map(([med, count], i) => (
                            <tr key={i} className="border-b border-gray-100">
                                <td className="py-1">{med}</td>
                                <td className="py-1 text-right font-semibold">{count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* Rodapé */}
            <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-500">
                <p>Sistema EEG Pediátrico - Hospital Geral de Palmas</p>
                <p className="text-xs mt-1">Relatório gerado automaticamente em {today}</p>
            </div>

            {/* Botão de impressão (não imprime) */}
            <div className="mt-6 text-center print:hidden">
                <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
                >
                    Imprimir Novamente
                </button>
                <button
                    onClick={() => window.close()}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                    Fechar
                </button>
            </div>

            {/* Estilos de impressão */}
            <style jsx global>{`
                @media print {
                    body {
                        font-size: 12px;
                        color: black;
                        background: white;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    @page {
                        margin: 1cm;
                    }
                }
            `}</style>
        </div>
    )
}

export default function RelatorioImpressaoPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <p>Carregando...</p>
            </div>
        }>
            <ReportContent />
        </Suspense>
    )
}
