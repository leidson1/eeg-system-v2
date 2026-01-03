import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Lista todos os pacientes ativos
export async function GET() {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .eq('status', 'Ativo')
            .order('nome_completo', { ascending: true })

        if (error) {
            console.error('Error fetching patients:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (err) {
        console.error('Server error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Cria um novo paciente
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        const { data, error } = await supabase
            .from('patients')
            .insert({
                nome_completo: body.nome_completo,
                data_nascimento: body.data_nascimento,
                cartao_sus: body.cartao_sus || null,
                nome_responsavel: body.nome_responsavel,
                telefones: body.telefones || [],
                whatsapp: body.whatsapp || null,
                email: body.email || null,
                municipio: body.municipio || null,
                observacoes: body.observacoes || null,
                status: 'Ativo',
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating patient:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (err) {
        console.error('Server error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
