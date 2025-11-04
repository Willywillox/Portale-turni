import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { Clock, MapPin, Calendar as CalendarIcon, AlertCircle } from 'lucide-react'

interface Shift {
  id: string
  start_time: string
  end_time: string
  shift_type: 'morning' | 'afternoon' | 'night'
  location: string | null
  notes: string | null
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadShifts()
  }, [profile])

  async function loadShifts() {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', profile.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5)

      if (error) throw error
      setShifts(data || [])
    } catch (error) {
      console.error('Error loading shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getShiftTypeLabel = (type: string) => {
    switch (type) {
      case 'morning': return 'Mattina'
      case 'afternoon': return 'Pomeriggio'
      case 'night': return 'Notte'
      default: return type
    }
  }

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'morning': return 'bg-yellow-100 text-yellow-800'
      case 'afternoon': return 'bg-blue-100 text-blue-800'
      case 'night': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Benvenuto, {profile?.first_name}!
          </h1>
          <p className="mt-2 text-gray-600">
            Ecco una panoramica dei tuoi prossimi turni
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Prossimi Turni
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : shifts.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nessun turno programmato</p>
              <p className="text-sm text-gray-400 mt-2">
                Contatta il tuo supervisore per la pianificazione dei turni
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {shifts.map((shift) => (
                <li key={shift.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CalendarIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-lg font-semibold text-gray-900">
                          {format(parseISO(shift.start_time), 'EEEE d MMMM yyyy', { locale: it })}
                        </span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getShiftTypeColor(shift.shift_type)}`}>
                          {getShiftTypeLabel(shift.shift_type)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {format(parseISO(shift.start_time), 'HH:mm')} - {format(parseISO(shift.end_time), 'HH:mm')}
                        </div>
                        {shift.location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {shift.location}
                          </div>
                        )}
                      </div>
                      {shift.notes && (
                        <p className="mt-2 text-sm text-gray-500 italic">
                          {shift.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  )
}
