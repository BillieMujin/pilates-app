import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import ClientProfile from '../../components/ClientProfile'
import type { Client, PosturalAssessment, ClientClassPlan } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Fetch client
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!client) notFound()

  // Fetch assessments for this client
  const { data: assessments } = await supabase
    .from('postural_assessments')
    .select('*')
    .eq('client_id', id)
    .order('assessment_date', { ascending: false })

  // Fetch class plans for this client
  const { data: classPlans } = await supabase
    .from('client_class_plans')
    .select('*')
    .eq('client_id', id)
    .order('updated_at', { ascending: false })

  return (
    <>
      <Navbar user={user} />
      <main className="flex-1">
        <ClientProfile
          client={client as Client}
          assessments={(assessments as PosturalAssessment[]) ?? []}
          classPlans={(classPlans as ClientClassPlan[]) ?? []}
        />
      </main>
      <Footer />
    </>
  )
}
