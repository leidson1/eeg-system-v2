'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
    Upload,
    Loader2,
    CheckCircle,
    AlertTriangle,
    ArrowLeft,
    FileJson,
    Database
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface LegacyPatient {
    id: string
    nomeCompleto: string
    dataNascimento: string
    cartaoSus?: string
    nomeResponsavel?: string
    telefonesResponsavel?: string[]
    emailResponsavel?: string
    whatsappResponsavel?: string
    municipioProcedencia?: string
    observacoesGerais?: string
    status?: string
    dataCadastro?: string
}

interface LegacyOrder {
    id: string
    patientId: string
    dataPedido: string
    tipoPaciente: string
    medicoSolicitante?: string
    medicaExecutora?: string
    necessidadeSedacao: string
    prioridade: string
    status: string
    observacoesMedicas?: string
    scheduledDate?: string
    scheduledTime?: string
    dataConclusao?: string
    // Campos de execução (quem executou o exame)
    executedBy_doctors?: string[]
    executedBy_nurses?: string[]
    executedBy_technicians?: string[]
    // Flag para pedidos arquivados
    isArchived?: boolean
    dataArquivamento?: string
}

interface LegacyBackup {
    patients: LegacyPatient[]
    pedidos?: LegacyOrder[]
}

const BATCH_SIZE = 25 // Menor para evitar rate limiting

