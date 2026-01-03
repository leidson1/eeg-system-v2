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
    logContatos?: Array<{
        dataHora: string
        meio: string
        resultado: string
        observacoes?: string
    }>
}

interface LegacyBackup {
    patients: LegacyPatient[]
    pedidos?: LegacyOrder[] // can be "pedidos" or something else
}

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
        // Combine phones
        const phones = legacy.telefonesResponsavel || []
        const whatsapp = legacy.whatsappResponsavel
        const allPhones = whatsapp ? [...phones, whatsapp] : phones
        const primaryPhone = allPhones[0] || null
        const secondaryPhone = allPhones[1] || null

        return {
            nome_completo: legacy.nomeCompleto,
            data_nascimento: legacy.dataNascimento || null,
            cartao_sus: legacy.cartaoSus || null,
            nome_responsavel: legacy.nomeResponsavel || null,
            telefone_responsavel: primaryPhone,
            telefone_secundario: secondaryPhone,
            email_responsavel: legacy.emailResponsavel || null,
            municipio: legacy.municipioProcedencia || null,
            observacoes: legacy.observacoesGerais || null,
            status: legacy.status === 'Inativo' ? 'Inativo' : 'Ativo',
            created_at: legacy.dataCadastro || new Date().toISOString(),
        }
    }

    const processOrder = (legacy: LegacyOrder, newPatientId: string | null) => {
        // Map priority (string "1" to number 1)
        const prioridade = parseInt(legacy.prioridade) || 3

        // Map status
        let status = 'Pendente'
        if (legacy.status === 'Concluído' || legacy.status === 'Concluido') {
            status = 'Concluido'
        } else if (legacy.status === 'Agendado') {
            status = 'Agendado'
        }

        // Map tipo_paciente
        const tipoPaciente = legacy.tipoPaciente === 'Internado' ? 'Internado' : 'Ambulatorio'

        // Map sedacao
        const sedacao = legacy.necessidadeSedacao === 'Com' ? 'Com' : 'Sem'

        return {
            patient_id: newPatientId,
            data_pedido: legacy.dataPedido || null,
            tipo_paciente: tipoPaciente,
            medico_solicitante: legacy.medicoSolicitante || null,
            medico_executor: legacy.medicaExecutora || null,
            necessidade_sedacao: sedacao,
            prioridade: prioridade,
            status: status,
            observacoes_medicas: legacy.observacoesMedicas || null,
            scheduled_date: legacy.scheduledDate || null,
            scheduled_time: legacy.scheduledTime || null,
            data_conclusao: legacy.dataConclusao || null,
            created_at: new Date().toISOString(),
        }
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

            const totalItems = patients.length + orders.length
            let processed = 0

            const patientResults = { success: 0, errors: 0 }
            const orderResults = { success: 0, errors: 0 }

            // Process patients first
            setStatus(`Importando ${patients.length} pacientes...`)
            for (const legacyPatient of patients) {
                try {
                    const newPatient = processPatient(legacyPatient)
                    const { data, error } = await supabase
                        .from('patients')
                        .insert(newPatient)
                        .select('id')
                        .single()

                    if (error) {
                        console.error('Patient error:', error)
                        patientResults.errors++
                    } else if (data) {
                        patientIdMap.set(legacyPatient.id, data.id)
                        patientResults.success++
                    }
                } catch (err) {
                    console.error('Patient exception:', err)
                    patientResults.errors++
                }

                processed++
                setProgress(Math.round((processed / totalItems) * 100))
            }

            // Process orders
            setStatus(`Importando ${orders.length} pedidos...`)
            for (const legacyOrder of orders) {
                try {
                    const newPatientId = patientIdMap.get(legacyOrder.patientId) || null

                    if (!newPatientId) {
                        console.warn(`Patient not found for order: ${legacyOrder.id}`)
                        orderResults.errors++
                        processed++
                        setProgress(Math.round((processed / totalItems) * 100))
                        continue
                    }

                    const newOrder = processOrder(legacyOrder, newPatientId)
                    const { error } = await supabase
                        .from('orders')
                        .insert(newOrder)

                    if (error) {
                        console.error('Order error:', error)
                        orderResults.errors++
                    } else {
                        orderResults.success++
                    }
                } catch (err) {
                    console.error('Order exception:', err)
                    orderResults.errors++
                }

                processed++
                setProgress(Math.round((processed / totalItems) * 100))
            }

            setResults({ patients: patientResults, orders: orderResults })
            setStatus('Migração concluída!')

            if (patientResults.errors === 0 && orderResults.errors === 0) {
                toast.success('Migração concluída com sucesso!')
            } else {
                toast.warning(`Migrado com ${patientResults.errors + orderResults.errors} erro(s)`)
            }
        } catch (error) {
            console.error('Migration error:', error)
            toast.error(error instanceof Error ? error.message : 'Erro na migração')
            setStatus('Erro na migração')
        } finally {
            setLoading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="text-white hover:bg-slate-800">
                        <Link href="/admin">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Database className="h-6 w-6 text-blue-500" />
                            Migração de Dados
                        </h1>
                        <p className="text-slate-400 text-sm">Importar backup do sistema antigo</p>
                    </div>
                </div>

                {/* Migration Card */}
                <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <FileJson className="h-5 w-5 text-yellow-500" />
                            Importar Backup JSON
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Selecione o arquivo de backup do sistema antigo (localStorage)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-slate-700/50 rounded-lg p-4 text-sm text-slate-300">
                            <p className="font-medium mb-2">O que será importado:</p>
                            <ul className="list-disc list-inside space-y-1 text-slate-400">
                                <li>Todos os pacientes cadastrados</li>
                                <li>Todos os pedidos de EEG</li>
                                <li>Status, prioridade e agendamentos</li>
                            </ul>
                        </div>

                        <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 text-sm">
                            <p className="text-amber-400 font-medium flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Atenção
                            </p>
                            <p className="text-amber-300/80 mt-1">
                                Execute apenas uma vez. Os dados serão adicionados ao banco.
                            </p>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>{status}</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                                <p className="text-sm text-slate-400 text-center">{progress}%</p>
                            </div>
                        ) : results ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                    <span className="text-slate-300">Pacientes</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-green-400 flex items-center gap-1">
                                            <CheckCircle className="h-4 w-4" />
                                            {results.patients.success}
                                        </span>
                                        {results.patients.errors > 0 && (
                                            <span className="text-red-400">
                                                {results.patients.errors} erros
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                    <span className="text-slate-300">Pedidos</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-green-400 flex items-center gap-1">
                                            <CheckCircle className="h-4 w-4" />
                                            {results.orders.success}
                                        </span>
                                        {results.orders.errors > 0 && (
                                            <span className="text-red-400">
                                                {results.orders.errors} erros
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <label className="w-full">
                                <Button className="w-full cursor-pointer" asChild>
                                    <span>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Selecionar Arquivo de Backup
                                    </span>
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={handleMigrate}
                                    className="hidden"
                                />
                            </label>
                        )}

                        {results && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setResults(null)}
                            >
                                Fazer Nova Migração
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-slate-500">
                    URL: /admin/migrate
                </p>
            </div>
        </div>
    )
}
