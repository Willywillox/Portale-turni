import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths, subMonths } from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'

interface Shift {
  id: string
  user_id: string
  start_time: string
  end_time: string
  shift_type: 'morning' | 'afternoon' | 'night'
  location: string | null
  notes: string | null
  profiles?: {
    first_name: string
    last_name: string
  }
}

export default function Calendar() {
  const { profile } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'my' | 'all'>('my')

  useEffect(() => {
    loadShifts()
  }, [currentMonth, viewMode, profile])

  async function loadShifts() {
    if (!profile) return
    setLoading(true)

    try {
      const start = startOfMonth(currentMonth)
      const end = endOfMonth(currentMonth)

      let query = supabase
        .from('shifts')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name
          )
        `)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time', { ascending: true })

      if (viewMode === 'my') {
        query = query.eq('user_id', profile.id)
      }

      const { data, error } = await query

      if (error) throw error
      setShifts(data || [])
    } catch (error) {
      console.error('Error loading shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const getShiftsForDay = (day: Date) => {
    return shifts.filter(shift => isSameDay(parseISO(shift.start_time), day))
  }

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'morning': return 'bg-yellow-400'
      case 'afternoon': return 'bg-blue-400'
      case 'night': return 'bg-indigo-500'
      default: return 'bg-gray-400'
    }
  }

  const getShiftTypeLabel = (type: string) => {
    switch (type) {
      case 'morning': return 'M'
      case 'afternoon': return 'P'
      case 'night': return 'N'
      default: return '?'
    }
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendario Turni</h1>
            <p className="mt-2 text-gray-600">
              {format(currentMonth, 'MMMM yyyy', { locale: it })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {(profile?.role === 'admin' || profile?.role === 'supervisor') && (
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode('my')}
                  className={`px-4 py-2 text-sm font-medium ${
                    viewMode === 'my'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  I Miei Turni
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-4 py-2 text-sm font-medium border-l border-gray-300 ${
                    viewMode === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Tutti i Turni
                </button>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Oggi
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Header giorni settimana */}
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
                  <div key={day} className="bg-gray-50 py-3 text-center text-sm font-semibold text-gray-700">
                    {day}
                  </div>
                ))}
              </div>

              {/* Giorni calendario */}
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {/* Padding per il primo giorno del mese */}
                {Array.from({ length: (startOfMonth(currentMonth).getDay() + 6) % 7 }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-gray-50 min-h-32"></div>
                ))}

                {/* Giorni del mese */}
                {days.map((day) => {
                  const dayShifts = getShiftsForDay(day)
                  const isToday = isSameDay(day, new Date())

                  return (
                    <div
                      key={day.toString()}
                      className={`bg-white min-h-32 p-2 ${
                        !isSameMonth(day, currentMonth) ? 'opacity-50' : ''
                      }`}
                    >
                      <div className={`text-sm font-medium mb-2 ${
                        isToday ? 'bg-primary-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : 'text-gray-900'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayShifts.map((shift) => (
                          <div
                            key={shift.id}
                            className={`${getShiftTypeColor(shift.shift_type)} text-white text-xs px-2 py-1 rounded`}
                            title={`${format(parseISO(shift.start_time), 'HH:mm')} - ${format(parseISO(shift.end_time), 'HH:mm')}${shift.location ? ` - ${shift.location}` : ''}`}
                          >
                            <div className="font-semibold">
                              {getShiftTypeLabel(shift.shift_type)} {format(parseISO(shift.start_time), 'HH:mm')}
                            </div>
                            {viewMode === 'all' && shift.profiles && (
                              <div className="text-xs opacity-90 truncate">
                                {shift.profiles.first_name} {shift.profiles.last_name[0]}.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Legenda */}
        <div className="mt-6 bg-white shadow rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Legenda</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-400 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Mattina (06:00-14:00)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-400 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Pomeriggio (14:00-22:00)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-indigo-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Notte (22:00-06:00)</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
