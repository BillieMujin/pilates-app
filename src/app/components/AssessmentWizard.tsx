'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Exercise, PosturalAssessment } from '@/lib/types'

/* ─── constants ─── */

const POSTURE_META: Record<string, { label: string; numeral: string; color: string }> = {
  kyphosis:      { label: 'Kyphosis-Lordosis', numeral: 'I',   color: '#6b2d5b' },
  kyphosis_only: { label: 'Kyphosis',          numeral: 'II',  color: '#8a6d9a' },
  lordosis:      { label: 'Lordosis',           numeral: 'III', color: '#c98a24' },
  flatback:      { label: 'Flat Back',          numeral: 'IV',  color: '#6a8a6e' },
  military:      { label: 'Military',           numeral: 'V',   color: '#7a9a80' },
  swayback:      { label: 'Sway Back',          numeral: 'VI',  color: '#9a7aaa' },
}

const STEP_LABELS = ['Client Info', 'Side View', 'Front View', 'Back View', 'Spine Sequencing', 'Results']

const STORAGE_KEY = 'pilates_assessment_draft'

/* ─── side view regions ─── */
const SIDE_VIEW_REGIONS = [
  { key: 'head', label: 'Head', options: ['neutral', 'forward', 'retracted'], bilateral: false },
  { key: 'cervical_spine', label: 'Cervical Spine', options: ['neutral', 'decreased curve (flat)', 'increased curve (excessive extension)'], bilateral: false },
  { key: 'upper_thoracic', label: 'Upper Thoracic Spine', options: ['neutral', 'decreased curve (flat)', 'increased curve (excessive flexion)'], bilateral: false },
  { key: 'lower_thoracic', label: 'Lower Thoracic Spine', options: ['neutral', 'decreased curve (flat)', 'increased curve (excessive flexion)'], bilateral: false },
  { key: 'lumbar_spine', label: 'Lumbar Spine', options: ['neutral', 'decreased curve (flat)', 'increased curve (excessive extension)'], bilateral: false },
  { key: 'pelvis', label: 'Pelvis', options: ['neutral', 'anterior tilt', 'posterior tilt'], bilateral: false },
  { key: 'hip_joints', label: 'Hip Joints', options: ['neutral', 'flexed', 'extended'], bilateral: true },
  { key: 'knees', label: 'Knees', options: ['neutral', 'hyperextended', 'flexed'], bilateral: true },
  { key: 'ankle_joints', label: 'Ankle Joints', options: ['neutral', 'plantar flexed', 'dorsiflexed'], bilateral: true },
]

/* ─── front view regions ─── */
const FRONT_VIEW_REGIONS = [
  { key: 'feet', label: 'Feet', options: ['neutral', 'supinated', 'pronated'], bilateral: true },
  { key: 'knees', label: 'Knees', options: ['neutral', 'knock-kneed (genu valgum)', 'bow-legged (genu varum)'], bilateral: false },
  { key: 'pelvis', label: 'Pelvis', options: ['level', 'elevated R', 'elevated L', 'rotated clockwise', 'rotated counter-clockwise'], bilateral: false },
  { key: 'rib_cage', label: 'Rib Cage', options: ['neutral', 'elevated', 'shifted R', 'shifted L', 'rotated clockwise', 'rotated counter-clockwise'], bilateral: false },
  { key: 'shoulders', label: 'Shoulders', options: ['level', 'elevated R', 'elevated L', 'depressed R', 'depressed L'], bilateral: false },
  { key: 'head', label: 'Head', options: ['neutral', 'tilted R', 'tilted L', 'shifted R', 'shifted L', 'rotated clockwise', 'rotated counter-clockwise'], bilateral: false },
]

/* ─── back view regions ─── */
const BACK_VIEW_REGIONS = [
  { key: 'feet', label: 'Feet', options: ['neutral', 'supinated', 'pronated'], bilateral: true },
  { key: 'femurs', label: 'Femurs', options: ['neutral', 'medial rotation', 'lateral rotation'], bilateral: true },
  { key: 'pelvis', label: 'Pelvis', options: ['level', 'elevated R', 'elevated L', 'rotated clockwise', 'rotated counter-clockwise'], bilateral: false },
  {
    key: 'scapulae',
    label: 'Scapulae',
    options: ['neutral', 'protracted', 'retracted', 'elevated', 'depressed', 'upwardly rotated', 'downwardly rotated', 'winging', 'anteriorly tipped'],
    bilateral: true,
  },
  { key: 'humeri', label: 'Humeri', options: ['neutral', 'medially rotated'], bilateral: true },
]

