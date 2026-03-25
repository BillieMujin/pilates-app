'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Exercise, Favorite, ClassPlan } from '@/lib/types'

/* ─── colour maps ─── */
const LAYER_COLORS: Record<string, string> = {
  warmup: '#7a6a72',
  layer1: '#8a6d9a',
  layer2: '#c98a24',
  layer3: '#7a9a80',
}
const LAYER_LABELS: Record<string, string> = {
  warmup: 'Warm-Up',
  layer1: 'Layer 1',
  layer2: 'Layer 2',
  layer3: 'Layer 3',
}
const LAYER_PASTELS: Record<string, string> = {
  warmup: '#f5f2f0',
  layer1: '#f3eef6',
  layer2: '#fdf6ea',
  layer3: '#eaf0eb',
}
const LAYER_PASTEL_SELECTED: Record<string, string> = {
  warmup: '#ebe5e0',
  layer1: '#e8ddef',
  layer2: '#f4e8cc',
  layer3: '#dce6dd',
}
const LAYER_PASTEL_BORDER: Record<string, string> = {
  warmup: '#d8ccc5',
  layer1: '#cdb8db',
  layer2: '#e0cc94',
  layer3: '#b8cfba',
}

/* ─── posture: roman numerals, single colour ─── */
const POSTURE_SYMBOL_COLOR = '#6b2d5b'
const POSTURE_META: Record<string, { label: string; numeral: string }> = {
  kyphosis:      { label: 'Kyphosis-Lordosis', numeral: 'I' },
  kyphosis_only: { label: 'Kyphosis',          numeral: 'II' },
  lordosis:      { label: 'Lordosis',           numeral: 'III' },
  flatback:      { label: 'Flat Back',          numeral: 'IV' },
  military:      { label: 'Military',           numeral: 'V' },
  swayback:      { label: 'Sway Back',          numeral: 'VI' },
}

const ALL_LAYERS = ['warmup', 'layer1', 'layer2', 'layer3'] as const
const POSTURE_KEYS = ['kyphosis', 'kyphosis_only', 'lordosis', 'flatback', 'military', 'swayback'] as const

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
  'Transversus abdominis': ['transverse', 'deep core'],
  'Multifidus': ['deep back stabiliser'],
  'Intercostals': ['intercostal', 'levatores costarum'],
  'Scalenes': ['scalenus', 'scalene'],
  'Serratus anterior': ['serratus anterior', 'serratus ant'],
  'Serratus posterior superior': ['serratus posterior sup', 'serratus posterior'],
  'Serratus posterior inferior': ['serratus posterior inf'],
  'Pectoralis major': ['pec major', 'chest'],
  'Pectoralis minor': ['pec minor'],
}

