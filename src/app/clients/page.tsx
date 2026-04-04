import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
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
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true })
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">
                  Clients
                </h1>
                <p className="text-muted text-sm sm:text-base">
                  Manage your clients, their intake forms, assessments, and class plans.
                </p>
              </div>
              <Link
                href="/assessment"
                className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground/50 hover:text-primary bg-white border border-border hover:border-primary/30 px-4 py-2 rounded-xl transition-all mt-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Postural Assessment
              </Link>
            </div>
          </div>
        </div>
        <ClientList clients={clients} assessmentMap={assessmentMap} />
      </main>
      <Footer />
    </>
  )
}