/* ─── types ─── */

interface RegionValue {
  values: string[]
  laterality?: Record<string, { right?: boolean; left?: boolean }>
}

interface WizardState {
  clientName: string
  assessmentDate: string
  sideView: Record<string, RegionValue>
  frontView: Record<string, RegionValue>
  backView: Record<string, RegionValue>
  spineSequencing: {
    flatAreas: boolean | null
    flatAreasWhere: string
    imbalances: boolean | null
    imbalancesWhere: string
  }
  suggestedPosture: string | null
  confirmedPosture: string | null
  notes: string
}

interface Props {
  user: User
  savedAssessments: PosturalAssessment[]
  exercises: Exercise[]
}

/* ─── initial state ─── */

function createInitialState(): WizardState {
  const today = new Date().toISOString().split('T')[0]
  return {
    clientName: '',
    assessmentDate: today,
    sideView: {},
    frontView: {},
    backView: {},
    spineSequencing: {
      flatAreas: null,
      flatAreasWhere: '',
      imbalances: null,
      imbalancesWhere: '',
    },
    suggestedPosture: null,
    confirmedPosture: null,
    notes: '',
  }
}

/* ─── helpers ─── */

/** The "neutral" options that are mutually exclusive with deviations */
const NEUTRAL_VALUES = ['neutral', 'level']

function isNeutralOption(opt: string): boolean {
  return NEUTRAL_VALUES.includes(opt)
}

/** Check whether a region has any non-neutral selected value that matches a target */
function regionHasValue(rv: RegionValue | undefined, target: string): boolean {
  if (!rv) return false
  return rv.values.includes(target)
}

/** Get the list of regions for a given step */
function getRegionsForStep(step: number): { key: string; label: string; options: string[]; bilateral?: boolean; guidance?: string }[] {
  switch (step) {
    case 1: return SIDE_VIEW_REGIONS
    case 2: return FRONT_VIEW_REGIONS
    case 3: return BACK_VIEW_REGIONS
    default: return []
  }
}

/** Get the view data for a given step */
function getViewDataForStep(state: WizardState, step: number): Record<string, RegionValue> {
  switch (step) {
    case 1: return state.sideView
    case 2: return state.frontView
    case 3: return state.backView
    default: return {}
  }
}

/** Check which regions are unanswered in a step */
function getUnansweredRegions(state: WizardState, step: number): string[] {
  const regions = getRegionsForStep(step)
  const viewData = getViewDataForStep(state, step)
  return regions
    .filter(r => {
      const rv = viewData[r.key]
      return !rv || rv.values.length === 0
    })
    .map(r => r.key)
}

/* ─── posture detection ─── */