/* ─── Dropdown component (mobile-aware positioning) ─── */
function Dropdown({ label, children, badge, align = 'left' }: { label: string; children: React.ReactNode; badge?: number; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [mobileStyle, setMobileStyle] = useState<React.CSSProperties | null>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // On mobile, use fixed positioning to avoid overflow
  useEffect(() => {
    if (open && ref.current && window.innerWidth < 640) {
      const rect = ref.current.getBoundingClientRect()
      setMobileStyle({ position: 'fixed', top: rect.bottom + 6, left: 12, right: 12 })
    } else {
      setMobileStyle(null)
    }
  }, [open])

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
        <svg className={`w-3.5 h-3.5 opacity-40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div
          className={`bg-white rounded-xl border border-black/[0.06] shadow-xl shadow-black/[0.08] z-50 max-h-[360px] overflow-y-auto py-1.5 ${
            mobileStyle ? '' : `absolute top-full mt-1.5 min-w-[220px] ${align === 'right' ? 'right-0' : 'left-0'}`
          }`}
          style={mobileStyle || undefined}
        >
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
  initialSavedPlans: ClassPlan[]
}

export default function ExerciseBrowser({ exercises, user, initialFavorites, initialSavedPlans }: Props) {
  const supabase = createClient()

  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set())
  const [activeMuscles, setActiveMuscles] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [activePosture, setActivePosture] = useState<string | null>(null)
  const [activeProp, setActiveProp] = useState<string | null>(null)
  const [activePropCategory, setActivePropCategory] = useState<string | null>(null)
  const [showFavsOnly, setShowFavsOnly] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Favorite[]>(initialFavorites)
  const [togglingFav, setTogglingFav] = useState<Set<string>>(new Set())
  const [classPlan, setClassPlan] = useState<Set<string>>(new Set())
  const [showPlan, setShowPlan] = useState(false)
  const [savedPlans, setSavedPlans] = useState<ClassPlan[]>(initialSavedPlans)
  const [planName, setPlanName] = useState('')
  const [savingPlan, setSavingPlan] = useState(false)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const noLayerFilter = activeLayers.size === 0
  const noMuscleFilter = activeMuscles.size === 0

  const favIds = useMemo(() => new Set(favorites.map((f) => f.exercise_id)), [favorites])

  /* ─── extract unique muscle groups ─── */
  const allMuscles = useMemo(() => {
    const set = new Set<string>()
    exercises.forEach((e) => {
      e.primary_muscles?.forEach((m) => set.add(m))
      e.secondary_muscles?.forEach((m) => set.add(m))
    })
    return Array.from(set).sort()
  }, [exercises])

  /* ─── extract unique props ─── */
  const allProps = useMemo(() => {
    const set = new Set<string>()
    exercises.forEach((e) => {
      e.props?.forEach((p) => { if (p.tool) set.add(p.tool) })
    })
    return Array.from(set).sort()
  }, [exercises])

  /* ─── search suggestions ─── */
  const searchSuggestions = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (q.length < 2) return []

    const results: { type: 'exercise' | 'muscle' | 'prop'; label: string; value: string }[] = []

    // Match exercises
    exercises.forEach((e) => {
      if (e.name.toLowerCase().includes(q)) {
        results.push({ type: 'exercise', label: e.name, value: e.name })
      }
    })

    // Match muscles (direct + keyword)
    allMuscles.forEach((m) => {
      if (m.toLowerCase().includes(q)) {
        results.push({ type: 'muscle', label: m, value: m })
      }
    })
    // Keyword matches
    for (const [group, keywords] of Object.entries(MUSCLE_KEYWORDS)) {
      if (keywords.some((k) => k.includes(q) || q.includes(k))) {
        if (!results.some((r) => r.type === 'muscle' && r.value === group)) {
          results.push({ type: 'muscle', label: group, value: group })
        }
      }
    }

    // Match props
    allProps.forEach((p) => {
      if (p.toLowerCase().includes(q)) {
        results.push({ type: 'prop', label: p, value: p })
      }
    })

    return results.slice(0, 10)
  }, [search, exercises, allMuscles, allProps])

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchSuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  /* ─── toggles ─── */
  const toggleLayer = useCallback((layer: string) => {
    setActiveLayers((prev) => { const next = new Set(prev); next.has(layer) ? next.delete(layer) : next.add(layer); return next })
  }, [])

  const toggleMuscle = useCallback((muscle: string) => {
    setActiveMuscles((prev) => { const next = new Set(prev); next.has(muscle) ? next.delete(muscle) : next.add(muscle); return next })
  }, [])

  const togglePlanExercise = useCallback((id: string) => {
    setClassPlan((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }, [])

  const clearPlan = useCallback(() => setClassPlan(new Set()), [])

  /* ─── filtering with keyword-aware search + prop search ─── */
  const filtered = useMemo(() => {
    let list = exercises

    if (!noLayerFilter) list = list.filter((e) => activeLayers.has(e.layer))

    if (!noMuscleFilter) {
      list = list.filter((e) => {
        const allExMuscles = [...(e.primary_muscles || []), ...(e.secondary_muscles || [])]
        return allExMuscles.some((m) => activeMuscles.has(m))
      })
    }

    if (search.trim()) {
      const q = search.toLowerCase()
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
        if (matchedGroups.size > 0 && allExMuscles.some((m) => matchedGroups.has(m.toLowerCase()))) return true
        // Prop search
        if (e.props?.some((p) => p.tool?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q))) return true
        return false
      })
    }

    if (activePosture) {
      list = list.filter((e) => {
        const p = e.postures as Record<string, string | null> | null
        return p && p[activePosture]
      })
    }

    if (activeProp) {
      list = list.filter((e) => e.props?.some((p) => p.tool === activeProp))
    }

    if (activePropCategory) {
      list = list.filter((e) => e.props?.some((p) => p.category === activePropCategory))
    }

    if (showFavsOnly) {
      list = list.filter((e) => favIds.has(e.id))
    }

    return list
  }, [exercises, activeLayers, noLayerFilter, activeMuscles, noMuscleFilter, search, activePosture, activeProp, activePropCategory, showFavsOnly, favIds])

  /* ─── group by layer, sort corrective first when posture filter active ─── */
  const groupedByLayer = useMemo(() => {
    const groups: Record<string, Exercise[]> = {}
    for (const layer of ALL_LAYERS) {
      let layerExercises = filtered.filter((e) => e.layer === layer)
      // When a posture filter is active, sort corrective exercises before awareness
      if (activePosture && layerExercises.length > 0) {
        layerExercises = [...layerExercises].sort((a, b) => {
          const aLevel = (a.posture_benefits as Record<string, string> | null)?.[activePosture]
          const bLevel = (b.posture_benefits as Record<string, string> | null)?.[activePosture]
          if (aLevel === 'corrective' && bLevel !== 'corrective') return -1
          if (bLevel === 'corrective' && aLevel !== 'corrective') return 1
          return 0
        })
      }
      if (layerExercises.length > 0) groups[layer] = layerExercises
    }
    return groups
  }, [filtered, activePosture])

  /* ─── stats ─── */
  const stats = useMemo(() => {
    const s: Record<string, number> = { warmup: 0, layer1: 0, layer2: 0, layer3: 0 }
    exercises.forEach((e) => { if (s[e.layer] !== undefined) s[e.layer]++ })
    return s
  }, [exercises])

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

  /* ─── save / load / delete class plans ─── */
  const savePlan = useCallback(async () => {
    if (!user || classPlan.size === 0 || !planName.trim()) return
    if (savedPlans.length >= 10) return
    setSavingPlan(true)
    const { data } = await supabase
      .from('class_plans')
      .insert({ user_id: user.id, name: planName.trim(), exercise_ids: Array.from(classPlan) })
      .select()
      .single()
    if (data) setSavedPlans((prev) => [data as ClassPlan, ...prev])
    setPlanName('')
    setSavingPlan(false)
  }, [user, classPlan, planName, savedPlans.length, supabase])

  const loadPlan = useCallback((plan: ClassPlan) => {
    setClassPlan(new Set(plan.exercise_ids))
    setShowPlan(true)
  }, [])

  const deletePlan = useCallback(async (planId: string) => {
    if (!user) return
    await supabase.from('class_plans').delete().eq('id', planId)
    setSavedPlans((prev) => prev.filter((p) => p.id !== planId))
  }, [user, supabase])

  const applySuggestion = useCallback((suggestion: { type: string; value: string }) => {
    if (suggestion.type === 'muscle') {
      setActiveMuscles(new Set([suggestion.value]))
      setSearch('')
    } else if (suggestion.type === 'exercise') {
      setSearch(suggestion.value)
    } else if (suggestion.type === 'prop') {
      setSearch(suggestion.value)
    }
    setShowSearchSuggestions(false)
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-10">

      {/* ── Filter bar (sticky) ── */}
      <div className="sticky top-16 z-40 bg-background/90 backdrop-blur-xl -mx-5 sm:-mx-8 px-5 sm:px-8 pt-5 pb-4 mb-8">

        {/* Search with autocomplete */}
        <div ref={searchRef} className="relative mb-5">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-foreground/30" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowSearchSuggestions(true) }}
            onFocus={() => setShowSearchSuggestions(true)}
            placeholder="Search exercises, muscles, or props..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-black/[0.06] rounded-2xl text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 shadow-sm transition-all"
          />
          {/* Autocomplete suggestions */}
          {showSearchSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-black/[0.06] shadow-xl shadow-black/[0.08] z-50 py-1.5 max-h-[300px] overflow-y-auto">
              {searchSuggestions.map((s, i) => (
                <button
                  key={`${s.type}-${s.value}-${i}`}
                  onClick={() => applySuggestion(s)}
                  className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-black/[0.03] transition flex items-center gap-3"
                >
                  <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                    s.type === 'exercise' ? 'bg-primary/10 text-primary' :
                    s.type === 'muscle' ? 'bg-[#6a8a6e]/10 text-[#6a8a6e]' :
                    'bg-secondary/10 text-secondary'
                  }`}>
                    {s.type === 'exercise' ? 'Ex' : s.type === 'muscle' ? 'Mu' : 'Pr'}
                  </span>
                  <span className="text-foreground/70">{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dropdowns row */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <Dropdown label="Layers" badge={activeLayers.size}>
            <button
              onClick={() => setActiveLayers(new Set())}
              className={`w-full text-left px-4 py-2 text-[13px] hover:bg-black/[0.03] transition ${noLayerFilter ? 'font-semibold text-primary' : 'text-foreground/70'}`}
            >All Layers</button>
            <div className="h-px bg-black/[0.04] mx-3 my-1" />
            {ALL_LAYERS.map((key) => {
              const active = activeLayers.has(key)
              return (
                <button key={key} onClick={() => toggleLayer(key)} className="w-full text-left px-4 py-2 text-[13px] hover:bg-black/[0.03] transition flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 transition-all ${active ? 'border-primary bg-primary' : 'border-black/15'}`}>
                    {active && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                  </div>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: LAYER_COLORS[key] }} />
                  <span className={active ? 'font-medium text-foreground' : 'text-foreground/70'}>{LAYER_LABELS[key]}</span>
                  <span className="text-[11px] text-foreground/30 ml-auto tabular-nums">{stats[key]}</span>
                </button>
              )
            })}
          </Dropdown>

          <Dropdown label="Muscles" badge={activeMuscles.size}>
            <button onClick={() => setActiveMuscles(new Set())} className={`w-full text-left px-4 py-2 text-[13px] hover:bg-black/[0.03] transition ${noMuscleFilter ? 'font-semibold text-primary' : 'text-foreground/70'}`}>All Muscles</button>
            <div className="h-px bg-black/[0.04] mx-3 my-1" />
            {allMuscles.map((muscle) => {
              const active = activeMuscles.has(muscle)
              return (
                <button key={muscle} onClick={() => toggleMuscle(muscle)} className="w-full text-left px-4 py-2 text-[13px] hover:bg-black/[0.03] transition flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 transition-all ${active ? 'border-primary bg-primary' : 'border-black/15'}`}>
                    {active && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                  </div>
                  <span className={`truncate ${active ? 'font-medium text-foreground' : 'text-foreground/70'}`}>{muscle}</span>
                </button>
              )
            })}
          </Dropdown>

          {/* Posture dropdown */}
          <Dropdown label="Posture" badge={activePosture ? 1 : 0} align="right">
            <button
              onClick={() => setActivePosture(null)}
              className={`w-full text-left px-4 py-2 text-[13px] hover:bg-black/[0.03] transition ${!activePosture ? 'font-semibold text-primary' : 'text-foreground/70'}`}
            >All Postures</button>
            <div className="h-px bg-black/[0.04] mx-3 my-1" />
            {POSTURE_KEYS.map((key) => {
              const { label, numeral } = POSTURE_META[key]
              const active = activePosture === key
              return (
                <button key={key} onClick={() => setActivePosture(active ? null : key)} className="w-full text-left px-4 py-2 text-[13px] hover:bg-black/[0.03] transition flex items-center gap-3">
                  <span className="font-heading font-bold text-[14px] leading-none w-6 text-center" style={{ color: POSTURE_SYMBOL_COLOR }}>{numeral}</span>
                  <span className={active ? 'font-medium text-foreground' : 'text-foreground/70'}>{label}</span>
                  {active && <svg className="w-4 h-4 text-primary ml-auto" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                </button>
              )
            })}
          </Dropdown>

          {/* Props dropdown — grouped by category */}
          <Dropdown label="Props" badge={(activeProp ? 1 : 0) + (activePropCategory ? 1 : 0)} align="right">
            <button
              onClick={() => { setActiveProp(null); setActivePropCategory(null) }}
              className={`w-full text-left px-4 py-2 text-[13px] hover:bg-black/[0.03] transition ${!activeProp && !activePropCategory ? 'font-semibold text-primary' : 'text-foreground/70'}`}
            >All Props</button>
            <div className="h-px bg-black/[0.04] mx-3 my-1" />
            {/* Category filters */}
            <button
              onClick={() => { setActivePropCategory(activePropCategory === 'correction' ? null : 'correction'); setActiveProp(null) }}
              className="w-full text-left px-4 py-2 text-[13px] hover:bg-black/[0.03] transition flex items-center gap-3"
            >
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#7a9a80]/15 text-[#7a9a80] font-bold uppercase tracking-wider shrink-0">Align</span>
              <span className={activePropCategory === 'correction' ? 'font-medium text-foreground' : 'text-foreground/70'}>Correction Props</span>
              {activePropCategory === 'correction' && <svg className="w-4 h-4 text-primary ml-auto shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
            </button>
            <button
              onClick={() => { setActivePropCategory(activePropCategory === 'modification' ? null : 'modification'); setActiveProp(null) }}
              className="w-full text-left px-4 py-2 text-[13px] hover:bg-black/[0.03] transition flex items-center gap-3"
            >
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/15 text-secondary font-bold uppercase tracking-wider shrink-0">Mod</span>
              <span className={activePropCategory === 'modification' ? 'font-medium text-foreground' : 'text-foreground/70'}>Modification Props</span>
              {activePropCategory === 'modification' && <svg className="w-4 h-4 text-primary ml-auto shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
            </button>
            <div className="h-px bg-black/[0.04] mx-3 my-1" />
            <span className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground/20">By tool</span>
            {allProps.map((prop) => {
              const active = activeProp === prop
              return (
                <button key={prop} onClick={() => { setActiveProp(active ? null : prop); setActivePropCategory(null) }} className="w-full text-left px-4 py-2 text-[13px] hover:bg-black/[0.03] transition flex items-center gap-3">
                  <span className={active ? 'font-medium text-foreground' : 'text-foreground/70'}>{prop}</span>
                  {active && <svg className="w-4 h-4 text-primary ml-auto" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                </button>
              )
            })}
          </Dropdown>

          {/* Favorites toggle */}
          {user && (
            <button
              onClick={() => setShowFavsOnly(!showFavsOnly)}
              className={`flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-2 rounded-xl border transition-all duration-200 ${
                showFavsOnly
                  ? 'bg-secondary text-white border-secondary shadow-sm'
                  : 'bg-surface text-foreground/80 border-border hover:border-secondary/30 hover:shadow-sm'
              }`}
            >
              <svg className="w-4 h-4" fill={showFavsOnly ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {showFavsOnly ? `Favourites (${favorites.length})` : ''}
            </button>
          )}
        </div>

        {/* Active filter pills */}
        {(!noLayerFilter || !noMuscleFilter || activePosture || activeProp || activePropCategory || showFavsOnly) && (
          <div className="flex flex-wrap gap-1.5">
            {Array.from(activeLayers).map((layer) => (
              <span key={layer} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white" style={{ backgroundColor: LAYER_COLORS[layer] }}>
                {LAYER_LABELS[layer]}
                <button onClick={() => toggleLayer(layer)} className="hover:opacity-70 ml-0.5"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </span>
            ))}
            {Array.from(activeMuscles).map((muscle) => (
              <span key={muscle} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
                {muscle}
                <button onClick={() => toggleMuscle(muscle)} className="hover:opacity-70 ml-0.5"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </span>
            ))}
            {activePosture && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white" style={{ backgroundColor: POSTURE_SYMBOL_COLOR }}>
                {POSTURE_META[activePosture].numeral} {POSTURE_META[activePosture].label}
                <button onClick={() => setActivePosture(null)} className="hover:opacity-70 ml-0.5"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </span>
            )}
            {activePropCategory && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-secondary/10 text-secondary">
                {activePropCategory === 'correction' ? 'Correction Props' : 'Modification Props'}
                <button onClick={() => setActivePropCategory(null)} className="hover:opacity-70 ml-0.5"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </span>
            )}
            {activeProp && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-secondary/10 text-secondary">
                {activeProp}
                <button onClick={() => setActiveProp(null)} className="hover:opacity-70 ml-0.5"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </span>
            )}
            {showFavsOnly && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-secondary/10 text-secondary">
                Favourites
                <button onClick={() => setShowFavsOnly(false)} className="hover:opacity-70 ml-0.5"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </span>
            )}
            <button onClick={() => { setActiveLayers(new Set()); setActiveMuscles(new Set()); setActivePosture(null); setActiveProp(null); setActivePropCategory(null); setShowFavsOnly(false) }} className="text-[11px] text-foreground/30 hover:text-foreground/60 px-2 py-1 transition-colors">Clear all</button>
          </div>
        )}
      </div>

      {/* ── Result count + Class Plan toggle ── */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-[13px] text-foreground/40 font-medium tracking-wide">{filtered.length} exercise{filtered.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowPlan(!showPlan)}
          className={`flex items-center gap-2 text-[13px] font-medium px-4 py-2 rounded-xl border transition-all duration-200 ${
            classPlan.size > 0 ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'bg-white text-foreground/60 border-black/[0.06] hover:border-primary/30 hover:text-primary hover:shadow-sm'
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
                {classPlan.size === 0 ? 'Select exercises below to build your class' : `${classPlan.size} exercise${classPlan.size !== 1 ? 's' : ''} selected`}
              </p>
            </div>
            {classPlan.size > 0 && (
              <button onClick={clearPlan} className="text-[12px] font-medium text-secondary hover:underline">Clear all</button>
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
                        <span key={e.id} className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-lg border" style={{ backgroundColor: LAYER_PASTELS[e.layer], borderColor: LAYER_PASTEL_BORDER[e.layer] }}>
                          {e.name}
                          <button onClick={() => togglePlanExercise(e.id)} className="text-foreground/30 hover:text-foreground/60 ml-0.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
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

          {/* Save plan */}
          {user && classPlan.size > 0 && (
            <div className="px-6 py-4 border-t border-black/[0.04] bg-black/[0.01]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Name this plan..."
                  maxLength={50}
                  className="flex-1 text-[13px] px-3 py-2 bg-white border border-black/[0.06] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                  onKeyDown={(e) => { if (e.key === 'Enter') savePlan() }}
                />
                <button
                  onClick={savePlan}
                  disabled={savingPlan || !planName.trim() || savedPlans.length >= 10}
                  className="text-[13px] font-semibold px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {savingPlan ? 'Saving...' : 'Save'}
                </button>
              </div>
              {savedPlans.length >= 10 && (
                <p className="text-[11px] text-foreground/40 mt-1.5">Maximum 10 saved plans reached. Delete one to save a new plan.</p>
              )}
            </div>
          )}

          {/* Saved plans list */}
          {user && savedPlans.length > 0 && (
            <div className="px-6 py-4 border-t border-black/[0.04]">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-foreground/25 mb-3">Saved Plans ({savedPlans.length}/10)</h4>
              <div className="space-y-2">
                {savedPlans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between bg-black/[0.02] rounded-lg px-3 py-2.5">
                    <button onClick={() => loadPlan(plan)} className="flex-1 text-left">
                      <span className="text-[13px] font-medium text-foreground hover:text-primary transition-colors">{plan.name}</span>
                      <span className="text-[11px] text-foreground/30 ml-2">{plan.exercise_ids.length} exercises</span>
                    </button>
                    <button onClick={() => deletePlan(plan.id)} className="text-foreground/20 hover:text-foreground/50 transition-colors p-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Exercise sections grouped by layer ── */}
      {Object.entries(showPlan && classPlan.size > 0 ? (() => {
        const groups: Record<string, Exercise[]> = {}
        for (const layer of ALL_LAYERS) {
          const layerExercises = planExercises.filter((e) => e.layer === layer)
          if (layerExercises.length > 0) groups[layer] = layerExercises
        }
        return groups
      })() : groupedByLayer).map(([layer, layerExercises]) => (
        <div key={layer} className="mb-8">
          <div className="flex items-center gap-3 mb-3 px-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LAYER_COLORS[layer] }} />
            <h2 className="font-heading text-[15px] font-semibold text-foreground">{LAYER_LABELS[layer]}</h2>
            <span className="text-[12px] text-foreground/30 font-medium">{layerExercises.length}</span>
            <div className="flex-1 h-px bg-black/[0.04]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 items-start">
            {layerExercises.map((exercise) => {
              const isExpanded = expandedId === exercise.id
              return (
                <div key={exercise.id} className={isExpanded ? 'lg:col-span-2' : ''}>
                  <ExerciseCard
                    exercise={exercise}
                    expanded={isExpanded}
                    onToggle={() => setExpandedId(isExpanded ? null : exercise.id)}
                    isFav={favIds.has(exercise.id)}
                    toggling={togglingFav.has(exercise.id)}
                    onFav={() => toggleFav(exercise.id)}
                    showFav={!!user}
                    inPlan={classPlan.has(exercise.id)}
                    onTogglePlan={() => togglePlanExercise(exercise.id)}
                    onMuscleClick={(muscle) => { setActiveMuscles(new Set([muscle])); setExpandedId(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    activePosture={activePosture}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-24">
          <p className="text-foreground/30 text-lg font-light">No exercises match your filters.</p>
          <button onClick={() => { setActiveLayers(new Set()); setActiveMuscles(new Set()); setSearch(''); setActivePosture(null); setActiveProp(null); setActivePropCategory(null); setShowFavsOnly(false) }} className="mt-4 text-[13px] font-medium text-primary hover:underline">Clear all filters</button>
        </div>
      )}

      {/* ── Floating class plan bar ── */}
      {classPlan.size > 0 && !showPlan && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button onClick={() => setShowPlan(true)} className="flex items-center gap-3 bg-primary text-white px-6 py-3.5 rounded-2xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-200">
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
  inPlan: boolean
  onTogglePlan: () => void
  onMuscleClick: (muscle: string) => void
  activePosture: string | null
}

function ExerciseCard({
  exercise, expanded, onToggle, isFav, toggling, onFav, showFav, inPlan, onTogglePlan, onMuscleClick, activePosture,
}: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const layerColor = LAYER_COLORS[exercise.layer] ?? '#6e5f66'
  const pastel = inPlan ? LAYER_PASTEL_SELECTED[exercise.layer] : LAYER_PASTELS[exercise.layer]
  const borderColor = inPlan ? LAYER_PASTEL_BORDER[exercise.layer] : 'rgba(0,0,0,0.04)'
  const postures = exercise.postures as Record<string, string | null> | null
  const benefitLevel = activePosture && exercise.posture_benefits
    ? (exercise.posture_benefits as Record<string, string>)[activePosture] ?? null
    : null

  // Scroll to top of card when expanded
  useEffect(() => {
    if (expanded && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    }
  }, [expanded])

  // Separate posture-specific props from general props
  const postureProps = useMemo(() => {
    if (!exercise.props) return { general: [] as NonNullable<typeof exercise.props>, byPosture: {} as Record<string, NonNullable<typeof exercise.props>> }
    const general: NonNullable<typeof exercise.props> = []
    const byPosture: Record<string, NonNullable<typeof exercise.props>> = {}
    for (const prop of exercise.props) {
      if (prop.for && Array.isArray(prop.for) && prop.for.length > 0) {
        for (const pKey of prop.for as string[]) {
          if (!byPosture[pKey]) byPosture[pKey] = []
          byPosture[pKey].push(prop)
        }
      } else {
        general.push(prop)
      }
    }
    return { general, byPosture }
  }, [exercise.props])

  return (
    <div
      ref={cardRef}
      className={`group rounded-2xl border overflow-hidden transition-all duration-200 ${expanded ? 'shadow-lg shadow-black/[0.06]' : 'hover:shadow-md hover:shadow-black/[0.04]'} ${inPlan ? 'ring-1 ring-primary/20' : ''} ${benefitLevel === 'corrective' ? 'ring-1 ring-[#7a9a80]/25' : ''} ${benefitLevel === 'awareness' ? 'opacity-70' : ''}`}
      style={{ backgroundColor: pastel, borderColor }}
    >
      {/* ── Card header ── */}
      <div className="flex items-center">
        <div className="w-1 self-stretch rounded-l-2xl" style={{ backgroundColor: layerColor }} />

        <button onClick={onTogglePlan} className="shrink-0 px-3.5 py-4 cursor-pointer" title={inPlan ? 'Remove from class plan' : 'Add to class plan'}>
          <div className={`w-[22px] h-[22px] rounded-md border-[1.5px] flex items-center justify-center transition-all duration-200 ${inPlan ? 'bg-primary border-primary shadow-sm shadow-primary/20' : 'border-black/15 bg-white group-hover:border-primary/30'}`}>
            {inPlan && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
          </div>
        </button>

        <button onClick={onToggle} className="flex-1 text-left py-3.5 pr-2 flex items-center gap-3 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-heading text-[16px] font-semibold text-foreground truncate leading-tight">{exercise.name}</h3>
              {benefitLevel === 'corrective' && (
                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#7a9a80]/15 text-[#7a9a80] border border-[#7a9a80]/20">Corrective</span>
              )}
              {benefitLevel === 'awareness' && (
                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/[0.03] text-foreground/30">Awareness</span>
              )}
              {exercise.reps && <span className="shrink-0 text-[11px] font-medium text-foreground/30 bg-white/80 px-2 py-0.5 rounded-md">{exercise.reps}</span>}
            </div>
            {/* Posture numerals on card */}
            {postures && (
              <div className="flex gap-1.5 mt-1">
                {POSTURE_KEYS.map((key) =>
                  postures[key] ? (
                    <span key={key} className="font-heading font-bold text-[10px] leading-none opacity-40" style={{ color: POSTURE_SYMBOL_COLOR }} title={POSTURE_META[key].label}>{POSTURE_META[key].numeral}</span>
                  ) : null
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {showFav && (
              <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); onFav() }} onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onFav() } }} className={`p-1.5 rounded-lg transition-all ${toggling ? 'scale-90 opacity-50' : 'hover:scale-110 hover:bg-black/[0.03]'}`}>
                {isFav ? (
                  <svg className="w-[18px] h-[18px] text-secondary" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                ) : (
                  <svg className="w-[18px] h-[18px] text-foreground/20 hover:text-secondary transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                )}
              </span>
            )}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${expanded ? 'bg-primary/10 text-primary' : 'text-foreground/20 group-hover:bg-black/[0.04] group-hover:text-foreground/40'}`}>
              <svg className={`w-5 h-5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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

            {/* General props — separated by category */}
            {postureProps.general.filter(p => p.category === 'correction').length > 0 && (
              <Section title="Correction Props">
                <div className="space-y-2">
                  {postureProps.general.filter(p => p.category === 'correction').map((prop, i) => (
                    <PropCard key={i} prop={prop} />
                  ))}
                </div>
              </Section>
            )}
            {postureProps.general.filter(p => p.category === 'modification').length > 0 && (
              <Section title="Modification Props">
                <div className="space-y-2">
                  {postureProps.general.filter(p => p.category === 'modification').map((prop, i) => (
                    <PropCard key={i} prop={prop} />
                  ))}
                </div>
              </Section>
            )}
            {postureProps.general.filter(p => !p.category).length > 0 && (
              <Section title="Props">
                <div className="space-y-2">
                  {postureProps.general.filter(p => !p.category).map((prop, i) => (
                    <PropCard key={i} prop={prop} />
                  ))}
                </div>
              </Section>
            )}

            {/* Variations */}
            {exercise.variations && exercise.variations.length > 0 && (
              <Section title="Variations">
                <div className="space-y-2">
                  {exercise.variations.map((v, i) => (
                    <div key={i} className="bg-white/70 rounded-xl border border-black/[0.04] p-3.5">
                      <span className="text-[13px] font-semibold text-foreground">{v.name}</span>
                      <p className="text-[12px] text-foreground/50 mt-0.5">{v.description}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Postural Adjustments — with collapsible sections */}
            {postures && Object.entries(postures).some(([, v]) => v) && (
              <PosturalSection postures={postures} activePosture={activePosture} postureProps={postureProps.byPosture} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Postural adjustments with collapsible per-posture sections ─── */
function PosturalSection({ postures, activePosture, postureProps }: {
  postures: Record<string, string | null>
  activePosture: string | null
  postureProps: Record<string, NonNullable<Exercise['props']>>
}) {
  const [expandedPostures, setExpandedPostures] = useState<Set<string>>(new Set())

  const togglePosture = (key: string) => {
    setExpandedPostures((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <Section title="Postural Adjustments">
      <div className="space-y-1">
        {POSTURE_KEYS.map((key) => {
          const val = postures[key]
          if (!val) return null
          const { label, numeral } = POSTURE_META[key]
          const props = postureProps[key] || []
          const isActive = activePosture === key
          const isExpanded = isActive || expandedPostures.has(key)

          const isDimmed = activePosture && !isActive

          return (
            <div key={key} className={`rounded-xl transition-all duration-200 ${isExpanded ? 'bg-white/60 border border-black/[0.04]' : ''} ${isDimmed ? 'opacity-25' : ''}`}>
              <button
                onClick={() => togglePosture(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${isActive ? '' : 'hover:bg-white/40 rounded-xl'}`}
              >
                <span className="font-heading font-bold text-[13px] leading-none w-6 text-center" style={{ color: POSTURE_SYMBOL_COLOR }}>{numeral}</span>
                <span className={`text-[13px] flex-1 ${isExpanded ? 'font-semibold text-foreground' : 'font-medium text-foreground/60'}`}>{label}</span>
                <svg className={`w-4 h-4 text-foreground/20 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 pl-12">
                  <p className="text-[13px] text-foreground/60 leading-relaxed">{val}</p>
                  {props.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/25">Recommended Props</span>
                      {props.map((prop, i) => <PropCard key={i} prop={prop} compact />)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}

/* ─── Prop display card ─── */
function PropCard({ prop, compact }: { prop: NonNullable<Exercise['props']>[number]; compact?: boolean }) {
  return (
    <div className={`bg-white/70 rounded-xl border border-black/[0.04] ${compact ? 'p-2.5' : 'p-3.5'}`}>
      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
        <span className={`font-semibold text-foreground ${compact ? 'text-[12px]' : 'text-[13px]'}`}>{prop.name}</span>
        {prop.tool && <span className="text-[11px] text-foreground/40 bg-black/[0.03] px-2 py-0.5 rounded-md">{prop.tool}</span>}
        {prop.category && (
          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
            prop.category === 'correction' ? 'bg-[#7a9a80]/12 text-[#7a9a80]' : 'bg-secondary/12 text-secondary'
          }`}>
            {prop.category === 'correction' ? 'Correction' : 'Modification'}
          </span>
        )}
      </div>
      {prop.tip && <p className={`text-foreground/50 ${compact ? 'text-[11px]' : 'text-[12px]'}`}>{prop.tip}</p>}
    </div>
  )
}

/* ─── Breathing section: 2-breath and multi-breath ─── */
function BreathingSection({ inhale, exhale, breathNote }: { inhale: string; exhale: string; breathNote: string | null }) {
  const inhalePhases = inhale ? inhale.split('|||') : []
  const exhalePhases = exhale ? exhale.split('|||') : []
  const isMultiPhase = inhalePhases.length > 1 || exhalePhases.length > 1

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
                step.type === 'in' ? 'bg-[#6b7a9a]/10 text-[#6b7a9a]' : 'bg-[#6a8a6e]/10 text-[#6a8a6e]'
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
