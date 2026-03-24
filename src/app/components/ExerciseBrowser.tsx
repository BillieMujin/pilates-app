'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Exercise, Favorite } from '@/lib/types'

/* ─── colour maps ─── */
const LAYER_COLORS: Record<string, string> = {
  warmup: '#6e5f66',
  layer1: '#8b3a62',
  layer2: '#b8860b',
  layer3: '#5c2751',
}
const LAYER_LABELS: Record<string, string> = {
  warmup: 'Warm-Up',
  layer1: 'Layer 1',
  layer2: 'Layer 2',
  layer3: 'Layer 3',
}
const LAYER_PASTELS: Record<string, string> = {
  warmup: '#faf8f7',
  layer1: '#fdf6f9',
  layer2: '#fdfaf2',
  layer3: '#faf5f9',
}
const LAYER_PASTEL_SELECTED: Record<string, string> = {
  warmup: '#f0eae8',
  layer1: '#f8e8f0',
  layer2: '#f8f0dc',
  layer3: '#f0e0ea',
}
const LAYER_PASTEL_BORDER: Record<string, string> = {
  warmup: '#e0d5d0',
  layer1: '#e8c0d4',
  layer2: '#e8d4a0',
  layer3: '#d8b4cc',
}

/* ─── posture symbols & meta ─── */
const POSTURE_META: Record<string, { label: string; symbol: string; color: string }> = {
  kyphosis:      { label: 'Kyphosis-Lordosis', symbol: '■', color: '#8b3a62' },
  kyphosis_only: { label: 'Kyphosis',          symbol: '◆', color: '#6b2d5b' },
  lordosis:      { label: 'Lordosis',           symbol: '●', color: '#b8860b' },
  flatback:      { label: 'Flat Back',          symbol: '▲', color: '#5a7a5e' },
  military:      { label: 'Military',           symbol: '★', color: '#3d6b5a' },
  swayback:      { label: 'Sway Back',          symbol: '◗', color: '#a05a4a' },
}

const ALL_LAYERS = ['warmup', 'layer1', 'layer2', 'layer3'] as const

/* ─── muscle keyword search mapping ─── */
const MUSCLE_KEYWORDS: Record<string, string[]> = {
  'Hamstrings': ['biceps femoris', 'semitendinosus', 'semimembranosus'],
  'Iliopsoas': ['psoas', 'iliacus', 'hip flexor'],
  'Obliques': ['external oblique', 'internal oblique'],
  'Quadriceps': ['vastus', 'quad'],
  'Gluteus maximus': ['glute max', 'gluteal'],
  'Gluteus medius & minimus': ['glute med', 'glute min', 'gluteus medius', 'gluteus minimus'],
  'Erector spinae': ['iliocostalis', 'longissimus', 'spinalis'],
  'Deep cervical flexors': ['longus colli', 'longus capitis', 'sternocleidomastoid', 'rectus capitis'],
  'Deep hip rotators': ['piriformis', 'obturator', 'gemellus'],
  'Rhomboids': ['rhomboid major', 'rhomboid minor'],
  'Rotatores': ['rotatores longus', 'rotatores brevis'],
  'Semispinalis': ['semispinalis capitis', 'semispinalis thoracis', 'semispinalis cervicis'],
  'Trapezius': ['upper trap', 'lower trap', 'middle trap'],
  'TFL': ['tensor fasciae latae'],
  'Rotator cuff': ['supraspinatus', 'infraspinatus', 'subscapularis', 'teres minor'],
  'Triceps': ['triceps brachii'],
  'Adductors': ['hip adductor', 'adductor longus', 'adductor brevis', 'adductor magnus', 'gracilis'],
  'Rectus abdominis': ['six pack', 'abs', 'abdominal'],
  'Transversus abdominis': ['transverse', 'deep core', 'ta '],
  'Multifidus': ['deep back stabiliser'],
  'Intercostals': ['intercostal', 'levatores costarum', 'scalenus', 'scalene'],
  'Serratus anterior': ['serratus'],
  'Pectoralis major': ['pec major', 'chest'],
  'Pectoralis minor': ['pec minor'],
}