function detectPosture(state: WizardState): { posture: string | null; scores: Record<string, { score: number; total: number; markers: string[] }> } {
  const sv = state.sideView
  const scores: Record<string, { score: number; total: number; markers: string[] }> = {}

  // Helper: check if a region's selected values include a specific value
  const has = (key: string, target: string) => regionHasValue(sv[key], target)
  // Helper: check if a region has ONLY neutral/level selected (or nothing non-neutral)
  const isNeutral = (key: string) => {
    const rv = sv[key]
    if (!rv || rv.values.length === 0) return true
    return rv.values.every(v => isNeutralOption(v))
  }

  // KYPHOSIS-LORDOSIS
  {
    const markers: string[] = []
    let score = 0
    const total = 5
    if (has('upper_thoracic', 'increased curve (excessive flexion)') || has('lower_thoracic', 'increased curve (excessive flexion)')) { score++; markers.push('Thoracic excessive flexion') }
    if (has('lumbar_spine', 'increased curve (excessive extension)')) { score++; markers.push('Lumbar excessive extension') }
    if (has('pelvis', 'anterior tilt')) { score++; markers.push('Anterior pelvic tilt') }
    if (has('head', 'forward')) { score++; markers.push('Forward head') }
    if (has('cervical_spine', 'increased curve (excessive extension)')) { score++; markers.push('Cervical excessive extension') }
    scores['kyphosis'] = { score, total, markers }
  }

  // KYPHOSIS ONLY
  {
    const markers: string[] = []
    let score = 0
    const total = 4
    if (has('upper_thoracic', 'increased curve (excessive flexion)') || has('lower_thoracic', 'increased curve (excessive flexion)')) { score++; markers.push('Thoracic excessive flexion') }
    if (isNeutral('lumbar_spine') || has('lumbar_spine', 'decreased curve (flat)')) { score++; markers.push('Lumbar neutral/flat') }
    if (isNeutral('pelvis') || has('pelvis', 'posterior tilt')) { score++; markers.push('Pelvis neutral/posterior') }
    if (has('head', 'forward')) { score++; markers.push('Forward head') }
    scores['kyphosis_only'] = { score, total, markers }
  }

  // LORDOSIS ONLY
  {
    const markers: string[] = []
    let score = 0
    const total = 4
    if (has('lumbar_spine', 'increased curve (excessive extension)')) { score++; markers.push('Lumbar excessive extension') }
    if (has('pelvis', 'anterior tilt')) { score++; markers.push('Anterior pelvic tilt') }
    if (isNeutral('upper_thoracic') && isNeutral('lower_thoracic')) { score++; markers.push('Thoracic neutral') }
    if (isNeutral('head') || has('head', 'forward')) { score++; markers.push('Head neutral/slight forward') }
    scores['lordosis'] = { score, total, markers }
  }

  // FLAT BACK
  {
    const markers: string[] = []
    let score = 0
    const total = 5
    if (has('lumbar_spine', 'decreased curve (flat)')) { score++; markers.push('Lumbar flat') }
    if (has('pelvis', 'posterior tilt')) { score++; markers.push('Posterior pelvic tilt') }
    if (has('upper_thoracic', 'increased curve (excessive flexion)')) { score++; markers.push('Upper thoracic flexion') }
    if (isNeutral('lower_thoracic') || has('lower_thoracic', 'decreased curve (flat)')) { score++; markers.push('Lower thoracic neutral/flat') }
    if (has('head', 'forward')) { score++; markers.push('Forward head') }
    scores['flatback'] = { score, total, markers }
  }

  // MILITARY
  {
    const markers: string[] = []
    let score = 0
    const total = 5
    if (has('lumbar_spine', 'increased curve (excessive extension)')) { score++; markers.push('Lumbar excessive extension') }
    if (has('pelvis', 'anterior tilt')) { score++; markers.push('Anterior pelvic tilt') }
    if (isNeutral('upper_thoracic') || isNeutral('lower_thoracic')) { score++; markers.push('Thoracic neutral') }
    if (isNeutral('cervical_spine')) { score++; markers.push('Cervical neutral') }
    if (isNeutral('head')) { score++; markers.push('Head neutral') }
    scores['military'] = { score, total, markers }
  }

  // SWAY BACK
  {
    const markers: string[] = []
    let score = 0
    const total = 6
    if (has('pelvis', 'posterior tilt')) { score++; markers.push('Posterior pelvic tilt') }
    if (has('lumbar_spine', 'decreased curve (flat)')) { score++; markers.push('Lumbar flat') }
    if (has('upper_thoracic', 'increased curve (excessive flexion)') || has('lower_thoracic', 'increased curve (excessive flexion)')) { score++; markers.push('Thoracic excessive flexion (long kyphosis)') }
    if (has('head', 'forward')) { score++; markers.push('Forward head') }
    if (has('hip_joints', 'extended')) { score++; markers.push('Hips extended') }
    if (has('knees', 'hyperextended')) { score++; markers.push('Knees hyperextended') }
    scores['swayback'] = { score, total, markers }
  }

  // Find highest scoring posture (requires at least 50% match)
  let best: string | null = null
  let bestRatio = 0
  for (const [key, data] of Object.entries(scores)) {
    const ratio = data.score / data.total
    if (ratio > bestRatio && ratio >= 0.5) {
      bestRatio = ratio
      best = key
    }
  }

  return { posture: best, scores }
}

/* ─── component ─── */

