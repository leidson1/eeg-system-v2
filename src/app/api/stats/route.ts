import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createClient()

        // Get pending orders count
        const { count: pendingTotal } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Pendente')
            .is('archived_at', null)

        // Get pending by priority
        const pendingByPriority: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
        for (const p of [1, 2, 3, 4]) {
            const { count } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Pendente')
                .eq('prioridade', p)
                .is('archived_at', null)
            pendingByPriority[p] = count || 0
        }

        // Get today's date
        const today = new Date().toISOString().split('T')[0]

        // Get scheduled today
        const { count: scheduledToday } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Agendado')
            .eq('scheduled_date', today)
            .is('archived_at', null)

        // Get scheduled next 7 days
        const next7Days = new Date()
        next7Days.setDate(next7Days.getDate() + 7)
        const next7DaysStr = next7Days.toISOString().split('T')[0]

        const { count: scheduledNext7Days } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Agendado')
            .gte('scheduled_date', today)
            .lte('scheduled_date', next7DaysStr)
            .is('archived_at', null)

        // Get total patients
        const { count: totalPatients } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Ativo')

        // Get capacity for today
        const { data: capacityData } = await supabase
            .from('capacity_config')
            .select('capacity')
            .eq('date', today)
            .single()

        const capacityToday = capacityData?.capacity || 0
        const usedCapacityToday = scheduledToday || 0

        return NextResponse.json({
            pendingTotal: pendingTotal || 0,
            pendingByPriority,
            scheduledToday: scheduledToday || 0,
            scheduledNext7Days: scheduledNext7Days || 0,
            capacityToday,
            usedCapacityToday,
            totalPatients: totalPatients || 0,
        })
    } catch (err) {
        console.error('Error fetching stats:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