export default function MigratePage() {
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState<string>('')
    const [errorLog, setErrorLog] = useState<string[]>([])
    const [results, setResults] = useState<{
        patients: { success: number; errors: number }
        orders: { success: number; errors: number }
    } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    // Map for old patient ID -> new patient UUID
    const patientIdMapRef = useRef(new Map<string, string>())

    // Converter paciente legado para novo formato
    // IMPORTANTE: Campos devem corresponder EXATAMENTE ao schema do Supabase
    const processPatient = (legacy: LegacyPatient) => {
        const phones = legacy.telefonesResponsavel || []
        const whatsapp = legacy.whatsappResponsavel
        const allPhones = whatsapp ? [whatsapp, ...phones] : phones
        const uniquePhones = [...new Set(allPhones.filter(Boolean))]

        return {
            nome_completo: legacy.nomeCompleto || 'Nome não informado',
            data_nascimento: legacy.dataNascimento || null,
            cartao_sus: legacy.cartaoSus || null,
            nome_responsavel: legacy.nomeResponsavel || null,
            telefones: uniquePhones,
            whatsapp: whatsapp || uniquePhones[0] || null,
            email: legacy.emailResponsavel || null,
            municipio: legacy.municipioProcedencia || null,
            observacoes: legacy.observacoesGerais || null,
            status: legacy.status === 'Inativo' ? 'Inativo' : 'Ativo',
        }
    }

    const processOrder = (legacy: LegacyOrder, newPatientId: string) => {
        const prioridade = parseInt(legacy.prioridade) || 3

        let orderStatus = 'Pendente'
        if (legacy.status === 'Concluído' || legacy.status === 'Concluido') {
            orderStatus = 'Concluido'
        } else if (legacy.status === 'Agendado') {
            orderStatus = 'Agendado'
        } else if (legacy.status === 'Cancelado') {
            orderStatus = 'Cancelado'
        } else if (legacy.status === 'Arquivado') {
            orderStatus = 'Concluido' // Arquivados geralmente são concluídos
        }

        const tipoPaciente = legacy.tipoPaciente === 'Internado' ? 'Internado' : 'Ambulatorio'
        const sedacao = legacy.necessidadeSedacao === 'Com' ? 'Com' : 'Sem'

        return {
            patient_id: newPatientId,
            data_pedido: legacy.dataPedido || new Date().toISOString().split('T')[0],
            tipo_paciente: tipoPaciente,
            medico_solicitante: legacy.medicoSolicitante || null,
            medica_executora: legacy.medicaExecutora || null,
            necessidade_sedacao: sedacao,
            prioridade: Math.min(Math.max(prioridade, 1), 4),
            status: orderStatus,
            observacoes_medicas: legacy.observacoesMedicas || null,
            scheduled_date: legacy.scheduledDate || null,
            scheduled_time: legacy.scheduledTime || null,
            data_conclusao: legacy.dataConclusao || null,
            // Campos de execução - preserva quem executou o exame (nomes em português conforme schema)
            executado_por_medicos: legacy.executedBy_doctors || null,
            executado_por_enfermeiras: legacy.executedBy_nurses || null,
            executado_por_tecnicos: legacy.executedBy_technicians || null,
            // Marca como arquivado se veio de archivedOrders
            archived_at: legacy.isArchived ? (legacy.dataArquivamento || new Date().toISOString()) : null,
        }
    }

    const handleMigrate = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        setProgress(0)
        setResults(null)
        setErrorLog([])
        patientIdMapRef.current.clear()

        const errors: string[] = []

        try {
            setStatus('Lendo arquivo...')
            const text = await file.text()
            const backup = JSON.parse(text) as LegacyBackup

            const patients = backup.patients || []

            // Find orders - might be under different key
            let orders: LegacyOrder[] = []
            let archivedOrders: LegacyOrder[] = []
            const backupObj = backup as unknown as Record<string, unknown>
            const keys = Object.keys(backupObj)

            for (const key of keys) {
                if (key !== 'patients' && Array.isArray(backupObj[key])) {
                    const arr = backupObj[key] as LegacyOrder[]
                    if (arr.length > 0 && arr[0].patientId !== undefined) {
                        if (key === 'archivedOrders') {
                            archivedOrders = arr
                        } else if (key === 'orders' || key === 'pedidos') {
                            orders = arr
                        } else if (orders.length === 0) {
                            // Fallback for other keys with order-like structure
                            orders = arr
                        }
                    }
                }
            }

            // Combine orders and archived orders (marking archived ones)
            const allOrders = [
                ...orders,
                ...archivedOrders.map(o => ({ ...o, isArchived: true }))
            ]

            console.log(`Encontrados ${patients.length} pacientes, ${orders.length} pedidos e ${archivedOrders.length} arquivados`)

            const patientResults = { success: 0, errors: 0 }
            const orderResults = { success: 0, errors: 0 }

            // ==========================================
            // FASE 1: IMPORTAR PACIENTES UM A UM
            // (mais lento, mas permite mapear IDs)
            // ==========================================
            setStatus(`Importando ${patients.length} pacientes...`)

            for (let i = 0; i < patients.length; i++) {
                const legacyPatient = patients[i]

                try {
                    const newPatient = processPatient(legacyPatient)

                    const { data, error } = await supabase
                        .from('patients')
                        .insert(newPatient)
                        .select('id')
                        .single()

                    if (error) {
                        errors.push(`Paciente ${legacyPatient.nomeCompleto}: ${error.message}`)
                        patientResults.errors++
                    } else if (data) {
                        patientIdMapRef.current.set(legacyPatient.id, data.id)
                        patientResults.success++
                    }
                } catch (err) {
                    errors.push(`Paciente ${legacyPatient.nomeCompleto}: ${err}`)
                    patientResults.errors++
                }

                // Atualizar progresso a cada 10 pacientes
                if (i % 10 === 0) {
                    setProgress(Math.round((i / patients.length) * 50))
                    setStatus(`Importando pacientes... ${i + 1}/${patients.length}`)
                }

                // Pequena pausa a cada 20 para evitar rate limiting
                if (i % 20 === 0 && i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 100))
                }
            }

            setProgress(50)
            console.log(`Pacientes: ${patientResults.success} sucesso, ${patientResults.errors} erros`)

            // ==========================================
            // FASE 2: IMPORTAR PEDIDOS
            // ==========================================
            // FASE 2: IMPORTAR PEDIDOS (ativos + arquivados)
            // ==========================================
            setStatus(`Importando ${allOrders.length} pedidos (${orders.length} ativos + ${archivedOrders.length} arquivados)...`)

            for (let i = 0; i < allOrders.length; i++) {
                const legacyOrder = allOrders[i]
                const newPatientId = patientIdMapRef.current.get(legacyOrder.patientId)

                if (!newPatientId) {
                    errors.push(`Pedido ${legacyOrder.id}: paciente não encontrado (${legacyOrder.patientId})`)
                    orderResults.errors++
                    continue
                }

                try {
                    const newOrder = processOrder(legacyOrder, newPatientId)

                    const { error } = await supabase
                        .from('orders')
                        .insert(newOrder)

                    if (error) {
                        errors.push(`Pedido ${legacyOrder.id}: ${error.message}`)
                        orderResults.errors++
                    } else {
                        orderResults.success++
                    }
                } catch (err) {
                    errors.push(`Pedido ${legacyOrder.id}: ${err}`)
                    orderResults.errors++
                }

                // Atualizar progresso a cada 10 pedidos
                if (i % 10 === 0) {
                    setProgress(50 + Math.round((i / allOrders.length) * 50))
                    setStatus(`Importando pedidos... ${i + 1}/${allOrders.length}`)
                }

                // Pequena pausa a cada 20 para evitar rate limiting
                if (i % 20 === 0 && i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 100))
                }
            }

            setResults({ patients: patientResults, orders: orderResults })
            setErrorLog(errors.slice(0, 20)) // Mostrar primeiros 20 erros
            setStatus('Migração concluída!')
            setProgress(100)

            if (patientResults.success > 0 || orderResults.success > 0) {
                toast.success(`Migração concluída! ${patientResults.success} pacientes e ${orderResults.success} pedidos importados.`)
            } else if (errors.length > 0) {
                toast.error('Migração falhou. Verifique os erros abaixo.')
            }

        } catch (err) {
            console.error('Migration error:', err)
            toast.error('Erro durante a migração: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
            setStatus('Erro: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
        } finally {
            setLoading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleReset = () => {
        setResults(null)
        setProgress(0)
        setStatus('')
        setErrorLog([])
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            <div className="max-w-2xl mx-auto">
                <Button variant="ghost" asChild className="mb-6 text-slate-400 hover:text-white">
                    <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Admin
                    </Link>
                </Button>

                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Database className="h-6 w-6 text-blue-400" />
                            <div>
                                <CardTitle className="text-white">Migração de Dados</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Importar backup do sistema antigo (localStorage)
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* File Upload Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-blue-400">
                                <FileJson className="h-5 w-5" />
                                <span className="font-medium">Importar Backup JSON</span>
                            </div>
                            <p className="text-sm text-slate-400">
                                Selecione o arquivo de backup do sistema antigo (localStorage)
                            </p>

                            <div className="p-4 bg-slate-700/50 rounded-lg space-y-2">
                                <p className="text-sm text-slate-300 font-medium">O que será importado:</p>
                                <ul className="text-sm text-slate-400 space-y-1 ml-4">
                                    <li>• Todos os pacientes cadastrados</li>
                                    <li>• Todos os pedidos de EEG</li>
                                    <li>• Status, prioridade e agendamentos</li>
                                </ul>
                            </div>

                            <div className="p-4 bg-amber-900/30 border border-amber-700/50 rounded-lg">
                                <div className="flex items-center gap-2 text-amber-400 mb-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="font-medium">Atenção</span>
                                </div>
                                <p className="text-sm text-amber-200/80">
                                    Execute apenas uma vez. Os dados serão adicionados ao banco.
                                    A importação é feita um registro por vez para garantir o mapeamento de IDs.
                                </p>
                            </div>
                        </div>

                        {/* Progress */}
                        {loading && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                                    <span className="text-slate-300">{status}</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                                <p className="text-sm text-slate-400 text-right">{progress}%</p>
                            </div>
                        )}

                        {/* Results */}
                        {results && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-700/50 rounded-lg">
                                        <p className="text-sm text-slate-400 mb-1">Pacientes</p>
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1 text-green-400">
                                                <CheckCircle className="h-4 w-4" />
                                                {results.patients.success}
                                            </span>
                                            {results.patients.errors > 0 && (
                                                <span className="flex items-center gap-1 text-red-400">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    {results.patients.errors} erros
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-700/50 rounded-lg">
                                        <p className="text-sm text-slate-400 mb-1">Pedidos</p>
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1 text-green-400">
                                                <CheckCircle className="h-4 w-4" />
                                                {results.orders.success}
                                            </span>
                                            {results.orders.errors > 0 && (
                                                <span className="flex items-center gap-1 text-red-400">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    {results.orders.errors} erros
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Error Log */}
                                {errorLog.length > 0 && (
                                    <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg">
                                        <p className="text-sm font-medium text-red-400 mb-2">
                                            Primeiros erros encontrados:
                                        </p>
                                        <div className="max-h-40 overflow-y-auto space-y-1">
                                            {errorLog.map((err, i) => (
                                                <p key={i} className="text-xs text-red-300 font-mono">
                                                    {err}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    onClick={handleReset}
                                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                                >
                                    Fazer Nova Migração
                                </Button>
                            </div>
                        )}

                        {/* Upload Button */}
                        {!loading && !results && (
                            <div className="space-y-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={handleMigrate}
                                    className="hidden"
                                    id="backup-file"
                                />
                                <label
                                    htmlFor="backup-file"
                                    className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-slate-700/50 transition-colors"
                                >
                                    <Upload className="h-5 w-5 text-slate-400" />
                                    <span className="text-slate-300">
                                        Clique para selecionar arquivo JSON
                                    </span>
                                </label>
                            </div>
                        )}

                        <p className="text-xs text-slate-500 text-center">
                            URL: /admin/migrate
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
