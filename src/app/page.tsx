import { createClient } from '@/lib/supabase/server'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ExerciseBrowser from './components/ExerciseBrowser'
import type { Exercise, Favorite, ClassPlan } from '@/lib/types'

export default async function Home() {
  const supabase = await createClient()

  // Fetch exercises ordered by sort_order
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .order('sort_order', { ascending: true })

  // Fetch current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch favorites and saved plans if logged in
  let favorites: Favorite[] = []
  let savedPlans: ClassPlan[] = []
  if (user) {
    const [favResult, planResult] = await Promise.all([
      supabase.from('favorites').select('*').eq('user_id', user.id),
      supabase.from('class_plans').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    ])
    favorites = favResult.data ?? []
    savedPlans = planResult.data ?? []
  }

  return (
    <>
      <Navbar user={user} />
      <main className="flex-1">
        {/* Hero header */}
        <div className="bg-surface border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Essential Matwork
            </h1>
            <p className="text-muted text-base sm:text-lg max-w-2xl">
              Your complete reference for Essential Matwork exercises.
              Browse by layer, search by name or muscle, and study
              breathing patterns and postural adjustments.
            </p>
          </div>
        </div>

        <ExerciseBrowser
          exercises={(exercises as Exercise[]) ?? []}
          user={user}
          initialFavorites={favorites}
          initialSavedPlans={savedPlans}
        />
      </main>
      <Footer />
    </>
  )
}
