import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { RefreshCw, Clock, Check, X, AlertCircle } from 'lucide-react'

interface ShiftSwap {
  id: string
  requested_by_id: string
  swap_with_id: string | null
  original_shift_id: string
  target_shift_id: string | null
  status: 'pending' | 'accepted_by_operator' | 'approved' | 'rejected' | 'cancelled'
  reason: string | null
  created_at: string
  approved_at: string | null
  requested_by: {
    first_name: string
    last_name: string
  }
  swap_with: {
    first_name: string
    last_name: string
  } | null
  original_shift: {
    start_time: string
    end_time: string
    shift_type: string
    location: string | null
  }
}

export default function SwapRequests() {
  const { profile } = useAuth()
  const [swaps, setSwaps] = useState<ShiftSwap[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  useEffect(() => {
    loadSwapRequests()

    // Subscribe to changes
    const subscription = supabase
      .channel('swap_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_swaps' }, () => {
        loadSwapRequests()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [profile, filter])

  async function loadSwapRequests() {
    if (!profile) return
    setLoading(true)

    try {
      let query = supabase
        .from('shift_swaps')
        .select(`
          *,
          requested_by:requested_by_id (first_name, last_name),
          swap_with:swap_with_id (first_name, last_name),
          original_shift:original_shift_id (start_time, end_time, shift_type, location)
        `)
        .or(`requested_by_id.eq.${profile.id},swap_with_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })

      if (filter === 'pending') {
        query = query.in('status', ['pending', 'accepted_by_operator'])
      } else if (filter === 'completed') {
        query = query.in('status', ['approved', 'rejected', 'cancelled'])
      }

      const { data, error } = await query

      if (error) throw error
      setSwaps(data || [])
    } catch (error) {
      console.error('Error loading swap requests:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAcceptSwap(swapId: string) {
    try {
      const { error } = await supabase
        .from('shift_swaps')
        // @ts-expect-error - Supabase type inference issue with update
        .update({
          status: 'accepted_by_operator',
          swap_with_id: profile?.id || null
        })
        .eq('id', swapId)

      if (error) throw error
      await loadSwapRequests()
    } catch (error) {
      console.error('Error accepting swap:', error)
      alert('Errore nell\'accettare la richiesta')
    }
  }

  async function handleRejectSwap(swapId: string) {
    try {
      const { error } = await supabase
        .from('shift_swaps')
        // @ts-expect-error - Supabase type inference issue with update
        .update({ status: 'rejected' })
        .eq('id', swapId)

      if (error) throw error
      await loadSwapRequests()
    } catch (error) {
      console.error('Error rejecting swap:', error)
      alert('Errore nel rifiutare la richiesta')
    }
  }

  async function handleApproveSwap(swapId: string) {
    if (profile?.role !== 'admin' && profile?.role !== 'supervisor') return

    try {
      const { error } = await supabase
        .from('shift_swaps')
        // @ts-expect-error - Supabase type inference issue with update
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: profile.id
        })
        .eq('id', swapId)

      if (error) throw error
      await loadSwapRequests()
    } catch (error) {
      console.error('Error approving swap:', error)
      alert('Errore nell\'approvare la richiesta')
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'In attesa'
      case 'accepted_by_operator': return 'Accettato - In attesa di approvazione'
      case 'approved': return 'Approvato'
      case 'rejected': return 'Rifiutato'
      case 'cancelled': return 'Annullato'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted_by_operator': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Richieste Cambio Turno</h1>
            <p className="mt-2 text-gray-600">
              Gestisci le richieste di cambio turno
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Tutte
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 text-sm font-medium border-l border-gray-300 ${
                  filter === 'pending'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                In Attesa
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 text-sm font-medium border-l border-gray-300 ${
                  filter === 'completed'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Completate
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : swaps.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nessuna richiesta
            </h3>
            <p className="text-gray-500">
              Non ci sono richieste di cambio turno al momento
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {swaps.map((swap) => {
              const isRequester = swap.requested_by_id === profile?.id
              const canApprove = (profile?.role === 'admin' || profile?.role === 'supervisor') &&
                                 swap.status === 'accepted_by_operator'

              return (
                <div key={swap.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <RefreshCw className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {isRequester ? 'Hai richiesto un cambio turno' :
                             `${swap.requested_by.first_name} ${swap.requested_by.last_name} ha richiesto un cambio turno`}
                          </h3>
                        </div>
                        <div className="text-sm text-gray-500">
                          Richiesta il {format(parseISO(swap.created_at), 'dd MMMM yyyy HH:mm', { locale: it })}
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(swap.status)}`}>
                        {getStatusLabel(swap.status)}
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Turno da scambiare:</div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {format(parseISO(swap.original_shift.start_time), 'dd/MM/yyyy HH:mm')} -
                          {format(parseISO(swap.original_shift.end_time), 'HH:mm')}
                        </div>
                        <span className="px-2 py-1 bg-white rounded text-xs font-medium">
                          {getShiftTypeLabel(swap.original_shift.shift_type)}
                        </span>
                        {swap.original_shift.location && (
                          <span className="text-gray-500">{swap.original_shift.location}</span>
                        )}
                      </div>
                    </div>

                    {swap.reason && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-1">Motivazione:</div>
                        <p className="text-sm text-gray-600 italic">{swap.reason}</p>
                      </div>
                    )}

                    {/* Azioni */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                      {swap.status === 'pending' && !isRequester && (
                        <>
                          <button
                            onClick={() => handleRejectSwap(swap.id)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Rifiuta
                          </button>
                          <button
                            onClick={() => handleAcceptSwap(swap.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Accetta
                          </button>
                        </>
                      )}

                      {canApprove && (
                        <>
                          <button
                            onClick={() => handleRejectSwap(swap.id)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Rifiuta
                          </button>
                          <button
                            onClick={() => handleApproveSwap(swap.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Approva Cambio
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
