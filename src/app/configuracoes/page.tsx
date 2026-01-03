'use client'

import { AppHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Save, Download, Upload, Users, Calendar } from 'lucide-react'
import { useState } from 'react'

// Dados de demonstração
const mockTeam = {
    medicos: ['Dra. Graziela Schiavoni', 'Dr. Carlos Mendes'],
    enfermeiros: ['Lucy Pinheiro'],
    tecnicos: ['Iolanda Alves'],
    solicitantes: ['Dr. Ricardo Alves', 'Dra. Fernanda Lima', 'Dr. Marcos Costa'],
}

const mockCapacity = [
    { date: '2026-01-06', capacity: 4 },
    { date: '2026-01-07', capacity: 4 },
    { date: '2026-01-08', capacity: 0 },
    { date: '2026-01-09', capacity: 4 },
    { date: '2026-01-10', capacity: 3 },
]

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR')
}

export default function ConfiguracoesPage() {
    const [newDate, setNewDate] = useState('')
    const [newCapacity, setNewCapacity] = useState('')

    return (
        <>
            <AppHeader title="Configurações" />

            <div className="p-6 space-y-6">
                <Tabs defaultValue="capacity" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="capacity" className="flex gap-2">
                            <Calendar className="h-4 w-4" />
                            Capacidade
                        </TabsTrigger>
                        <TabsTrigger value="team" className="flex gap-2">
                            <Users className="h-4 w-4" />
                            Equipe
                        </TabsTrigger>
                        <TabsTrigger value="backup">Backup</TabsTrigger>
                    </TabsList>

                    {/* Capacidade Tab */}
                    <TabsContent value="capacity" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Definir Capacidade Eletiva por Dia</CardTitle>
                                <p className="text-sm text-slate-500">
                                    Adicione os dias em que haverá exames eletivos e a capacidade de cada dia.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-4 items-end">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Data</Label>
                                        <Input
                                            type="date"
                                            id="date"
                                            value={newDate}
                                            onChange={(e) => setNewDate(e.target.value)}
                                            className="w-[180px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="capacity">Capacidade Eletiva</Label>
                                        <Input
                                            type="number"
                                            id="capacity"
                                            min="0"
                                            value={newCapacity}
                                            onChange={(e) => setNewCapacity(e.target.value)}
                                            className="w-[120px]"
                                        />
                                    </div>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Adicionar
                                    </Button>
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50">
                                                <TableHead>Data</TableHead>
                                                <TableHead>Capacidade Eletiva</TableHead>
                                                <TableHead className="text-right">Ação</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {mockCapacity.map((item) => (
                                                <TableRow key={item.date}>
                                                    <TableCell>{formatDate(item.date)}</TableCell>
                                                    <TableCell className="text-center">{item.capacity}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" className="text-red-600">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <Button>
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Alterações
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Equipe Tab */}
                    <TabsContent value="team" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Médicas */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Médica(s) Executora(s)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {mockTeam.medicos.map((name, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input value={name} readOnly className="flex-1" />
                                            <Button variant="ghost" size="sm" className="text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Adicionar Médica
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Enfermeiras */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Enfermeira(s)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {mockTeam.enfermeiros.map((name, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input value={name} readOnly className="flex-1" />
                                            <Button variant="ghost" size="sm" className="text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Adicionar Enfermeira
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Técnicas */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Técnica(s)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {mockTeam.tecnicos.map((name, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input value={name} readOnly className="flex-1" />
                                            <Button variant="ghost" size="sm" className="text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Adicionar Técnica
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Solicitantes */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Médicos Solicitantes</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {mockTeam.solicitantes.map((name, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input value={name} readOnly className="flex-1" />
                                            <Button variant="ghost" size="sm" className="text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Adicionar Solicitante
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        <Button className="bg-blue-600">
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Equipe
                        </Button>
                    </TabsContent>

                    {/* Backup Tab */}
                    <TabsContent value="backup">
                        <Card>
                            <CardHeader>
                                <CardTitle>Backup e Restauração de Dados</CardTitle>
                                <p className="text-sm text-slate-500">
                                    Faça backups regularmente para evitar perda de dados.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <p className="text-sm">
                                        <span className="font-medium">Último backup:</span>{' '}
                                        <span className="text-slate-600">Nunca</span>
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    <Button className="bg-green-600 hover:bg-green-700">
                                        <Download className="mr-2 h-4 w-4" />
                                        Exportar Dados (Backup)
                                    </Button>
                                    <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                                        <Upload className="mr-2 h-4 w-4" />
                                        Importar Dados (Restaurar)
                                    </Button>
                                </div>

                                <p className="text-sm text-red-600">
                                    <strong>Atenção:</strong> Importar dados substituirá TODOS os dados atuais do sistema.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    )
}
