import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '../components/Navbar'
import AssessmentWizard from '../components/AssessmentWizard'
import type { Exercise, PosturalAssessment } from '@/lib/types'

export default async function AssessmentPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch saved assessments
  const { data: assessments } = await supabase
    .from('postural_assessments')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  // Fetch exercises for corrective recommendations
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <>
      <Navbar user={user} />
      <main className="flex-1">
        <div className="bg-surface border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Postural Assessment
            </h1>
            <p className="text-muted text-base sm:text-lg max-w-2xl">
              Conduct a systematic postural analysis. Identify deviations,
              detect posture types, and get tailored corrective exercise
              recommendations.
            </p>
          </div>
        </div>

        <AssessmentWizard
          user={user}
          savedAssessments={(assessments as PosturalAssessment[]) ?? []}
          exercises={(exercises as Exercise[]) ?? []}
        />
      </main>
    </>
  )
}
