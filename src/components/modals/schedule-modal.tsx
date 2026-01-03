'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CalendarCheck, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ScheduleModalProps {
    open: boolean
    onClose: () => void
    onConfirm: (date: string, time: string) => Promise<void>
    patientName?: string
}

export function ScheduleModal({ open, onClose, onConfirm, patientName }: ScheduleModalProps) {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [time, setTime] = useState('08:00')
    const [loading, setLoading] = useState(false)

    const handleConfirm = async () => {
        if (!date) return

        setLoading(true)
        try {
            const dateStr = format(date, 'yyyy-MM-dd')
            await onConfirm(dateStr, time)
            onClose()
        } catch {
            // Error handled by parent
        } finally {
            setLoading(false)
        }
    }

    const formattedDate = date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarCheck className="h-5 w-5 text-blue-600" />
                        Agendar Exame
                    </DialogTitle>
                    <DialogDescription>
                        {patientName
                            ? `Agendando exame para ${patientName}`
                            : 'Selecione a data e horário do exame'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Calendário */}
                    <div className="flex justify-center">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            locale={ptBR}
                            className="rounded-md border"
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                    </div>

                    {/* Data Selecionada */}
                    {date && (
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">
                                Data selecionada: {formattedDate}
                            </p>
                        </div>
                    )}

                    {/* Horário */}
                    <div className="space-y-2">
                        <Label htmlFor="time" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Horário
                        </Label>
                        <Input
                            id="time"
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!date || loading}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {loading ? 'Agendando...' : 'Confirmar Agendamento'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