/* ─── Dropdown component ─── */
function Dropdown({
  label,
  children,
  badge,
}: {
  label: string
  children: React.ReactNode
  badge?: number
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 text-[13px] font-medium px-4 py-2 rounded-xl border transition-all duration-200 ${
          badge && badge > 0
            ? 'bg-foreground text-surface border-foreground shadow-sm'
            : 'bg-surface text-foreground/80 border-border hover:border-foreground/20 hover:shadow-sm'
        }`}
      >
        {label}
        {badge !== undefined && badge > 0 && (
          <span className="bg-white/20 text-[11px] px-1.5 py-0.5 rounded-full font-semibold">{badge}</span>
        )}
        <svg
          className={`w-3.5 h-3.5 opacity-40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl border border-black/[0.06] shadow-xl shadow-black/[0.08] z-50 min-w-[240px] max-h-[360px] overflow-y-auto py-1.5">
          {children}
        </div>
      )}
    </div>
  )
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

  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set())
  const [activeMuscles, setActiveMuscles] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [activePosture, setActivePosture] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Favorite[]>(initialFavorites)
  const [togglingFav, setTogglingFav] = useState<Set<string>>(new Set())
  const [classPlan, setClassPlan] = useState<Set<string>>(new Set())
  const [showPlan, setShowPlan] = useState(false)

  const noLayerFilter = activeLayers.size === 0
  const noMuscleFilter = activeMuscles.size === 0

  const favIds = useMemo(
    () => new Set(favorites.map((f) => f.exercise_id)),
    [favorites]
  )

  /* ─── extract unique muscle groups ─── */
  const allMuscles = useMemo(() => {
    const set = new Set<string>()
    exercises.forEach((e) => {
      e.primary_muscles?.forEach((m) => set.add(m))
      e.secondary_muscles?.forEach((m) => set.add(m))
    })
    return Array.from(set).sort()
  }, [exercises])

  /* ─── layer toggle ─── */
  const toggleLayer = useCallback((layer: string) => {
    setActiveLayers((prev) => {
      const next = new Set(prev)
      if (next.has(layer)) next.delete(layer)
      else next.add(layer)
      return next
    })
  }, [])

  /* ─── muscle toggle ─── */
  const toggleMuscle = useCallback((muscle: string) => {
    setActiveMuscles((prev) => {
      const next = new Set(prev)
      if (next.has(muscle)) next.delete(muscle)
      else next.add(muscle)
      return next
    })
  }, [])

  /* ─── class plan toggle ─── */
  const togglePlanExercise = useCallback((id: string) => {
    setClassPlan((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearPlan = useCallback(() => setClassPlan(new Set()), [])

  /* ─── filtering with keyword-aware search ─── */
  const filtered = useMemo(() => {
    let list = exercises

    if (!noLayerFilter) {
      list = list.filter((e) => activeLayers.has(e.layer))
    }

    if (!noMuscleFilter) {
      list = list.filter((e) => {
        const allExMuscles = [...(e.primary_muscles || []), ...(e.secondary_muscles || [])]
        return allExMuscles.some((m) => activeMuscles.has(m))
      })
    }

    if (search.trim()) {
      const q = search.toLowerCase()

      // Find muscle groups that match the keyword
      const matchedGroups = new Set<string>()
      for (const [group, keywords] of Object.entries(MUSCLE_KEYWORDS)) {
        if (group.toLowerCase().includes(q) || keywords.some((k) => k.includes(q) || q.includes(k))) {
          matchedGroups.add(group.toLowerCase())
        }
      }

      list = list.filter((e) => {
        if (e.name.toLowerCase().includes(q)) return true
        const allExMuscles = [...(e.primary_muscles || []), ...(e.secondary_muscles || [])]
        if (allExMuscles.some((m) => m.toLowerCase().includes(q))) return true
        // Check if any of the exercise's muscles match a keyword-resolved group
        if (matchedGroups.size > 0 && allExMuscles.some((m) => matchedGroups.has(m.toLowerCase()))) return true
        return false
      })
    }

    if (activePosture) {
      list = list.filter((e) => {
        const p = e.postures as Record<string, string | null> | null
        return p && p[activePosture]
      })
    }

    return list
  }, [exercises, activeLayers, noLayerFilter, activeMuscles, noMuscleFilter, search, activePosture])

  /* ─── group by layer for display ─── */
  const groupedByLayer = useMemo(() => {
    const groups: Record<string, Exercise[]> = {}
    for (const layer of ALL_LAYERS) {
      const layerExercises = filtered.filter((e) => e.layer === layer)
      if (layerExercises.length > 0) groups[layer] = layerExercises
    }
    return groups
  }, [filtered])

  /* ─── stats ─── */
  const stats = useMemo(() => {
    const s: Record<string, number> = { warmup: 0, layer1: 0, layer2: 0, layer3: 0 }
    exercises.forEach((e) => { if (s[e.layer] !== undefined) s[e.layer]++ })
    return s
  }, [exercises])

  /* ─── class plan exercises (ordered) ─── */
  const planExercises = useMemo(() => exercises.filter((e) => classPlan.has(e.id)), [exercises, classPlan])

  /* ─── favourites toggle ─── */
  const toggleFav = useCallback(
    async (exerciseId: string) => {
      if (!user) return
      setTogglingFav((s) => new Set(s).add(exerciseId))

      if (favIds.has(exerciseId)) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('exercise_id', exerciseId)
        setFavorites((f) => f.filter((x) => x.exercise_id !== exerciseId))
      } else {
        const { data } = await supabase.from('favorites').insert({ user_id: user.id, exercise_id: exerciseId }).select().single()
        if (data) setFavorites((f) => [...f, data as Favorite])
      }

      setTogglingFav((s) => { const next = new Set(s); next.delete(exerciseId); return next })
    },
    [user, favIds, supabase]
  )

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-10">

      {/* ── Filter bar (sticky) ── */}
      <div className="sticky top-16 z-40 bg-background/90 backdrop-blur-xl -mx-5 sm:-mx-8 px-5 sm:px-8 pt-5 pb-4 mb-8">
        {/* Search */}
        <div className="relative mb-5">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-foreground/30"
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises, muscles, or muscle parts..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-black/[0.06] rounded-2xl text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 shadow-sm transition-all"
          />
        </div>

        {/* Dropdowns row */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          {/* Layer dropdown */}
          <Dropdown label="Layers" badge={activeLayers.size}>
            <button
              onClick={() => setActiveLayers(new Set())}
              className={`w-full text-left px-4 py-2 text-[13px] hover:bg-black/[0.03] transition ${
                noLayerFilter ? 'font-semibold text-primary' : 'text-foreground/70'
              }`}
            >
              All Layers
            </button>
            <div className="h-px bg-black/[0.04] mx-3 my-1" />
            {ALL_LAYERS.map((key) => {
              const active = activeLayers.has(key)
              return (
                <button
                  key={key}
                  onClick={() => toggleLayer(key)}
                  className="w-full text-left px-4 py-2 text-[13px] hover:bg-black/[0.03] transition flex items-center gap-3"
                >
                  <div className={`w-4 h-4 rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 transition-all ${
                    active ? 'border-primary bg-primary' : 'border-black/15'
                  }`}>
                    {active && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: LAYER_COLORS[key] }} />
                  <span className={`${active ? 'font-medium text-foreground' : 'text-foreground/70'}`}>{LAYER_LABELS[key]}</span>
                  <span className="text-[11px] text-foreground/30 ml-auto tabular-nums">{stats[key]}</span>
                </button>
              )
            })}
          </Dropdown>

          {/* Muscle dropdown */}
          <Dropdown label="Muscles" badge={activeMuscles.size}>
            <button
              onClick={() => setActiveMuscles(new Set())}
              className={`w-full text-left px-4 py-2 text-[13px] hover:bg-black/[0.03] transition ${
                noMuscleFilter ? 'font-semibold text-primary' : 'text-foreground/70'
              }`}
            >
              All Muscles
            </button>
            <div className="h-px bg-black/[0.04] mx-3 my-1" />
            {allMuscles.map((muscle) => {
              const active = activeMuscles.has(muscle)
              return (
                <button
                  key={muscle}
                  onClick={() => toggleMuscle(muscle)}
                  className="w-full text-left px-4 py-2 text-[13px] hover:bg-black/[0.03] transition flex items-center gap-3"
                >
                  <div className={`w-4 h-4 rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 transition-all ${
                    active ? 'border-primary bg-primary' : 'border-black/15'
                  }`}>
                    {active && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <span className={`truncate ${active ? 'font-medium text-foreground' : 'text-foreground/70'}`}>{muscle}</span>
                </button>
              )
            })}
          </Dropdown>

          {/* Divider */}
          <div className="w-px h-6 bg-black/[0.06]" />

          {/* Posture filter badges with symbols */}
          {Object.entries(POSTURE_META).map(([key, { label, symbol, color }]) => {
            const active = activePosture === key
            return (
              <button
                key={key}
                onClick={() => setActivePosture(active ? null : key)}
                className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                  active
                    ? 'text-white border-transparent shadow-sm scale-[1.02]'
                    : 'bg-white text-foreground/60 border-black/[0.06] hover:border-black/[0.12] hover:text-foreground/80 hover:shadow-sm'
                }`}
                style={active ? { backgroundColor: color } : undefined}
              >
                <span className="text-[13px] leading-none" style={active ? undefined : { color }}>{symbol}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            )
          })}
        </div>

        {/* Active filter pills */}
        {(!noLayerFilter || !noMuscleFilter) && (
          <div className="flex flex-wrap gap-1.5">
            {Array.from(activeLayers).map((layer) => (
              <span
                key={layer}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white"
                style={{ backgroundColor: LAYER_COLORS[layer] }}
              >
                {LAYER_LABELS[layer]}
                <button onClick={() => toggleLayer(layer)} className="hover:opacity-70 ml-0.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {Array.from(activeMuscles).map((muscle) => (
              <span
                key={muscle}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary"
              >
                {muscle}
                <button onClick={() => toggleMuscle(muscle)} className="hover:opacity-70 ml-0.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            <button
              onClick={() => { setActiveLayers(new Set()); setActiveMuscles(new Set()) }}
              className="text-[11px] text-foreground/30 hover:text-foreground/60 px-2 py-1 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Result count + Class Plan toggle ── */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-[13px] text-foreground/40 font-medium tracking-wide">
          {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowPlan(!showPlan)}
          className={`flex items-center gap-2 text-[13px] font-medium px-4 py-2 rounded-xl border transition-all duration-200 ${
            classPlan.size > 0
              ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
              : 'bg-white text-foreground/60 border-black/[0.06] hover:border-primary/30 hover:text-primary hover:shadow-sm'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          Class Plan{classPlan.size > 0 && ` (${classPlan.size})`}
        </button>
      </div>

      {/* ── Class Plan Panel ── */}
      {showPlan && (
        <div className="mb-8 bg-white rounded-2xl border border-black/[0.06] shadow-lg shadow-black/[0.04] overflow-hidden">
          <div className="px-6 py-5 border-b border-black/[0.04] flex items-center justify-between">
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">Class Plan</h3>
              <p className="text-[12px] text-foreground/40 mt-0.5">
                {classPlan.size === 0
                  ? 'Select exercises below to build your class'
                  : `${classPlan.size} exercise${classPlan.size !== 1 ? 's' : ''} selected`}
              </p>
            </div>
            {classPlan.size > 0 && (
              <button onClick={clearPlan} className="text-[12px] font-medium text-secondary hover:underline">
                Clear all
              </button>
            )}
          </div>
          {planExercises.length > 0 ? (
            <div className="p-5">
              {ALL_LAYERS.map((layer) => {
                const layerExercises = planExercises.filter((e) => e.layer === layer)
                if (layerExercises.length === 0) return null
                return (
                  <div key={layer} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LAYER_COLORS[layer] }} />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/30">{LAYER_LABELS[layer]}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {layerExercises.map((e) => (
                        <span
                          key={e.id}
                          className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-lg border"
                          style={{ backgroundColor: LAYER_PASTELS[e.layer], borderColor: LAYER_PASTEL_BORDER[e.layer] }}
                        >
                          {e.name}
                          <button onClick={() => togglePlanExercise(e.id)} className="text-foreground/30 hover:text-foreground/60 ml-0.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-foreground/30">Click the checkbox on any exercise to add it to your plan.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Exercise sections grouped by layer ── */}
      {Object.entries(groupedByLayer).map(([layer, layerExercises]) => (
        <div key={layer} className="mb-8">
          {/* Layer section header */}
          <div className="flex items-center gap-3 mb-3 px-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LAYER_COLORS[layer] }} />
            <h2 className="font-heading text-[15px] font-semibold text-foreground">{LAYER_LABELS[layer]}</h2>
            <span className="text-[12px] text-foreground/30 font-medium">
              {layerExercises.length}
            </span>
            <div className="flex-1 h-px bg-black/[0.04]" />
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {layerExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                expanded={expandedId === exercise.id}
                onToggle={() => setExpandedId(expandedId === exercise.id ? null : exercise.id)}
                isFav={favIds.has(exercise.id)}
                toggling={togglingFav.has(exercise.id)}
                onFav={() => toggleFav(exercise.id)}
                showFav={!!user}
                inPlan={classPlan.has(exercise.id)}
                onTogglePlan={() => togglePlanExercise(exercise.id)}
                onMuscleClick={(muscle) => {
                  setActiveMuscles(new Set([muscle]))
                  setExpandedId(null)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-24">
          <p className="text-foreground/30 text-lg font-light">No exercises match your filters.</p>
          <button
            onClick={() => { setActiveLayers(new Set()); setActiveMuscles(new Set()); setSearch(''); setActivePosture(null) }}
            className="mt-4 text-[13px] font-medium text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* ── Floating class plan bar ── */}
      {classPlan.size > 0 && !showPlan && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => setShowPlan(true)}
            className="flex items-center gap-3 bg-primary text-white px-6 py-3.5 rounded-2xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            <span className="font-semibold text-[14px]">View Class Plan ({classPlan.size})</span>
          </button>
        </div>
      )}
    </div>
  )
}

/* ================================================================
   EXERCISE CARD — Notion-inspired, Apple-clean
   ================================================================ */
interface CardProps {
  exercise: Exercise
  expanded: boolean
  onToggle: () => void
  isFav: boolean
  toggling: boolean
  onFav: () => void
  showFav: boolean
  inPlan: boolean
  onTogglePlan: () => void
  onMuscleClick: (muscle: string) => void
}

function ExerciseCard({
  exercise,
  expanded,
  onToggle,
  isFav,
  toggling,
  onFav,
  showFav,
  inPlan,
  onTogglePlan,
  onMuscleClick,
}: CardProps) {
  const layerColor = LAYER_COLORS[exercise.layer] ?? '#6e5f66'
  const pastel = inPlan ? LAYER_PASTEL_SELECTED[exercise.layer] : LAYER_PASTELS[exercise.layer]
  const borderColor = inPlan ? LAYER_PASTEL_BORDER[exercise.layer] : 'rgba(0,0,0,0.04)'
  const postures = exercise.postures as Record<string, string | null> | null

  return (
    <div
      className={`group rounded-2xl border overflow-hidden transition-all duration-200 ${
        expanded ? 'shadow-lg shadow-black/[0.06]' : 'hover:shadow-md hover:shadow-black/[0.04]'
      } ${inPlan ? 'ring-1 ring-primary/20' : ''}`}
      style={{ backgroundColor: pastel, borderColor }}
    >
      {/* ── Card header ── */}
      <div className="flex items-center">
        {/* Layer accent bar */}
        <div className="w-1 self-stretch rounded-l-2xl" style={{ backgroundColor: layerColor }} />

        {/* Checkbox */}
        <button
          onClick={onTogglePlan}
          className="shrink-0 px-3.5 py-4 cursor-pointer"
          title={inPlan ? 'Remove from class plan' : 'Add to class plan'}
        >
          <div className={`w-[22px] h-[22px] rounded-md border-[1.5px] flex items-center justify-center transition-all duration-200 ${
            inPlan
              ? 'bg-primary border-primary shadow-sm shadow-primary/20'
              : 'border-black/15 bg-white group-hover:border-primary/30'
          }`}>
            {inPlan && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </div>
        </button>

        {/* Main clickable area */}
        <button
          onClick={onToggle}
          className="flex-1 text-left py-3.5 pr-2 flex items-center gap-3 min-w-0"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h3 className="font-heading text-[16px] font-semibold text-foreground truncate leading-tight">
                {exercise.name}
              </h3>
              {exercise.reps && (
                <span className="shrink-0 text-[11px] font-medium text-foreground/30 bg-white/80 px-2 py-0.5 rounded-md">
                  {exercise.reps}
                </span>
              )}
            </div>

            {/* Posture symbols on card */}
            {postures && (
              <div className="flex gap-1 mt-1">
                {Object.entries(POSTURE_META).map(([key, { symbol, color }]) =>
                  postures[key] ? (
                    <span key={key} className="text-[10px] leading-none opacity-60" style={{ color }} title={POSTURE_META[key].label}>{symbol}</span>
                  ) : null
                )}
              </div>
            )}
          </div>

          {/* Right side: fav + expand toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            {showFav && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onFav() }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onFav() } }}
                className={`p-1.5 rounded-lg transition-all ${toggling ? 'scale-90 opacity-50' : 'hover:scale-110 hover:bg-black/[0.03]'}`}
              >
                {isFav ? (
                  <svg className="w-[18px] h-[18px] text-secondary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                ) : (
                  <svg className="w-[18px] h-[18px] text-foreground/20 hover:text-secondary transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                )}
              </span>
            )}

            {/* Expand toggle — Notion-style toggle button */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
              expanded ? 'bg-primary/10 text-primary' : 'text-foreground/20 group-hover:bg-black/[0.04] group-hover:text-foreground/40'
            }`}>
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        </button>
      </div>

      {/* ── Expandable detail ── */}
      <div className={`card-expand ${expanded ? 'open' : ''}`}>
        <div>
          <div className="px-5 pb-5 space-y-5 ml-1">
            <div className="h-px bg-black/[0.04]" />

            {exercise.start_position && (
              <Section title="Starting Position">
                <div className="text-[13px] text-foreground/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: exercise.start_position }} />
              </Section>
            )}

            {(exercise.inhale || exercise.exhale) && (
              <BreathingSection inhale={exercise.inhale} exhale={exercise.exhale} breathNote={exercise.breath_note} />
            )}

            {(exercise.primary_muscles?.length > 0 || exercise.secondary_muscles?.length > 0) && (
              <Section title="Muscles">
                <div className="flex flex-wrap gap-1.5">
                  {exercise.primary_muscles?.map((m) => (
                    <button key={m} onClick={() => onMuscleClick(m)} className="text-[12px] font-medium px-2.5 py-1 rounded-lg bg-primary/8 text-primary cursor-pointer hover:bg-primary/15 transition-colors">{m}</button>
                  ))}
                  {exercise.secondary_muscles?.map((m) => (
                    <button key={m} onClick={() => onMuscleClick(m)} className="text-[12px] font-medium px-2.5 py-1 rounded-lg bg-black/[0.04] text-foreground/50 cursor-pointer hover:bg-black/[0.07] transition-colors">{m}</button>
                  ))}
                </div>
              </Section>
            )}

            {exercise.props && exercise.props.length > 0 && (
              <Section title="Props">
                <div className="space-y-2">
                  {exercise.props.map((prop, i) => (
                    <div key={i} className="bg-white/70 rounded-xl p-3.5 border border-black/[0.04]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-foreground">{prop.name}</span>
                        {prop.tool && (
                          <span className="text-[11px] text-foreground/40 bg-black/[0.03] px-2 py-0.5 rounded-md">{prop.tool}</span>
                        )}
                      </div>
                      {prop.for && (
                        <p className="text-[12px] text-foreground/50">
                          <span className="font-medium">For:</span> {Array.isArray(prop.for) ? prop.for.map((p: string) => POSTURE_META[p]?.label ?? p).join(', ') : prop.for}
                        </p>
                      )}
                      {prop.tip && (
                        <p className="text-[12px] text-foreground/50 mt-0.5"><span className="font-medium">Tip:</span> {prop.tip}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {postures && Object.entries(postures).some(([, v]) => v) && (
              <Section title="Postural Adjustments">
                <div className="space-y-3">
                  {Object.entries(POSTURE_META).map(([key, { label, symbol, color }]) => {
                    const val = postures[key]
                    if (!val) return null
                    return (
                      <div key={key} className="flex gap-3 items-start">
                        <span className="mt-0.5 shrink-0 text-sm leading-none" style={{ color }}>{symbol}</span>
                        <div>
                          <span className="text-[12px] font-semibold text-foreground">{label}</span>
                          <p className="text-[13px] text-foreground/60 leading-relaxed">{val}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Breathing section: supports 2-breath and 4-breath patterns ─── */
function BreathingSection({ inhale, exhale, breathNote }: { inhale: string; exhale: string; breathNote: string | null }) {
  const inhalePhases = inhale ? inhale.split('|||') : []
  const exhalePhases = exhale ? exhale.split('|||') : []
  const isMultiPhase = inhalePhases.length > 1 || exhalePhases.length > 1

  // Interleave: inhale1, exhale1, inhale2, exhale2...
  const steps: { type: 'in' | 'out'; text: string; num: number }[] = []
  const maxLen = Math.max(inhalePhases.length, exhalePhases.length)
  for (let i = 0; i < maxLen; i++) {
    if (inhalePhases[i]?.trim()) steps.push({ type: 'in', text: inhalePhases[i].trim(), num: steps.length + 1 })
    if (exhalePhases[i]?.trim()) steps.push({ type: 'out', text: exhalePhases[i].trim(), num: steps.length + 1 })
  }

  return (
    <>
      <Section title={isMultiPhase ? `Breathing  ·  ${steps.length}-breath pattern` : 'Breathing'}>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className={`mt-0.5 shrink-0 text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md min-w-[38px] text-center ${
                step.type === 'in'
                  ? 'bg-[#5a6b8a]/10 text-[#5a6b8a]'
                  : 'bg-[#3d6b5a]/10 text-[#3d6b5a]'
              }`}>
                {isMultiPhase && <span className="mr-0.5 tabular-nums">{step.num}.</span>}
                {step.type === 'in' ? 'In' : 'Out'}
              </span>
              <p className="text-[13px] text-foreground/70 leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </Section>
      {breathNote && (
        <Section title="Teaching Cues">
          <p className="text-[13px] text-foreground/50 leading-relaxed">{breathNote}</p>
        </Section>
      )}
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] font-bold uppercase tracking-widest text-foreground/25 mb-2.5">{title}</h4>
      {children}
    </div>
  )
}
