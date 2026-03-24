'use client'

import { useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Exercise, Favorite } from '@/lib/types'

/* ─── colour maps ─── */
const LAYER_COLORS: Record<string, string> = {
  warmup: '#6b7280',
  layer1: '#e8574a',
  layer2: '#d4a017',
  layer3: '#991b1b',
}
const LAYER_LABELS: Record<string, string> = {
  warmup: 'Warm-Up',
  layer1: 'Layer 1',
  layer2: 'Layer 2',
  layer3: 'Layer 3',
}
const POSTURE_META: Record<string, { label: string; color: string }> = {
  kyphosis: { label: 'Kyphosis-Lordosis', color: '#a855f7' },
  lordosis: { label: 'Lordosis', color: '#f59e0b' },
  flatback: { label: 'Flat Back', color: '#06b6d4' },
  military: { label: 'Military', color: '#10b981' },
  swayback: { label: 'Sway Back', color: '#ef4444' },
}

/* ─── props ─── */
interface Props {
  exercises: Exercise[]
  user: User | null
  initialFavorites: Favorite[]
}

export default function ExerciseBrowser({
  exercises,
  user,
  initialFavorites,
}: Props) {
  const supabase = createClient()

  const [layer, setLayer] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [activePosture, setActivePosture] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Favorite[]>(initialFavorites)
  const [togglingFav, setTogglingFav] = useState<Set<string>>(new Set())

  const favIds = useMemo(
    () => new Set(favorites.map((f) => f.exercise_id)),
    [favorites]
  )

  /* ─── filtering ─── */
  const filtered = useMemo(() => {
    let list = exercises

    if (layer !== 'all') {
      list = list.filter((e) => e.layer === layer)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.primary_muscles?.some((m) => m.toLowerCase().includes(q)) ||
          e.secondary_muscles?.some((m) => m.toLowerCase().includes(q))
      )
    }

    if (activePosture) {
      list = list.filter((e) => {
        const p = e.postures as Record<string, string | null> | null
        return p && p[activePosture]
      })
    }

    return list
  }, [exercises, layer, search, activePosture])

  /* ─── stats ─── */
  const stats = useMemo(() => {
    const s: Record<string, number> = {
      warmup: 0,
      layer1: 0,
      layer2: 0,
      layer3: 0,
    }
    exercises.forEach((e) => {
      if (s[e.layer] !== undefined) s[e.layer]++
    })
    return s
  }, [exercises])

  /* ─── favourites toggle ─── */
  const toggleFav = useCallback(
    async (exerciseId: string) => {
      if (!user) return
      setTogglingFav((s) => new Set(s).add(exerciseId))

      if (favIds.has(exerciseId)) {
        // remove
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('exercise_id', exerciseId)
        setFavorites((f) => f.filter((x) => x.exercise_id !== exerciseId))
      } else {
        // add
        const { data } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, exercise_id: exerciseId })
          .select()
          .single()
        if (data) setFavorites((f) => [...f, data as Favorite])
      }

      setTogglingFav((s) => {
        const next = new Set(s)
        next.delete(exerciseId)
        return next
      })
    },
    [user, favIds, supabase]
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* ── Stats bar ── */}
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(stats).map(([key, count]) => (
          <div
            key={key}
            className="flex items-center gap-2 bg-surface rounded-xl px-4 py-2 shadow-sm border border-border"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: LAYER_COLORS[key] }}
            />
            <span className="text-sm font-medium text-foreground">
              {LAYER_LABELS[key]}
            </span>
            <span className="text-sm text-muted">{count}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 bg-surface rounded-xl px-4 py-2 shadow-sm border border-border">
          <span className="text-sm font-medium text-foreground">Total</span>
          <span className="text-sm text-muted">{exercises.length}</span>
        </div>
      </div>

      {/* ── Filter bar (sticky) ── */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-lg -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mb-6 border-b border-border">
        {/* search */}
        <div className="relative mb-4">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises or muscles..."
            className="w-full pl-11 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>

        {/* layer buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          {['all', 'warmup', 'layer1', 'layer2', 'layer3'].map((key) => {
            const active = layer === key
            const label = key === 'all' ? 'All' : LAYER_LABELS[key]
            return (
              <button
                key={key}
                onClick={() => setLayer(key)}
                className={`flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-full border transition-all ${
                  active
                    ? 'bg-foreground text-surface border-foreground shadow-sm'
                    : 'bg-surface text-foreground border-border hover:border-foreground/30'
                }`}
              >
                {key !== 'all' && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: LAYER_COLORS[key] }}
                  />
                )}
                {label}
              </button>
            )
          })}
        </div>

        {/* posture badges */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(POSTURE_META).map(([key, { label, color }]) => {
            const active = activePosture === key
            return (
              <button
                key={key}
                onClick={() => setActivePosture(active ? null : key)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border transition-all ${
                  active
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-surface text-foreground border-border hover:border-foreground/30'
                }`}
                style={active ? { backgroundColor: color } : undefined}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Result count ── */}
      <p className="text-sm text-muted mb-4">
        Showing {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* ── Exercise grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            expanded={expandedId === exercise.id}
            onToggle={() =>
              setExpandedId(expandedId === exercise.id ? null : exercise.id)
            }
            isFav={favIds.has(exercise.id)}
            toggling={togglingFav.has(exercise.id)}
            onFav={() => toggleFav(exercise.id)}
            showFav={!!user}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-lg text-muted">No exercises match your filters.</p>
          <button
            onClick={() => {
              setLayer('all')
              setSearch('')
              setActivePosture(null)
            }}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   EXERCISE CARD
   ================================================================ */
interface CardProps {
  exercise: Exercise
  expanded: boolean
  onToggle: () => void
  isFav: boolean
  toggling: boolean
  onFav: () => void
  showFav: boolean
}

function ExerciseCard({
  exercise,
  expanded,
  onToggle,
  isFav,
  toggling,
  onFav,
  showFav,
}: CardProps) {
  const layerColor = LAYER_COLORS[exercise.layer] ?? '#6b7280'
  const postures = exercise.postures as Record<string, string | null> | null

  return (
    <div
      className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden transition-shadow hover:shadow-md"
      style={{ borderLeftWidth: 4, borderLeftColor: layerColor }}
    >
      {/* ── Card header (always visible) ── */}
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-start gap-3"
      >
        {/* Layer dot */}
        <span
          className="mt-1.5 w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: layerColor }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-heading text-lg font-semibold text-foreground truncate">
              {exercise.name}
            </h3>
            {exercise.reps && (
              <span className="shrink-0 text-xs font-medium bg-background text-muted px-2 py-0.5 rounded-full border border-border">
                {exercise.reps}
              </span>
            )}
          </div>

          {/* Preview line */}
          <p className="text-sm text-muted line-clamp-1">
            {exercise.start_position?.replace(/<[^>]*>/g, '').slice(0, 100)}
          </p>

          {/* Posture dots */}
          {postures && (
            <div className="flex gap-1.5 mt-2">
              {Object.entries(POSTURE_META).map(([key, { color }]) =>
                postures[key] ? (
                  <span
                    key={key}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                    title={POSTURE_META[key].label}
                  />
                ) : null
              )}
            </div>
          )}
        </div>

        {/* Favourite heart + chevron */}
        <div className="flex items-center gap-2 shrink-0 mt-1">
          {showFav && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onFav()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation()
                  onFav()
                }
              }}
              className={`transition-transform ${toggling ? 'scale-90 opacity-50' : 'hover:scale-110'}`}
            >
              {isFav ? (
                <svg
                  className="w-5 h-5 text-secondary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-muted hover:text-secondary transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              )}
            </span>
          )}

          <svg
            className={`w-5 h-5 text-muted transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </div>
      </button>

      {/* ── Expandable detail ── */}
      <div className={`card-expand ${expanded ? 'open' : ''}`}>
        <div>
          <div className="px-5 pb-5 space-y-5 border-t border-border pt-4">
            {/* Start position */}
            {exercise.start_position && (
              <Section title="Starting Position">
                <div
                  className="text-sm text-foreground/90 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: exercise.start_position,
                  }}
                />
              </Section>
            )}

            {/* Breathing */}
            {(exercise.inhale || exercise.exhale) && (
              <Section title="Breathing Pattern">
                <div className="space-y-2">
                  {exercise.inhale && (
                    <div className="flex gap-3 items-start">
                      <span
                        className="mt-0.5 shrink-0 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: '#3b82f620',
                          color: '#3b82f6',
                        }}
                      >
                        Inhale
                      </span>
                      <p className="text-sm text-foreground/90">
                        {exercise.inhale}
                      </p>
                    </div>
                  )}
                  {exercise.exhale && (
                    <div className="flex gap-3 items-start">
                      <span
                        className="mt-0.5 shrink-0 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: '#05966920',
                          color: '#059669',
                        }}
                      >
                        Exhale
                      </span>
                      <p className="text-sm text-foreground/90">
                        {exercise.exhale}
                      </p>
                    </div>
                  )}
                  {exercise.breath_note && (
                    <p className="text-xs text-muted italic mt-1">
                      {exercise.breath_note}
                    </p>
                  )}
                </div>
              </Section>
            )}

            {/* Muscles */}
            {(exercise.primary_muscles?.length > 0 ||
              exercise.secondary_muscles?.length > 0) && (
              <Section title="Muscle Engagement">
                <div className="flex flex-wrap gap-1.5">
                  {exercise.primary_muscles?.map((m) => (
                    <span
                      key={m}
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: '#2d6a4f18',
                        color: '#2d6a4f',
                      }}
                    >
                      {m}
                    </span>
                  ))}
                  {exercise.secondary_muscles?.map((m) => (
                    <span
                      key={m}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-black/5 text-muted"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Props */}
            {exercise.props && exercise.props.length > 0 && (
              <Section title="Props & Adjustments">
                <div className="space-y-3">
                  {exercise.props.map((prop, i) => (
                    <div
                      key={i}
                      className="bg-background rounded-xl p-3 border border-border"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">
                          {prop.name}
                        </span>
                        {prop.tool && (
                          <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded-full border border-border">
                            {prop.tool}
                          </span>
                        )}
                      </div>
                      {prop.for && (
                        <p className="text-xs text-muted">
                          <span className="font-medium">For:</span> {prop.for}
                        </p>
                      )}
                      {prop.tip && (
                        <p className="text-xs text-muted mt-0.5">
                          <span className="font-medium">Tip:</span> {prop.tip}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Posture adjustments */}
            {postures &&
              Object.entries(postures).some(([, v]) => v) && (
                <Section title="Postural Adjustments">
                  <div className="space-y-2">
                    {Object.entries(POSTURE_META).map(
                      ([key, { label, color }]) => {
                        const val = postures[key]
                        if (!val) return null
                        return (
                          <div key={key} className="flex gap-3 items-start">
                            <span
                              className="mt-0.5 shrink-0 w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <div>
                              <span className="text-xs font-semibold text-foreground">
                                {label}
                              </span>
                              <p className="text-sm text-foreground/80">
                                {val}
                              </p>
                            </div>
                          </div>
                        )
                      }
                    )}
                  </div>
                </Section>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Tiny section wrapper ── */
function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
        {title}
      </h4>
      {children}
    </div>
  )
}
