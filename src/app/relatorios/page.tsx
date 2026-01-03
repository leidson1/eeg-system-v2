'use client'

import { AppHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Printer, FileText } from 'lucide-react'
import { useState } from 'react'

// Dados de demonstração
const mockReportData = {
    pendingTotal: 12,
    byPriority: { 1: 2, 2: 3, 3: 5, 4: 2 },
    byMunicipio: { 'Palmas': 5, 'Araguaína': 3, 'Gurupi': 2, 'Outros': 2 },
    bySedacao: { 'Com': 4, 'Sem': 8 },
    concluidos: 45,
    produtividade: {
        medicos: [
            { name: 'Dra. Graziela Schiavoni', count: 35 },
            { name: 'Dr. Carlos Mendes', count: 10 },
        ],
        enfermeiros: [
            { name: 'Lucy Pinheiro', count: 45 },
        ],
    },
}

export default function RelatoriosPage() {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [showReport, setShowReport] = useState(false)

    return (
        <>
            <AppHeader title="Relatórios Gerenciais" />

            <div className="p-6 space-y-6">
                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Filtros de Período</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="space-y-2">
                                <Label htmlFor="start">Data Inicial</Label>
                                <Input
                                    type="date"
                                    id="start"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-[180px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end">Data Final</Label>
                                <Input
                                    type="date"
                                    id="end"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-[180px]"
                                />
                            </div>
                            <Button onClick={() => setShowReport(true)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Gerar Relatório
                            </Button>
                            <Button variant="outline" onClick={() => window.print()} disabled={!showReport}>
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Report Content */}
                {showReport && (
                    <div className="space-y-6 print:space-y-4">
                        {/* Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">Pedidos Pendentes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-orange-600">{mockReportData.pendingTotal}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">Exames Concluídos</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-green-600">{mockReportData.concluidos}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">Taxa Concl./Pend.</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-blue-600">
                                        {(mockReportData.concluidos / (mockReportData.concluidos + mockReportData.pendingTotal) * 100).toFixed(0)}%
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* By Priority */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Pendentes por Prioridade</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-4">
                                    {Object.entries(mockReportData.byPriority).map(([priority, count]) => (
                                        <div key={priority} className="text-center p-4 bg-slate-50 rounded-lg">
                                            <div className="text-2xl font-bold text-slate-800">{count}</div>
                                            <div className="text-sm text-slate-500">Prioridade {priority}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* By Município */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Pendentes por Município</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(mockReportData.byMunicipio).map(([city, count]) => (
                                        <div key={city} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                                            <span>{city}</span>
                                            <span className="font-semibold">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Produtividade */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Produtividade no Período</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-medium mb-3 text-slate-700">Por Médica Executora</h4>
                                        <div className="space-y-2">
                                            {mockReportData.produtividade.medicos.map((item) => (
                                                <div key={item.name} className="flex justify-between p-2 bg-slate-50 rounded">
                                                    <span className="text-sm">{item.name}</span>
                                                    <span className="font-semibold">{item.count} exames</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-3 text-slate-700">Por Enfermeira</h4>
                                        <div className="space-y-2">
                                            {mockReportData.produtividade.enfermeiros.map((item) => (
                                                <div key={item.name} className="flex justify-between p-2 bg-slate-50 rounded">
                                                    <span className="text-sm">{item.name}</span>
                                                    <span className="font-semibold">{item.count} exames</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {!showReport && (
                    <Card>
                        <CardContent className="py-12 text-center text-slate-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p>Selecione um período e clique em &quot;Gerar Relatório&quot; para visualizar.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    )
}
