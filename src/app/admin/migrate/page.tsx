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
}

interface LegacyBackup {
    patients: LegacyPatient[]
    pedidos?: LegacyOrder[]
}

const BATCH_SIZE = 50 // Inserir 50 registros por vez

export default function MigratePage() {
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState<string>('')
    const [results, setResults] = useState<{
        patients: { success: number; errors: number }
        orders: { success: number; errors: number }
    } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    // Map for old patient ID -> new patient UUID
    const patientIdMap = new Map<string, string>()

    const processPatient = (legacy: LegacyPatient) => {
        const phones = legacy.telefonesResponsavel || []
        const whatsapp = legacy.whatsappResponsavel
        const allPhones = whatsapp ? [...phones, whatsapp] : phones
        const uniquePhones = [...new Set(allPhones)]

        return {
            nome_completo: legacy.nomeCompleto || 'Nome não informado',
            data_nascimento: legacy.dataNascimento || '2000-01-01',
            cartao_sus: legacy.cartaoSus || null,
            nome_responsavel: legacy.nomeResponsavel || 'Não informado',
            telefone_responsavel: uniquePhones[0] || null,
            telefone_secundario: uniquePhones[1] || null,
            whatsapp: whatsapp || uniquePhones[0] || null,
            telefones: uniquePhones,
            email_responsavel: legacy.emailResponsavel || null,
            municipio: legacy.municipioProcedencia || null,
            observacoes: legacy.observacoesGerais || null,
            status: legacy.status === 'Inativo' ? 'Inativo' : 'Ativo',
        }
    }

    const processOrder = (legacy: LegacyOrder, newPatientId: string | null) => {
        const prioridade = parseInt(legacy.prioridade) || 3

        let status = 'Pendente'
        if (legacy.status === 'Concluído' || legacy.status === 'Concluido') {
            status = 'Concluido'
        } else if (legacy.status === 'Agendado') {
            status = 'Agendado'
        } else if (legacy.status === 'Cancelado') {
            status = 'Cancelado'
        }

        const tipoPaciente = legacy.tipoPaciente === 'Internado' ? 'Internado' : 'Ambulatorio'
        const sedacao = legacy.necessidadeSedacao === 'Com' ? 'Com' : 'Sem'

        return {
            patient_id: newPatientId,
            data_pedido: legacy.dataPedido || new Date().toISOString().split('T')[0],
            tipo_paciente: tipoPaciente,
            medico_solicitante: legacy.medicoSolicitante || null,
            medico_executor: legacy.medicaExecutora || null,
            necessidade_sedacao: sedacao,
            prioridade: Math.min(Math.max(prioridade, 1), 4), // Garantir entre 1-4
            status: status,
            observacoes_medicas: legacy.observacoesMedicas || null,
            scheduled_date: legacy.scheduledDate || null,
            scheduled_time: legacy.scheduledTime || null,
            data_conclusao: legacy.dataConclusao || null,
        }
    }

    // Helper para dividir array em chunks
    const chunkArray = <T,>(array: T[], size: number): T[][] => {
        const chunks: T[][] = []
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size))
        }
        return chunks
    }

    const handleMigrate = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        setProgress(0)
        setResults(null)

        try {
            setStatus('Lendo arquivo...')
            const text = await file.text()
            const backup = JSON.parse(text) as LegacyBackup

            const patients = backup.patients || []

            // Find orders - might be under different key
            let orders: LegacyOrder[] = []
            const backupObj = backup as unknown as Record<string, unknown>
            const keys = Object.keys(backupObj)
            for (const key of keys) {
                if (key !== 'patients' && Array.isArray(backupObj[key])) {
                    const arr = backupObj[key] as LegacyOrder[]
                    if (arr.length > 0 && arr[0].patientId !== undefined) {
                        orders = arr
                        break
                    }
                }
            }

            console.log(`Encontrados ${patients.length} pacientes e ${orders.length} pedidos`)

            const patientResults = { success: 0, errors: 0 }
            const orderResults = { success: 0, errors: 0 }

            // ==========================================
            // FASE 1: IMPORTAR PACIENTES EM LOTES
            // ==========================================
            setStatus(`Preparando ${patients.length} pacientes...`)

            // Preparar todos os pacientes com seus IDs originais
            const patientData = patients.map(p => ({
                legacy_id: p.id,
                ...processPatient(p)
            }))

            // Dividir em chunks
            const patientChunks = chunkArray(patientData, BATCH_SIZE)
            let processedChunks = 0

            for (const chunk of patientChunks) {
                setStatus(`Importando pacientes (lote ${processedChunks + 1}/${patientChunks.length})...`)

                // Remover legacy_id antes de inserir
                const toInsert = chunk.map(({ legacy_id, ...rest }) => rest)

                const { data, error } = await supabase
                    .from('patients')
                    .insert(toInsert)
                    .select('id')

                if (error) {
                    console.error('Batch patient error:', error)
                    patientResults.errors += chunk.length
                } else if (data) {
                    // Mapear IDs
                    data.forEach((record, index) => {
                        patientIdMap.set(chunk[index].legacy_id, record.id)
                    })
                    patientResults.success += data.length
                }

                processedChunks++
                setProgress(Math.round((processedChunks / patientChunks.length) * 50))

                // Pequena pausa entre lotes para evitar rate limiting
                await new Promise(resolve => setTimeout(resolve, 100))
            }

            // ==========================================
            // FASE 2: IMPORTAR PEDIDOS EM LOTES
            // ==========================================
            setStatus(`Preparando ${orders.length} pedidos...`)

            // Preparar pedidos com novos IDs de pacientes
            const orderData = orders.map(o => {
                const newPatientId = patientIdMap.get(o.patientId)
                if (!newPatientId) {
                    orderResults.errors++
                    return null
                }
                return processOrder(o, newPatientId)
            }).filter(Boolean) as ReturnType<typeof processOrder>[]

            // Dividir em chunks
            const orderChunks = chunkArray(orderData, BATCH_SIZE)
            processedChunks = 0

            for (const chunk of orderChunks) {
                setStatus(`Importando pedidos (lote ${processedChunks + 1}/${orderChunks.length})...`)

                const { data, error } = await supabase
                    .from('orders')
                    .insert(chunk)
                    .select('id')

                if (error) {
                    console.error('Batch order error:', error)
                    orderResults.errors += chunk.length
                } else if (data) {
                    orderResults.success += data.length
                }

                processedChunks++
                setProgress(50 + Math.round((processedChunks / orderChunks.length) * 50))

                // Pequena pausa entre lotes
                await new Promise(resolve => setTimeout(resolve, 100))
            }

            setResults({ patients: patientResults, orders: orderResults })
            setStatus('Migração concluída!')
            setProgress(100)

            if (patientResults.success > 0 || orderResults.success > 0) {
                toast.success(`Migração concluída! ${patientResults.success} pacientes e ${orderResults.success} pedidos importados.`)
            }

        } catch (err) {
            console.error('Migration error:', err)
            toast.error('Erro durante a migração')
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
                                    A migração usa lotes de {BATCH_SIZE} registros por vez.
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
