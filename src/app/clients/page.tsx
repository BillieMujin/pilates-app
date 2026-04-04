import { createClient } from '@/lib/supabase/server'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ClientList from '../components/ClientList'
import type { Client } from '@/lib/types'

export default async function ClientsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let clients: Client[] = []
  if (user) {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    clients = data ?? []
  }

  // Fetch last assessment per client
  let assessmentMap: Record<string, { date: string; posture: string | null }> = {}
  if (user && clients.length > 0) {
    const { data: assessments } = await supabase
      .from('postural_assessments')
      .select('client_id, assessment_date, confirmed_posture, suggested_posture')
      .in('client_id', clients.map(c => c.id))
      .order('assessment_date', { ascending: false })

    if (assessments) {
      for (const a of assessments) {
        if (a.client_id && !assessmentMap[a.client_id]) {
          assessmentMap[a.client_id] = {
            date: a.assessment_date,
            posture: a.confirmed_posture || a.suggested_posture,
          }
        }
      }
    }
  }

  return (
    <>
      <Navbar user={user} />
      <main className="flex-1">
        <div className="bg-surface border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">
              Clients
            </h1>
            <p className="text-muted text-sm sm:text-base">
              Manage your clients, their intake forms, assessments, and class plans.
            </p>
          </div>
        </div>
        <ClientList clients={clients} assessmentMap={assessmentMap} />
      </main>
      <Footer />
    </>
  )
}