export default function AssessmentWizard({ user, savedAssessments, exercises }: Props) {
  const [step, setStep] = useState(0)
  const [state, setState] = useState<WizardState>(createInitialState)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const supabase = createClient()

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Migration: convert old single-value format to new array format
        const migrateView = (view: Record<string, { value?: string; values?: string[]; right?: boolean; left?: boolean }>) => {
          const migrated: Record<string, RegionValue> = {}
          for (const [key, rv] of Object.entries(view || {})) {
            if (rv.values) {
              migrated[key] = rv as RegionValue
            } else if (rv.value) {
              migrated[key] = { values: [rv.value] }
            } else {
              migrated[key] = { values: [] }
            }
          }
          return migrated
        }
        setState({
          ...parsed.state,
          sideView: migrateView(parsed.state.sideView),
          frontView: migrateView(parsed.state.frontView),
          backView: migrateView(parsed.state.backView),
        })
        setStep(parsed.step || 0)
        setEditingId(parsed.editingId || null)
      }
    } catch { /* ignore */ }
  }, [])

  // Auto-save to localStorage on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, step, editingId }))
    } catch { /* ignore */ }
  }, [state, step, editingId])

  // Detect posture when reaching results step
  const detection = useMemo(() => detectPosture(state), [state])

  useEffect(() => {
    if (step === 5 && detection.posture) {
      setState(prev => ({ ...prev, suggestedPosture: detection.posture }))
    }
  }, [step, detection.posture])

  // Corrective exercises for the detected/confirmed posture
  const correctiveExercises = useMemo(() => {
    const postureKey = state.confirmedPosture || state.suggestedPosture
    if (!postureKey) return []
    return exercises.filter(ex => {
      const benefits = ex.posture_benefits as Record<string, string> | null
      return benefits && benefits[postureKey] === 'corrective'
    })
  }, [state.confirmedPosture, state.suggestedPosture, exercises])

  const groupedExercises = useMemo(() => {
    const groups: Record<string, Exercise[]> = {}
    correctiveExercises.forEach(ex => {
      const principles = ex.principles || ['General']
      principles.forEach(p => {
        if (!groups[p]) groups[p] = []
        if (!groups[p].find(e => e.id === ex.id)) groups[p].push(ex)
      })
    })
    return groups
  }, [correctiveExercises])

  // Validation: which regions are unanswered in the current step
  const unansweredRegions = useMemo(() => getUnansweredRegions(state, step), [state, step])

  /* ─── handlers ─── */

  const toggleValue = useCallback((
    viewKey: 'sideView' | 'frontView' | 'backView',
    regionKey: string,
    option: string,
  ) => {
    setState(prev => {
      const view = prev[viewKey]
      const current = view[regionKey] || { values: [], laterality: {} }
      let newValues: string[]
      let newLaterality = { ...(current.laterality || {}) }

      if (isNeutralOption(option)) {
        newValues = current.values.includes(option) ? [] : [option]
        newLaterality = {}
      } else {
        const withoutNeutral = current.values.filter(v => !isNeutralOption(v))
        if (withoutNeutral.includes(option)) {
          newValues = withoutNeutral.filter(v => v !== option)
          delete newLaterality[option]
        } else {
          newValues = [...withoutNeutral, option]
        }
      }

      return {
        ...prev,
        [viewKey]: { ...view, [regionKey]: { values: newValues, laterality: newLaterality } },
      }
    })
  }, [])

  const updateLateral = useCallback((
    viewKey: 'sideView' | 'frontView' | 'backView',
    regionKey: string,
    option: string,
    side: 'right' | 'left',
    checked: boolean,
  ) => {
    setState(prev => {
      const view = prev[viewKey]
      const current = view[regionKey] || { values: [] }
      const laterality = current.laterality || {}
      const optLat = laterality[option] || {}
      return {
        ...prev,
        [viewKey]: {
          ...view,
          [regionKey]: {
            ...current,
            laterality: {
              ...laterality,
              [option]: { ...optLat, [side]: checked },
            },
          },
        },
      }
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)

    const payload = {
      user_id: user.id,
      client_name: state.clientName,
      assessment_date: state.assessmentDate,
      side_view: state.sideView,
      front_view: state.frontView,
      back_view: state.backView,
      spine_sequencing: state.spineSequencing,
      plumb_line: {},
      suggested_posture: state.suggestedPosture,
      confirmed_posture: state.confirmedPosture,
      notes: state.notes || null,
    }

    try {
      if (editingId) {
        await supabase
          .from('postural_assessments')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingId)
      } else {
        await supabase
          .from('postural_assessments')
          .insert(payload)
      }
      setSaveSuccess(true)
      localStorage.removeItem(STORAGE_KEY)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const loadAssessment = (a: PosturalAssessment) => {
    // Migration helper for loaded assessments (old format may have `value` instead of `values`)
    const migrateView = (view: Record<string, { value?: string; values?: string[]; right?: boolean; left?: boolean }>) => {
      const migrated: Record<string, RegionValue> = {}
      for (const [key, rv] of Object.entries(view || {})) {
        if (rv.values) {
          migrated[key] = rv as RegionValue
        } else if (rv.value) {
          migrated[key] = { values: [rv.value] }
        } else {
          migrated[key] = { values: [] }
        }
      }
      return migrated
    }

    setState({
      clientName: a.client_name,
      assessmentDate: a.assessment_date,
      sideView: migrateView(a.side_view as Record<string, { value?: string; values?: string[]; right?: boolean; left?: boolean }>),
      frontView: migrateView(a.front_view as Record<string, { value?: string; values?: string[]; right?: boolean; left?: boolean }>),
      backView: migrateView(a.back_view as Record<string, { value?: string; values?: string[]; right?: boolean; left?: boolean }>),
      spineSequencing: a.spine_sequencing as WizardState['spineSequencing'],
      suggestedPosture: a.suggested_posture,
      confirmedPosture: a.confirmed_posture,
      notes: a.notes || '',
    })
    setEditingId(a.id)
    setStep(5)
    setShowHistory(false)
  }

  const startNew = () => {
    setState(createInitialState())
    setStep(0)
    setEditingId(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  // canProceed: step 0 requires client name; steps 1-3 require all regions answered
  const canProceed = useMemo(() => {
    if (step === 0) return state.clientName.trim().length > 0
    if (step >= 1 && step <= 3) return unansweredRegions.length === 0
    return true
  }, [step, state.clientName, unansweredRegions])

  /* ─── render helpers ─── */

  function renderRegionCard(
    region: { key: string; label: string; options: string[]; bilateral?: boolean; guidance?: string },
    viewData: Record<string, RegionValue>,
    viewKey: 'sideView' | 'frontView' | 'backView',
  ) {
    const current = viewData[region.key] || { values: [] }
    const isUnanswered = current.values.length === 0
    const hasDeviation = current.values.some(v => !isNeutralOption(v))

    return (
      <div
        key={region.key}
        className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all ${
          isUnanswered
            ? 'border-l-[3px] border-l-amber-400 border-t-border border-r-border border-b-border bg-amber-50/30'
            : 'border-border'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-heading text-[15px] font-semibold text-foreground">{region.label}</h4>
          {isUnanswered && (
            <span className="text-[11px] font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-lg">
              Required
            </span>
          )}
        </div>
        {region.guidance && (
          <p className="text-[12px] text-muted mb-3 bg-background rounded-xl px-3 py-2 border border-border">
            {region.guidance}
          </p>
        )}
        <div className="space-y-2">
          {region.options.map(opt => {
            const isSelected = current.values.includes(opt)
            const isNeutralOpt = isNeutralOption(opt)
            return (
              <div key={opt}>
                <label
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-[13px] ${
                    isSelected
                      ? 'bg-primary/[0.06] text-foreground border border-primary/20'
                      : 'hover:bg-black/[0.02] border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleValue(viewKey, region.key, opt)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="capitalize">{opt}</span>
                </label>
                {region.bilateral && isSelected && !isNeutralOpt && (
                  <div className="ml-10 mt-1 mb-1 flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-[12px] text-muted">
                      <input
                        type="checkbox"
                        checked={current.laterality?.[opt]?.right || false}
                        onChange={e => updateLateral(viewKey, region.key, opt, 'right', e.target.checked)}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      Right
                    </label>
                    <label className="flex items-center gap-1.5 text-[12px] text-muted">
                      <input
                        type="checkbox"
                        checked={current.laterality?.[opt]?.left || false}
                        onChange={e => updateLateral(viewKey, region.key, opt, 'left', e.target.checked)}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      Left
                    </label>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* ─── step content ─── */

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="max-w-lg mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-border p-6">
              <label className="block mb-1.5 text-[13px] font-medium text-foreground">Client Name</label>
              <input
                type="text"
                value={state.clientName}
                onChange={e => setState(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="Enter client name"
                className="w-full px-4 py-2.5 rounded-xl border border-border text-[14px] bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="bg-white rounded-2xl border border-border p-6">
              <label className="block mb-1.5 text-[13px] font-medium text-foreground">Assessment Date</label>
              <input
                type="date"
                value={state.assessmentDate}
                onChange={e => setState(prev => ({ ...prev, assessmentDate: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-border text-[14px] bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            {savedAssessments.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-[13px] font-medium text-primary hover:text-primary-light transition-colors"
                >
                  {showHistory ? 'Hide' : 'Show'} saved assessments ({savedAssessments.length})
                </button>
                {showHistory && (
                  <div className="mt-3 space-y-2">
                    {savedAssessments.map(a => (
                      <button
                        key={a.id}
                        onClick={() => loadAssessment(a)}
                        className="w-full text-left bg-white rounded-xl border border-border p-4 hover:border-primary/30 hover:bg-primary/[0.02] transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[14px] font-medium text-foreground">{a.client_name}</span>
                            <span className="text-[12px] text-muted ml-2">{a.assessment_date}</span>
                          </div>
                          {(a.confirmed_posture || a.suggested_posture) && (
                            <span
                              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white"
                              style={{ backgroundColor: POSTURE_META[a.confirmed_posture || a.suggested_posture || '']?.color || '#7a6a72' }}
                            >
                              {POSTURE_META[a.confirmed_posture || a.suggested_posture || '']?.label || 'Unknown'}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 1:
        return (
          <div>
            {unansweredRegions.length > 0 && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-[13px] text-amber-800">
                <span className="font-medium">{unansweredRegions.length} region{unansweredRegions.length > 1 ? 's' : ''} still need{unansweredRegions.length === 1 ? 's' : ''} an answer</span>
                <span className="text-amber-600 ml-1">
                  — {getRegionsForStep(1).filter(r => unansweredRegions.includes(r.key)).map(r => r.label).join(', ')}
                </span>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {SIDE_VIEW_REGIONS.map(r => renderRegionCard(r, state.sideView, 'sideView'))}
            </div>
          </div>
        )

      case 2:
        return (
          <div>
            {unansweredRegions.length > 0 && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-[13px] text-amber-800">
                <span className="font-medium">{unansweredRegions.length} region{unansweredRegions.length > 1 ? 's' : ''} still need{unansweredRegions.length === 1 ? 's' : ''} an answer</span>
                <span className="text-amber-600 ml-1">
                  — {getRegionsForStep(2).filter(r => unansweredRegions.includes(r.key)).map(r => r.label).join(', ')}
                </span>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {FRONT_VIEW_REGIONS.map(r => renderRegionCard(r, state.frontView, 'frontView'))}
            </div>
          </div>
        )

      case 3:
        return (
          <div>
            {unansweredRegions.length > 0 && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-[13px] text-amber-800">
                <span className="font-medium">{unansweredRegions.length} region{unansweredRegions.length > 1 ? 's' : ''} still need{unansweredRegions.length === 1 ? 's' : ''} an answer</span>
                <span className="text-amber-600 ml-1">
                  — {getRegionsForStep(3).filter(r => unansweredRegions.includes(r.key)).map(r => r.label).join(', ')}
                </span>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {BACK_VIEW_REGIONS.map(r => renderRegionCard(r, state.backView, 'backView'))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="max-w-lg mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-border p-6">
              <h4 className="font-heading text-[15px] font-semibold text-foreground mb-3">
                Watch from the side: Are there flat areas?
              </h4>
              <div className="flex gap-4 mb-3">
                <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all text-[13px] ${
                  state.spineSequencing.flatAreas === true ? 'bg-primary/[0.06] border border-primary/20' : 'border border-border hover:bg-black/[0.02]'
                }`}>
                  <input
                    type="radio"
                    name="flatAreas"
                    checked={state.spineSequencing.flatAreas === true}
                    onChange={() => setState(prev => ({ ...prev, spineSequencing: { ...prev.spineSequencing, flatAreas: true } }))}
                    className="w-4 h-4 accent-primary"
                  />
                  Yes
                </label>
                <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all text-[13px] ${
                  state.spineSequencing.flatAreas === false ? 'bg-primary/[0.06] border border-primary/20' : 'border border-border hover:bg-black/[0.02]'
                }`}>
                  <input
                    type="radio"
                    name="flatAreas"
                    checked={state.spineSequencing.flatAreas === false}
                    onChange={() => setState(prev => ({ ...prev, spineSequencing: { ...prev.spineSequencing, flatAreas: false } }))}
                    className="w-4 h-4 accent-primary"
                  />
                  No
                </label>
              </div>
              {state.spineSequencing.flatAreas && (
                <div>
                  <label className="block mb-1.5 text-[12px] font-medium text-muted">Where?</label>
                  <input
                    type="text"
                    value={state.spineSequencing.flatAreasWhere}
                    onChange={e => setState(prev => ({ ...prev, spineSequencing: { ...prev.spineSequencing, flatAreasWhere: e.target.value } }))}
                    placeholder="Describe location"
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-[14px] bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-border p-6">
              <h4 className="font-heading text-[15px] font-semibold text-foreground mb-3">
                Watch and palpate from the back: Are there any imbalances?
              </h4>
              <div className="flex gap-4 mb-3">
                <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all text-[13px] ${
                  state.spineSequencing.imbalances === true ? 'bg-primary/[0.06] border border-primary/20' : 'border border-border hover:bg-black/[0.02]'
                }`}>
                  <input
                    type="radio"
                    name="imbalances"
                    checked={state.spineSequencing.imbalances === true}
                    onChange={() => setState(prev => ({ ...prev, spineSequencing: { ...prev.spineSequencing, imbalances: true } }))}
                    className="w-4 h-4 accent-primary"
                  />
                  Yes
                </label>
                <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all text-[13px] ${
                  state.spineSequencing.imbalances === false ? 'bg-primary/[0.06] border border-primary/20' : 'border border-border hover:bg-black/[0.02]'
                }`}>
                  <input
                    type="radio"
                    name="imbalances"
                    checked={state.spineSequencing.imbalances === false}
                    onChange={() => setState(prev => ({ ...prev, spineSequencing: { ...prev.spineSequencing, imbalances: false } }))}
                    className="w-4 h-4 accent-primary"
                  />
                  No
                </label>
              </div>
              {state.spineSequencing.imbalances && (
                <div>
                  <label className="block mb-1.5 text-[12px] font-medium text-muted">Where?</label>
                  <input
                    type="text"
                    value={state.spineSequencing.imbalancesWhere}
                    onChange={e => setState(prev => ({ ...prev, spineSequencing: { ...prev.spineSequencing, imbalancesWhere: e.target.value } }))}
                    placeholder="Describe location"
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-[14px] bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
              )}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            {/* Posture Detection Result */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Detected Posture Type</h3>

              {detection.posture ? (
                <div className="space-y-4">
                  <div
                    className="rounded-xl p-4 border"
                    style={{
                      backgroundColor: POSTURE_META[detection.posture]?.color + '08',
                      borderColor: POSTURE_META[detection.posture]?.color + '30',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="text-[13px] font-bold text-white px-3 py-1 rounded-lg"
                        style={{ backgroundColor: POSTURE_META[detection.posture]?.color }}
                      >
                        {POSTURE_META[detection.posture]?.numeral}
                      </span>
                      <span className="font-heading text-[16px] font-semibold text-foreground">
                        {POSTURE_META[detection.posture]?.label}
                      </span>
                      <span className="text-[12px] text-muted ml-auto">
                        {detection.scores[detection.posture]?.score}/{detection.scores[detection.posture]?.total} markers
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {detection.scores[detection.posture]?.markers.map((m, i) => (
                        <span key={i} className="text-[11px] px-2 py-1 rounded-lg bg-white border border-border text-muted">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Other scores - only show 100% matches prominently */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(detection.scores)
                      .sort(([, a], [, b]) => (b.score / b.total) - (a.score / a.total))
                      .map(([key, data]) => {
                        const pct = Math.round(data.score / data.total * 100)
                        const isMain = key === detection.posture
                        const isFull = pct === 100
                        if (isMain) return null // already shown above
                        return (
                          <div
                            key={key}
                            className={`rounded-xl px-3 py-2 border text-[12px] transition-all ${
                              isFull
                                ? 'border-primary/30 bg-primary/[0.04]'
                                : 'border-border/40 opacity-[0.15]'
                            }`}
                          >
                            <div className="font-medium text-foreground">{POSTURE_META[key]?.label}</div>
                            <div className="text-muted">{data.score}/{data.total} ({pct}%)</div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              ) : (
                <p className="text-[14px] text-muted">
                  No clear posture type detected. The assessment data does not strongly match any single posture pattern.
                  You can manually select a posture type below.
                </p>
              )}

              {/* Confirm / Override */}
              <div className="mt-5 pt-5 border-t border-border">
                <label className="block mb-2 text-[13px] font-medium text-foreground">
                  Confirm or override posture type
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(POSTURE_META).map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => setState(prev => ({ ...prev, confirmedPosture: key }))}
                      className={`text-[12px] font-medium px-3 py-2 rounded-xl border transition-all ${
                        state.confirmedPosture === key
                          ? 'text-white shadow-sm'
                          : 'text-foreground/60 border-border hover:border-primary/20 hover:bg-primary/[0.03]'
                      }`}
                      style={state.confirmedPosture === key ? { backgroundColor: meta.color, borderColor: meta.color } : undefined}
                    >
                      {meta.numeral} {meta.label}
                    </button>
                  ))}
                  {state.confirmedPosture && (
                    <button
                      onClick={() => setState(prev => ({ ...prev, confirmedPosture: null }))}
                      className="text-[12px] text-muted hover:text-foreground transition-colors px-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Corrective Exercises */}
            {(state.confirmedPosture || state.suggestedPosture) && (
              <div className="bg-white rounded-2xl border border-border p-6">
                <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                  Corrective Exercise Recommendations
                </h3>
                <p className="text-[13px] text-muted mb-4">
                  For {POSTURE_META[state.confirmedPosture || state.suggestedPosture || '']?.label || 'selected posture'}
                </p>

                {Object.keys(groupedExercises).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(groupedExercises).map(([principle, exs]) => (
                      <div key={principle}>
                        <h4 className="text-[12px] font-semibold uppercase tracking-wider text-muted mb-2">{principle}</h4>
                        <div className="space-y-1.5">
                          {exs.map(ex => (
                            <div
                              key={ex.id}
                              className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border hover:bg-black/[0.015] transition-colors"
                            >
                              <div>
                                <span className="text-[13px] font-medium text-foreground">{ex.name}</span>
                                <span className="text-[11px] text-muted ml-2">{ex.reps}</span>
                              </div>
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/50">{ex.layer}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-muted">
                    No corrective exercises found for this posture type.
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <label className="block mb-2 text-[13px] font-medium text-foreground">Notes</label>
              <textarea
                value={state.notes}
                onChange={e => setState(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional observations, recommendations, follow-up plan..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-border text-[14px] bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all resize-none"
              />
            </div>

            {/* Save */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-[14px] font-semibold text-white bg-primary hover:bg-primary-light transition-all px-6 py-3 rounded-xl shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Update Assessment' : 'Save Assessment'}
              </button>
              {saveSuccess && (
                <span className="text-[13px] text-green-600 font-medium">Saved successfully</span>
              )}
              <button
                onClick={() => window.print()}
                className="text-[13px] font-medium text-foreground/60 hover:text-foreground border border-border hover:border-foreground/20 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Export PDF
              </button>
              <button
                onClick={startNew}
                className="text-[13px] font-medium text-muted hover:text-foreground transition-colors ml-auto"
              >
                Start New Assessment
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEP_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => { if (i <= step || (i === 0)) setStep(i) }}
              className={`flex flex-col items-center gap-1.5 transition-all ${
                i <= step ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all ${
                i === step
                  ? 'bg-primary text-white shadow-sm shadow-primary/25'
                  : i < step
                    ? 'bg-primary/10 text-primary'
                    : 'bg-black/[0.04] text-foreground/30'
              }`}>
                {i < step ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${
                i === step ? 'text-foreground' : 'text-foreground/30'
              }`}>
                {label}
              </span>
            </button>
          ))}
        </div>
        <div className="h-1 bg-black/[0.04] rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / (STEP_LABELS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step title */}
      <div className="mb-6">
        <h2 className="font-heading text-xl sm:text-2xl font-semibold text-foreground">
          {STEP_LABELS[step]}
        </h2>
        {step >= 1 && step <= 3 && (
          <p className="text-[13px] text-muted mt-1">
            Select the observed position(s) for each body region. Multiple selections allowed.
          </p>
        )}
      </div>

      {/* Content */}
      {renderStep()}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <button
          onClick={() => setStep(prev => Math.max(0, prev - 1))}
          disabled={step === 0}
          className="text-[13px] font-medium text-foreground/40 hover:text-foreground/70 transition-colors px-4 py-2 rounded-xl hover:bg-black/[0.03] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-foreground/40"
        >
          Back
        </button>
        {step < STEP_LABELS.length - 1 && (
          <button
            onClick={() => setStep(prev => Math.min(STEP_LABELS.length - 1, prev + 1))}
            disabled={!canProceed}
            className="text-[13px] font-semibold text-white bg-primary hover:bg-primary-light transition-all px-5 py-2.5 rounded-xl shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25 disabled:opacity-40"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}
