import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Lista todos os pedidos com dados do paciente
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const archived = searchParams.get('archived')
        const patientId = searchParams.get('patient_id')

        let query = supabase
            .from('orders')
            .select(`
        *,
        patient:patients(id, nome_completo, data_nascimento, nome_responsavel, municipio, whatsapp, telefones)
      `)
            .order('created_at', { ascending: false })

        // Filter by patient_id if provided
        if (patientId) {
            query = query.eq('patient_id', patientId)
        }

        // Filter by status or archived
        if (archived === 'true') {
            query = query.not('archived_at', 'is', null)
        } else if (status) {
            query = query.eq('status', status).is('archived_at', null)
        } else {
            query = query.is('archived_at', null)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching orders:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (err) {
        console.error('Server error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Cria um novo pedido
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        const { data, error } = await supabase
            .from('orders')
            .insert({
                patient_id: body.patient_id,
                status: 'Pendente',
                prioridade: body.prioridade || 3,
                tipo_paciente: body.tipo_paciente || 'Ambulatorio',
                necessidade_sedacao: body.necessidade_sedacao || 'Sem',
                medico_solicitante: body.medico_solicitante || null,
                medica_executora: body.medica_executora || null,
                observacoes_medicas: body.observacoes_medicas || null,
                data_pedido: body.data_pedido || new Date().toISOString().split('T')[0],
            })
            .select(`
        *,
        patient:patients(id, nome_completo, data_nascimento, nome_responsavel, municipio)
      `)
            .single()

        if (error) {
            console.error('Error creating order:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (err) {
        console.error('Server error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
