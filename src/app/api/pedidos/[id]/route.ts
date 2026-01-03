import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Busca um pedido específico
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        patient:patients(*),
        contact_logs(*)
      `)
            .eq('id', id)
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 404 })
        }

        return NextResponse.json(data)
    } catch (err) {
        console.error('Server error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT - Atualiza um pedido
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const body = await request.json()

        const updateData: Record<string, unknown> = {}

        // Only include fields that are provided
        if (body.status !== undefined) updateData.status = body.status
        if (body.prioridade !== undefined) updateData.prioridade = body.prioridade
        if (body.tipo_paciente !== undefined) updateData.tipo_paciente = body.tipo_paciente
        if (body.necessidade_sedacao !== undefined) updateData.necessidade_sedacao = body.necessidade_sedacao
        if (body.medico_solicitante !== undefined) updateData.medico_solicitante = body.medico_solicitante
        if (body.medica_executora !== undefined) updateData.medica_executora = body.medica_executora
        if (body.observacoes_medicas !== undefined) updateData.observacoes_medicas = body.observacoes_medicas
        if (body.scheduled_date !== undefined) updateData.scheduled_date = body.scheduled_date
        if (body.scheduled_time !== undefined) updateData.scheduled_time = body.scheduled_time
        if (body.data_conclusao !== undefined) updateData.data_conclusao = body.data_conclusao
        if (body.executed_by_doctors !== undefined) updateData.executed_by_doctors = body.executed_by_doctors
        if (body.executed_by_nurses !== undefined) updateData.executed_by_nurses = body.executed_by_nurses
        if (body.executed_by_technicians !== undefined) updateData.executed_by_technicians = body.executed_by_technicians
        if (body.archived_at !== undefined) updateData.archived_at = body.archived_at

        const { data, error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', id)
            .select(`
        *,
        patient:patients(id, nome_completo, data_nascimento, nome_responsavel, municipio)
      `)
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (err) {
        console.error('Server error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE - Arquiva um pedido
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        const { error } = await supabase
            .from('orders')
            .update({ archived_at: new Date().toISOString() })
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ message: 'Pedido arquivado' })
    } catch (err) {
        console.error('Server error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
