'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Exercise, PosturalAssessment, Client } from '@/lib/types'

/* ─── constants ─── */

const POSTURE_META: Record<string, { label: string; numeral: string; color: string }> = {
  kyphosis:      { label: 'Kyphosis-Lordosis', numeral: 'I',   color: '#6b2d5b' },
  kyphosis_only: { label: 'Kyphosis',          numeral: 'II',  color: '#8a6d9a' },
  lordosis:      { label: 'Lordosis',           numeral: 'III', color: '#c98a24' },
  flatback:      { label: 'Flat Back',          numeral: 'IV',  color: '#6a8a6e' },
  military:      { label: 'Military',           numeral: 'V',   color: '#7a9a80' },
  swayback:      { label: 'Sway Back',          numeral: 'VI',  color: '#9a7aaa' },
}

const STEP_LABELS = ['Client Info', 'Intake', 'Side View', 'Front View', 'Back View', 'Spine Sequencing', 'Results']

const STORAGE_KEY = 'pilates_assessment_draft'

/* ─── side view regions ─── */
const SIDE_VIEW_REGIONS = [
  { key: 'ankle_joints', label: 'Ankle Joints', options: ['neutral', 'plantar flexed', 'dorsiflexed'], bilateral: true },
  { key: 'knees', label: 'Knees', options: ['neutral', 'hyperextended', 'flexed'], bilateral: true },
  { key: 'hip_joints', label: 'Hip Joints', options: ['neutral', 'flexed', 'extended'], bilateral: true },
  { key: 'pelvis', label: 'Pelvis', options: ['neutral', 'anterior tilt', 'posterior tilt'], bilateral: false },
  { key: 'lumbar_spine', label: 'Lumbar Spine', options: ['neutral', 'decreased curve (flat)', 'increased curve (excessive extension)'], bilateral: false },
  { key: 'lower_thoracic', label: 'Lower Thoracic Spine', options: ['neutral', 'decreased curve (flat)', 'increased curve (excessive flexion)'], bilateral: false },
  { key: 'upper_thoracic', label: 'Upper Thoracic Spine', options: ['neutral', 'decreased curve (flat)', 'increased curve (excessive flexion)'], bilateral: false },
  { key: 'cervical_spine', label: 'Cervical Spine', options: ['neutral', 'decreased curve (flat)', 'increased curve (excessive extension)'], bilateral: false },
  { key: 'head', label: 'Head', options: ['neutral', 'forward', 'retracted'], bilateral: false },
]

/* ─── front view regions ─── */
const FRONT_VIEW_REGIONS = [
  { key: 'feet', label: 'Feet', options: ['neutral', 'supinated', 'pronated'], bilateral: true },
  { key: 'knees', label: 'Knees', options: ['neutral', 'knock-kneed', 'bow-legged'], bilateral: false, hasSubOption: true },
  { key: 'pelvis', label: 'Pelvis', options: ['level', 'elevated', 'rotated clockwise', 'rotated counter-clockwise'], bilateral: false, hasNonBilateralClusters: true },
  { key: 'rib_cage', label: 'Rib Cage', options: ['neutral', 'elevated', 'shifted', 'rotated clockwise', 'rotated counter-clockwise'], bilateral: false, hasNonBilateralClusters: true },
  { key: 'shoulders', label: 'Shoulders', options: ['neutral', 'elevated', 'depressed'], bilateral: true },
  { key: 'head', label: 'Head', options: ['neutral', 'tilted', 'shifted', 'rotated clockwise', 'rotated counter-clockwise'], bilateral: false, hasNonBilateralClusters: true },
]

/* ─── back view regions ─── */
const BACK_VIEW_REGIONS = [
  { key: 'feet', label: 'Feet', options: ['neutral', 'supinated', 'pronated'], bilateral: true },
  { key: 'femurs', label: 'Femurs', options: ['neutral', 'medial rotation', 'lateral rotation'], bilateral: true },
  { key: 'pelvis', label: 'Pelvis', options: ['level', 'elevated', 'rotated clockwise', 'rotated counter-clockwise'], bilateral: false, hasNonBilateralClusters: true },
  {
    key: 'scapulae',
    label: 'Scapulae',
    options: ['neutral', 'protracted', 'retracted', 'elevated', 'depressed', 'upwardly rotated', 'downwardly rotated', 'winging', 'anterior tilt'],
    bilateral: true,
    hasClusters: true,
  },
  { key: 'humeri', label: 'Humeri', options: ['neutral', 'medially rotated'], bilateral: true },
]

/* ─── scapulae clusters ─── */
const SCAPULAE_CLUSTERS = [
  { label: 'Position', options: ['neutral', 'protracted', 'retracted'], multiSelect: false },
  { label: 'Elevation', options: ['elevated', 'depressed'], multiSelect: false },
  { label: 'Rotation', options: ['upwardly rotated', 'downwardly rotated'], multiSelect: false },
  { label: 'Other', options: ['winging', 'anterior tilt'], multiSelect: true },
]

/* ─── non-bilateral clusters ─── */
const NON_BILATERAL_CLUSTERS: Record<string, { label: string; options: string[]; lateralOptions?: string[] }[]> = {
  pelvis: [
    { label: 'Level / Elevation', options: ['level', 'elevated'], lateralOptions: ['elevated'] },
    { label: 'Rotation', options: ['rotated clockwise', 'rotated counter-clockwise'] },
  ],
  rib_cage: [
    { label: 'Position', options: ['neutral', 'elevated'], lateralOptions: ['elevated'] },
    { label: 'Shift', options: ['shifted'], lateralOptions: ['shifted'] },
    { label: 'Rotation', options: ['rotated clockwise', 'rotated counter-clockwise'] },
  ],
  head: [
    { label: 'Tilt', options: ['neutral', 'tilted'], lateralOptions: ['tilted'] },
    { label: 'Shift', options: ['shifted'], lateralOptions: ['shifted'] },
    { label: 'Rotation', options: ['rotated clockwise', 'rotated counter-clockwise'] },
  ],
}

/* ─── types ─── */

interface RegionValue {
  values: string[]
  laterality?: Record<string, { right?: boolean; left?: boolean }>
  /** For independently-sided regions: separate selections per side */
  leftValues?: string[]
  rightValues?: string[]
  /** Optional notes per region */
  regionNotes?: string
  /** Sub-option e.g. 'functional' or 'structural' for knees */
  subOption?: string
}

interface ClientIntake {
  sex: string
  age: string
  occupation: string
  typicalDay: string
  typicalDayDetails: string
  medicalConditions: string
  pregnantPostnatal: string
  pregnantPostnatalDetails: string
  medication: string
  medicationDetails: string
  surgeries: string
  surgeryDetails: string
  difficultMovements: string
  functionalConcerns: string[]
  medicalRestrictions: string
  currentInjuries: string
  currentInjuryDetails: string
  previousInjuries: string
  previousInjuryDetails: string
  recurringPain: string[]
  recurringPainOther: string
  painTiming: string[]
  painTimingOther: string
  currentActivities: string[]
  currentActivitiesOther: string
  activityFrequency: string
  pilatesExperience: string
  pilatesGoals: string[]
  specificGoals: string
  anythingElse: string
}

interface WizardState {
  clientName: string
  assessmentDate: string
  clientIntake: ClientIntake
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
  clients?: Client[]
}

/* ─── initial state ─── */

const EMPTY_INTAKE: ClientIntake = {
  sex: '', age: '', occupation: '', typicalDay: '', typicalDayDetails: '',
  medicalConditions: '', pregnantPostnatal: '', pregnantPostnatalDetails: '',
  medication: '', medicationDetails: '', surgeries: '', surgeryDetails: '',
  difficultMovements: '', functionalConcerns: [], medicalRestrictions: '',
  currentInjuries: '', currentInjuryDetails: '', previousInjuries: '', previousInjuryDetails: '',
  recurringPain: [], recurringPainOther: '', painTiming: [], painTimingOther: '',
  currentActivities: [], currentActivitiesOther: '', activityFrequency: '',
  pilatesExperience: '', pilatesGoals: [],
  specificGoals: '', anythingElse: '',
}

function createInitialState(): WizardState {
  const today = new Date().toISOString().split('T')[0]
  return {
    clientName: '',
    assessmentDate: today,
    clientIntake: { ...EMPTY_INTAKE },
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

/* ─── intake constants ─── */

/* intake constants removed — intake is now client-facing via /intake/[token] */

/* ─── intake info (now client-facing, this step just shows info) ─── */

function IntakeForm() {
  return (
    <div className="max-w-lg mx-auto text-center py-8">
      <svg className="w-12 h-12 mx-auto text-foreground/10 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-3.022a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364l1.757 1.757" />
      </svg>
      <h3 className="font-heading text-[16px] font-semibold text-foreground mb-2">Client intake is now self-service</h3>
      <p className="text-[13px] text-muted leading-relaxed max-w-sm mx-auto">
        The intake questionnaire is completed by the client directly via a shareable link. You can manage intake forms from the client profile in the <strong>Clients</strong> section.
      </p>
      <p className="text-[12px] text-muted/50 mt-4">You can skip this step and proceed to the assessment.</p>
    </div>
  )
}

/* ─── helpers ─── */

/** "neutral" is fully mutually exclusive with deviations; "level" can coexist with rotations */
function isNeutralOption(opt: string): boolean {
  return opt === 'neutral'
}

/** Options within the same group that are mutually exclusive with each other */
const EXCLUSIVE_GROUPS: Record<string, string[][]> = {
}

/** Regions where all options are mutually exclusive (radio / single-select) — view-specific */
const SINGLE_SELECT_REGIONS = new Set([
  'sideView:head', 'sideView:cervical_spine', 'sideView:upper_thoracic',
  'sideView:lower_thoracic', 'sideView:lumbar_spine', 'sideView:pelvis',
  'frontView:knees',
])

/** Check whether a region has any non-neutral selected value that matches a target */
function regionHasValue(rv: RegionValue | undefined, target: string): boolean {
  if (!rv) return false
  return rv.values.includes(target)
}

/** Get the list of regions for a given step */
function getRegionsForStep(step: number): { key: string; label: string; options: string[]; bilateral?: boolean; guidance?: string; hasClusters?: boolean; hasSubOption?: boolean; lateralSubOptions?: string[]; hasNonBilateralClusters?: boolean }[] {
  switch (step) {
    case 2: return SIDE_VIEW_REGIONS
    case 3: return FRONT_VIEW_REGIONS
    case 4: return BACK_VIEW_REGIONS
    default: return []
  }
}

/** Get the view data for a given step */
function getViewDataForStep(state: WizardState, step: number): Record<string, RegionValue> {
  switch (step) {
    case 2: return state.sideView
    case 3: return state.frontView
    case 4: return state.backView
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
      if (!rv) return true
      if (r.bilateral) {
        // Bilateral regions need both left and right answered
        return (!rv.leftValues || rv.leftValues.length === 0) || (!rv.rightValues || rv.rightValues.length === 0)
      }
      return rv.values.length === 0
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

export default function AssessmentWizard({ user, savedAssessments, exercises, clients = [] }: Props) {
  const [step, setStep] = useState(0)
  const [state, setState] = useState<WizardState>(createInitialState)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [linkedClientId, setLinkedClientId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Auto-link to client from query param (?client=id)
  useEffect(() => {
    const clientParam = searchParams.get('client')
    if (clientParam && clients.length > 0) {
      const matched = clients.find(c => c.id === clientParam)
      if (matched) {
        setLinkedClientId(matched.id)
        const fullName = [matched.first_name, matched.last_name].filter(Boolean).join(' ')
        setState(prev => ({ ...prev, clientName: fullName }))
      }
    }
  }, [searchParams, clients])

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
    if (step === 6 && detection.posture) {
      setState(prev => ({ ...prev, suggestedPosture: detection.posture }))
    }
  }, [step, detection.posture])

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

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

      // Single-select regions: only one option at a time
      if (SINGLE_SELECT_REGIONS.has(`${viewKey}:${regionKey}`)) {
        if (current.values.includes(option)) {
          newValues = []
          newLaterality = {}
        } else {
          newValues = [option]
          newLaterality = {}
        }
      } else if (isNeutralOption(option)) {
        // "neutral" clears everything
        newValues = current.values.includes(option) ? [] : [option]
        newLaterality = {}
      } else {
        // Remove neutral first
        let working = current.values.filter(v => !isNeutralOption(v))

        if (working.includes(option)) {
          // Deselecting
          working = working.filter(v => v !== option)
          delete newLaterality[option]
        } else {
          // Selecting: remove any exclusive-group conflicts
          const groups = EXCLUSIVE_GROUPS[regionKey] || []
          for (const group of groups) {
            if (group.includes(option)) {
              working = working.filter(v => !group.includes(v))
            }
          }
          working = [...working, option]
        }
        newValues = working
      }

      return {
        ...prev,
        [viewKey]: { ...view, [regionKey]: { ...current, values: newValues, laterality: newLaterality } },
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

  /** Toggle a value for a specific side (left/right) on bilateral regions — single-select per side */
  const toggleSideValue = useCallback((
    viewKey: 'sideView' | 'frontView' | 'backView',
    regionKey: string,
    side: 'left' | 'right',
    option: string,
  ) => {
    setState(prev => {
      const view = prev[viewKey]
      const current = view[regionKey] || { values: [], leftValues: [], rightValues: [] }
      const sideKey = side === 'left' ? 'leftValues' : 'rightValues'
      const sideVals = current[sideKey] || []

      // Single-select: clicking same option deselects, clicking different replaces
      let newVals: string[]
      if (sideVals.includes(option)) {
        newVals = [] // deselect
      } else {
        newVals = [option] // replace with single selection
      }

      const otherKey = side === 'left' ? 'rightValues' : 'leftValues'
      const otherVals = current[otherKey] || []
      const combined = [...new Set([...newVals, ...otherVals].filter(v => !isNeutralOption(v)))]

      return {
        ...prev,
        [viewKey]: {
          ...view,
          [regionKey]: {
            ...current,
            [sideKey]: newVals,
            values: combined.length > 0 ? combined : (newVals.includes('neutral') || otherVals.includes('neutral') ? ['neutral'] : []),
          },
        },
      }
    })
  }, [])

  /** Toggle a value for a specific side within a cluster (e.g. scapulae) — single-select per cluster unless multiSelect */
  const toggleClusterValue = useCallback((
    viewKey: 'sideView' | 'frontView' | 'backView',
    regionKey: string,
    side: 'left' | 'right',
    option: string,
    clusterOptions: string[],
    multiSelect?: boolean,
  ) => {
    setState(prev => {
      const view = prev[viewKey]
      const current = view[regionKey] || { values: [], leftValues: [], rightValues: [] }
      const sideKey = side === 'left' ? 'leftValues' : 'rightValues'
      const sideVals = current[sideKey] || []

      let newVals: string[]
      if (sideVals.includes(option)) {
        newVals = sideVals.filter(v => v !== option)
      } else if (multiSelect) {
        // Multi-select: just add it without removing others in the cluster
        newVals = [...sideVals, option]
      } else {
        // Remove other options from same cluster, add this one
        newVals = sideVals.filter(v => !clusterOptions.includes(v))
        newVals.push(option)
      }

      const otherKey = side === 'left' ? 'rightValues' : 'leftValues'
      const otherVals = current[otherKey] || []
      const combined = [...new Set([...newVals, ...otherVals].filter(v => v !== 'neutral'))]

      return {
        ...prev,
        [viewKey]: {
          ...view,
          [regionKey]: {
            ...current,
            [sideKey]: newVals,
            values: combined.length > 0 ? combined : [],
          },
        },
      }
    })
  }, [])

  /** Update notes for a region */
  const updateRegionNotes = useCallback((
    viewKey: 'sideView' | 'frontView' | 'backView',
    regionKey: string,
    notes: string,
  ) => {
    setState(prev => {
      const view = prev[viewKey]
      const current = view[regionKey] || { values: [] }
      return {
        ...prev,
        [viewKey]: { ...view, [regionKey]: { ...current, regionNotes: notes } },
      }
    })
  }, [])

  /** Toggle a value within a non-bilateral cluster (radio-style within each cluster) */
  const toggleClusterValueNonBilateral = useCallback((
    viewKey: 'sideView' | 'frontView' | 'backView',
    regionKey: string,
    option: string,
    clusterOptions: string[],
  ) => {
    setState(prev => {
      const view = prev[viewKey]
      const current = view[regionKey] || { values: [], laterality: {} }

      // Remove all options from this cluster, then add the selected one (or toggle off)
      let newValues = current.values.filter(v => !clusterOptions.includes(v))
      const newLaterality = { ...(current.laterality || {}) }

      if (!current.values.includes(option)) {
        // Selecting - add it
        newValues.push(option)
      } else {
        // Deselecting - clean up laterality
        delete newLaterality[option]
      }

      // Clean up laterality for removed cluster options
      clusterOptions.forEach(o => {
        if (!newValues.includes(o)) delete newLaterality[o]
      })

      return {
        ...prev,
        [viewKey]: { ...view, [regionKey]: { ...current, values: newValues, laterality: newLaterality } },
      }
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)

    const payload = {
      user_id: user.id,
      client_id: linkedClientId || null,
      client_name: state.clientName,
      assessment_date: state.assessmentDate,
      client_intake: state.clientIntake,
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
      clientIntake: { ...EMPTY_INTAKE, ...((a as unknown as Record<string, unknown>).client_intake as Partial<ClientIntake> || {}) },
      sideView: migrateView(a.side_view as Record<string, { value?: string; values?: string[]; right?: boolean; left?: boolean }>),
      frontView: migrateView(a.front_view as Record<string, { value?: string; values?: string[]; right?: boolean; left?: boolean }>),
      backView: migrateView(a.back_view as Record<string, { value?: string; values?: string[]; right?: boolean; left?: boolean }>),
      spineSequencing: a.spine_sequencing as WizardState['spineSequencing'],
      suggestedPosture: a.suggested_posture,
      confirmedPosture: a.confirmed_posture,
      notes: a.notes || '',
    })
    setEditingId(a.id)
    setStep(6)
    setShowHistory(false)
  }

  const startNew = () => {
    setState(createInitialState())
    setStep(0)
    setEditingId(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  // canProceed: step 0 requires client name; step 1 always (intake is optional); steps 2-4 require all regions answered
  const canProceed = useMemo(() => {
    if (step === 0) return state.clientName.trim().length > 0
    if (step === 1) return true // intake is optional
    if (step >= 2 && step <= 4) return unansweredRegions.length === 0
    return true
  }, [step, state.clientName, unansweredRegions])

  /* ─── render helpers ─── */

  function renderRegionCard(
    region: { key: string; label: string; options: string[]; bilateral?: boolean; guidance?: string; hasClusters?: boolean; hasSubOption?: boolean; lateralSubOptions?: string[]; hasNonBilateralClusters?: boolean },
    viewData: Record<string, RegionValue>,
    viewKey: 'sideView' | 'frontView' | 'backView',
  ) {
    const current = viewData[region.key] || { values: [] }

    // For non-bilateral regions with clusters (head, pelvis, rib_cage in front/back view)
    if (region.hasNonBilateralClusters) {
      const clusters = NON_BILATERAL_CLUSTERS[region.key] || []
      const isUnanswered = current.values.length === 0

      return (
        <div key={region.key} className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all ${
          isUnanswered ? 'border-l-[3px] border-l-amber-400 border-t-border border-r-border border-b-border bg-amber-50/30' : 'border-border'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-heading text-[15px] font-semibold text-foreground">{region.label}</h4>
            {isUnanswered && <span className="text-[11px] font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-lg">Required</span>}
          </div>
          <div className="space-y-4">
            {clusters.map(cluster => (
              <div key={cluster.label}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/30 mb-1.5 px-1">{cluster.label}</div>
                <div className="space-y-1.5">
                  {cluster.options.map(opt => {
                    const isSelected = current.values.includes(opt)
                    return (
                      <div key={opt}>
                        <label className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-[13px] ${
                          isSelected ? 'bg-primary/[0.06] text-foreground border border-primary/20' : 'hover:bg-black/[0.02] border border-transparent'
                        }`}>
                          <input
                            type="radio"
                            name={`${viewKey}-${region.key}-${cluster.label}`}
                            checked={isSelected}
                            onChange={() => toggleClusterValueNonBilateral(viewKey, region.key, opt, cluster.options)}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="capitalize">{opt}</span>
                        </label>
                        {/* R/L sub-choice for lateral options */}
                        {cluster.lateralOptions?.includes(opt) && isSelected && (
                          <div className="ml-10 mt-1 mb-1 flex items-center gap-3">
                            {(['right', 'left'] as const).map(side => (
                              <label key={side} className="flex items-center gap-1.5 text-[12px] text-muted">
                                <input
                                  type="radio"
                                  name={`${region.key}-${opt}-side`}
                                  checked={current.laterality?.[opt]?.[side] === true}
                                  onChange={() => {
                                    setState(prev => {
                                      const view = prev[viewKey]
                                      const cur = view[region.key] || { values: [] }
                                      return {
                                        ...prev,
                                        [viewKey]: {
                                          ...view,
                                          [region.key]: {
                                            ...cur,
                                            laterality: {
                                              ...(cur.laterality || {}),
                                              [opt]: { right: side === 'right', left: side === 'left' },
                                            },
                                          },
                                        },
                                      }
                                    })
                                  }}
                                  className="w-3.5 h-3.5 accent-primary"
                                />
                                <span className="capitalize">{side}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {/* "None" option to deselect for clusters without neutral/level */}
                  {!cluster.options.includes('neutral') && !cluster.options.includes('level') && (
                    <label className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-[13px] ${
                      !cluster.options.some(o => current.values.includes(o)) ? 'bg-black/[0.02] text-foreground/40 border border-transparent' : 'hover:bg-black/[0.02] border border-transparent text-foreground/40'
                    }`}>
                      <input
                        type="radio"
                        name={`${viewKey}-${region.key}-${cluster.label}`}
                        checked={!cluster.options.some(o => current.values.includes(o))}
                        onChange={() => {
                          // Deselect all options in this cluster
                          setState(prev => {
                            const view = prev[viewKey]
                            const cur = view[region.key] || { values: [] }
                            const newValues = cur.values.filter(v => !cluster.options.includes(v))
                            const newLaterality = { ...(cur.laterality || {}) }
                            cluster.options.forEach(o => delete newLaterality[o])
                            return {
                              ...prev,
                              [viewKey]: { ...view, [region.key]: { ...cur, values: newValues, laterality: newLaterality } },
                            }
                          })
                        }}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-foreground/40 italic">None</span>
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Notes */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <input type="text" value={current.regionNotes || ''} onChange={e => updateRegionNotes(viewKey, region.key, e.target.value)} placeholder="Notes..." className="w-full text-[12px] px-3 py-1.5 bg-background border border-border/60 rounded-lg focus:outline-none focus:border-primary/30 text-muted placeholder:text-foreground/20 transition-all" />
          </div>
        </div>
      )
    }

    // For bilateral regions with clusters (scapulae)
    if (region.bilateral && region.hasClusters) {
      const leftVals = current.leftValues || []
      const rightVals = current.rightValues || []
      const isUnanswered = leftVals.length === 0 || rightVals.length === 0

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
              <span className="text-[11px] font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-lg">Required</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['left', 'right'] as const).map(side => {
              const sideVals = side === 'left' ? leftVals : rightVals
              return (
                <div key={side}>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2 text-center">
                    {side === 'left' ? 'Left' : 'Right'}
                  </div>
                  <div className="space-y-3">
                    {SCAPULAE_CLUSTERS.map(cluster => (
                      <div key={cluster.label}>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/30 mb-1 px-1">{cluster.label}</div>
                        <div className="space-y-1">
                          {cluster.options.map(opt => {
                            const isSelected = sideVals.includes(opt)
                            return (
                              <label
                                key={opt}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-[11px] ${
                                  isSelected
                                    ? 'bg-primary/[0.06] text-foreground border border-primary/20'
                                    : 'hover:bg-black/[0.02] border border-transparent'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleClusterValue(viewKey, region.key, side, opt, cluster.options, cluster.multiSelect)}
                                  className="w-3 h-3 accent-primary rounded"
                                />
                                <span className="capitalize leading-tight">{opt}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-border/50">
            <input
              type="text"
              value={current.regionNotes || ''}
              onChange={e => updateRegionNotes(viewKey, region.key, e.target.value)}
              placeholder="Notes..."
              className="w-full text-[12px] px-3 py-1.5 bg-background border border-border/60 rounded-lg focus:outline-none focus:border-primary/30 text-muted placeholder:text-foreground/20 transition-all"
            />
          </div>
        </div>
      )
    }

    // For bilateral regions: each side is independent
    if (region.bilateral) {
      const leftVals = current.leftValues || []
      const rightVals = current.rightValues || []
      const isUnanswered = leftVals.length === 0 || rightVals.length === 0

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
          <div className="grid grid-cols-2 gap-3">
            {/* Left side */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2 text-center">Left</div>
              <div className="space-y-1.5">
                {region.options.map(opt => {
                  const isSelected = leftVals.includes(opt)
                  return (
                    <label
                      key={opt}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all text-[12px] ${
                        isSelected
                          ? 'bg-primary/[0.06] text-foreground border border-primary/20'
                          : 'hover:bg-black/[0.02] border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSideValue(viewKey, region.key, 'left', opt)}
                        className="w-3.5 h-3.5 accent-primary rounded"
                      />
                      <span className="capitalize leading-tight">{opt}</span>
                    </label>
                  )
                })}
              </div>
            </div>
            {/* Right side */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2 text-center">Right</div>
              <div className="space-y-1.5">
                {region.options.map(opt => {
                  const isSelected = rightVals.includes(opt)
                  return (
                    <label
                      key={opt}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all text-[12px] ${
                        isSelected
                          ? 'bg-primary/[0.06] text-foreground border border-primary/20'
                          : 'hover:bg-black/[0.02] border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSideValue(viewKey, region.key, 'right', opt)}
                        className="w-3.5 h-3.5 accent-primary rounded"
                      />
                      <span className="capitalize leading-tight">{opt}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
          {/* Notes */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <input
              type="text"
              value={current.regionNotes || ''}
              onChange={e => updateRegionNotes(viewKey, region.key, e.target.value)}
              placeholder="Notes..."
              className="w-full text-[12px] px-3 py-1.5 bg-background border border-border/60 rounded-lg focus:outline-none focus:border-primary/30 text-muted placeholder:text-foreground/20 transition-all"
            />
          </div>
        </div>
      )
    }

    // Non-bilateral region (original logic)
    const isUnanswered = current.values.length === 0

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
                    type={SINGLE_SELECT_REGIONS.has(`${viewKey}:${region.key}`) ? "radio" : "checkbox"}
                    checked={isSelected}
                    onChange={() => toggleValue(viewKey, region.key, opt)}
                    name={SINGLE_SELECT_REGIONS.has(`${viewKey}:${region.key}`) ? `${viewKey}-${region.key}` : undefined}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="capitalize">{opt}</span>
                </label>
                {region.lateralSubOptions?.includes(opt) && isSelected && (
                  <div className="ml-10 mt-1 mb-1 flex items-center gap-3">
                    {(['right', 'left'] as const).map(side => (
                      <label key={side} className="flex items-center gap-1.5 text-[12px] text-muted">
                        <input
                          type="radio"
                          name={`${region.key}-${opt}-side`}
                          checked={current.laterality?.[opt]?.[side] === true}
                          onChange={() => {
                            setState(prev => {
                              const view = prev[viewKey]
                              const cur = view[region.key] || { values: [] }
                              return {
                                ...prev,
                                [viewKey]: {
                                  ...view,
                                  [region.key]: {
                                    ...cur,
                                    laterality: {
                                      ...(cur.laterality || {}),
                                      [opt]: { right: side === 'right', left: side === 'left' },
                                    },
                                  },
                                },
                              }
                            })
                          }}
                          className="w-3.5 h-3.5 accent-primary"
                        />
                        <span className="capitalize">{side}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {region.hasSubOption && current.values.some(v => v === 'knock-kneed' || v === 'bow-legged') && (
          <div className="mt-3 pl-3 flex items-center gap-2">
            <span className="text-[12px] font-medium text-muted">Type:</span>
            {['functional', 'structural'].map(type => (
              <label key={type} className={`inline-flex items-center gap-1.5 text-[12px] cursor-pointer px-2.5 py-1.5 rounded-lg border transition-all ${
                current.subOption === type ? 'bg-primary/[0.06] border-primary/20 text-foreground font-medium' : 'border-transparent text-muted hover:bg-black/[0.02]'
              }`}>
                <input
                  type="radio"
                  name={`${region.key}-subopt`}
                  checked={current.subOption === type}
                  onChange={() => setState(prev => ({
                    ...prev,
                    [viewKey]: {
                      ...prev[viewKey],
                      [region.key]: { ...prev[viewKey][region.key], subOption: type },
                    },
                  }))}
                  className="w-3.5 h-3.5 accent-primary"
                />
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
        )}
        {/* Notes */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <input
            type="text"
            value={current.regionNotes || ''}
            onChange={e => updateRegionNotes(viewKey, region.key, e.target.value)}
            placeholder="Notes..."
            className="w-full text-[12px] px-3 py-1.5 bg-background border border-border/60 rounded-lg focus:outline-none focus:border-primary/30 text-muted placeholder:text-foreground/20 transition-all"
          />
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
            {/* Client selector (optional — link to existing client) */}
            {clients.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-6">
                <label className="block mb-1.5 text-[13px] font-medium text-foreground">Link to Client <span className="text-foreground/30 font-normal">(optional)</span></label>
                <select
                  value={linkedClientId || ''}
                  onChange={e => {
                    const id = e.target.value
                    if (id) {
                      const c = clients.find(cl => cl.id === id)
                      if (c) {
                        setLinkedClientId(id)
                        const fullName = [c.first_name, c.last_name].filter(Boolean).join(' ')
                        setState(prev => ({ ...prev, clientName: fullName }))
                      }
                    } else {
                      setLinkedClientId(null)
                      setState(prev => ({ ...prev, clientName: '' }))
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-border text-[14px] bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                >
                  <option value="">Standalone assessment (no client)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {[c.first_name, c.last_name].filter(Boolean).join(' ')}{c.age ? ` (${c.age})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted/50 mt-2">
                  {linkedClientId
                    ? 'This assessment will be saved to the client\'s profile.'
                    : 'Leave unlinked for prospects or external assessments. You can still record a name below.'}
                </p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-border p-6">
              <label className="block mb-1.5 text-[13px] font-medium text-foreground">
                {linkedClientId ? 'Client Name' : 'Name *'}
              </label>
              <input
                type="text"
                value={state.clientName}
                onChange={e => setState(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="Enter client name"
                readOnly={!!linkedClientId}
                className={`w-full px-4 py-2.5 rounded-xl border border-border text-[14px] bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all ${linkedClientId ? 'opacity-60 cursor-not-allowed' : ''}`}
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
        return <IntakeForm />

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
              {SIDE_VIEW_REGIONS.map(r => renderRegionCard(r, state.sideView, 'sideView'))}
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
              {FRONT_VIEW_REGIONS.map(r => renderRegionCard(r, state.frontView, 'frontView'))}
            </div>
          </div>
        )

      case 4:
        return (
          <div>
            {unansweredRegions.length > 0 && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-[13px] text-amber-800">
                <span className="font-medium">{unansweredRegions.length} region{unansweredRegions.length > 1 ? 's' : ''} still need{unansweredRegions.length === 1 ? 's' : ''} an answer</span>
                <span className="text-amber-600 ml-1">
                  — {getRegionsForStep(4).filter(r => unansweredRegions.includes(r.key)).map(r => r.label).join(', ')}
                </span>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {BACK_VIEW_REGIONS.map(r => renderRegionCard(r, state.backView, 'backView'))}
            </div>
          </div>
        )

      case 5:
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

      case 6: {
        // Collect all deviations across all views for the findings summary
        const allFindings: { view: string; region: string; finding: string; notes?: string }[] = []
        const viewConfigs: [string, Record<string, RegionValue>, typeof SIDE_VIEW_REGIONS][] = [
          ['Side View', state.sideView, SIDE_VIEW_REGIONS],
          ['Front View', state.frontView, FRONT_VIEW_REGIONS],
          ['Back View', state.backView, BACK_VIEW_REGIONS],
        ]
        for (const [viewName, viewData, regions] of viewConfigs) {
          for (const r of regions) {
            const rv = viewData[r.key]
            if (!rv) continue
            if (r.bilateral) {
              const leftVals = (rv.leftValues || []).filter(v => !isNeutralOption(v))
              const rightVals = (rv.rightValues || []).filter(v => !isNeutralOption(v))
              for (const v of leftVals) {
                allFindings.push({ view: viewName, region: r.label, finding: `Left: ${v}` })
              }
              for (const v of rightVals) {
                allFindings.push({ view: viewName, region: r.label, finding: `Right: ${v}` })
              }
            } else {
              const deviations = rv.values.filter(v => !isNeutralOption(v) && v !== 'level')
              for (const v of deviations) {
                allFindings.push({ view: viewName, region: r.label, finding: v })
              }
              if (rv.subOption) {
                allFindings.push({ view: viewName, region: r.label, finding: `Type: ${rv.subOption}` })
              }
            }
            if (rv.regionNotes) {
              allFindings.push({ view: viewName, region: r.label, finding: `Note: ${rv.regionNotes}`, notes: rv.regionNotes })
            }
          }
        }

        return (
          <div className="space-y-6">
            {/* Findings Summary */}
            {allFindings.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-6">
                <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Findings Summary</h3>
                {viewConfigs.map(([viewName]) => {
                  const viewFindings = allFindings.filter(f => f.view === viewName)
                  if (viewFindings.length === 0) return null
                  return (
                    <div key={viewName} className="mb-4 last:mb-0">
                      <h4 className="text-[12px] font-bold uppercase tracking-wider text-muted mb-2">{viewName}</h4>
                      <div className="space-y-1">
                        {viewFindings.map((f, i) => (
                          <div
                            key={i}
                            className={`flex items-start gap-2 text-[13px] px-3 py-2 rounded-lg ${
                              f.notes ? 'bg-secondary/[0.05] text-secondary' : 'bg-primary/[0.04] text-foreground'
                            }`}
                          >
                            <span className="font-medium text-foreground/60 shrink-0 w-28">{f.region}</span>
                            <span className="capitalize">{f.finding}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {state.spineSequencing.flatAreas && (
                  <div className="mt-3 text-[13px] px-3 py-2 rounded-lg bg-primary/[0.04]">
                    <span className="font-medium text-foreground/60">Spine sequencing:</span>{' '}
                    <span>Flat areas — {state.spineSequencing.flatAreasWhere}</span>
                  </div>
                )}
                {state.spineSequencing.imbalances && (
                  <div className="mt-1 text-[13px] px-3 py-2 rounded-lg bg-primary/[0.04]">
                    <span className="font-medium text-foreground/60">Spine sequencing:</span>{' '}
                    <span>Imbalances — {state.spineSequencing.imbalancesWhere}</span>
                  </div>
                )}
              </div>
            )}

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
      }

      default:
        return null
    }
  }

  const handleHomeClick = () => {
    if (step === 6) {
      // On results step — show dialog with PDF option
      setShowLeaveDialog(true)
    } else if (step > 0) {
      setShowLeaveDialog(true)
    } else {
      router.push('/')
    }
  }

  const handleSaveDraft = () => {
    // Draft is already auto-saved to localStorage
    setShowLeaveDialog(false)
    router.push('/')
  }

  const handleDiscard = () => {
    localStorage.removeItem(STORAGE_KEY)
    setShowLeaveDialog(false)
    router.push('/')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Leave dialog */}
      {showLeaveDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowLeaveDialog(false)} />
          <div className="relative bg-white rounded-2xl border border-border shadow-xl p-6 sm:p-8 max-w-sm w-full mx-4">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
              {step === 6 ? 'Leave Results?' : 'Leave Assessment?'}
            </h3>
            <p className="text-[13px] text-muted mb-6">
              {step === 6
                ? 'Would you like to export the results before leaving?'
                : 'You have an assessment in progress. What would you like to do?'}
            </p>
            <div className="space-y-2.5">
              {step === 6 ? (
                <>
                  <button
                    onClick={() => { window.print(); }}
                    className="w-full text-[13px] font-semibold text-white bg-primary hover:bg-primary-light transition-all px-4 py-2.5 rounded-xl shadow-sm shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    Export PDF
                  </button>
                  <button
                    onClick={() => { setShowLeaveDialog(false); router.push('/'); }}
                    className="w-full text-[13px] font-medium text-foreground/60 hover:text-foreground border border-border hover:border-foreground/20 transition-all px-4 py-2.5 rounded-xl"
                  >
                    Go Home
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSaveDraft}
                    className="w-full text-[13px] font-semibold text-white bg-primary hover:bg-primary-light transition-all px-4 py-2.5 rounded-xl shadow-sm shadow-primary/20"
                  >
                    Save Draft &amp; Go Home
                  </button>
                  <button
                    onClick={handleDiscard}
                    className="w-full text-[13px] font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 hover:bg-red-50 transition-all px-4 py-2.5 rounded-xl"
                  >
                    Discard &amp; Go Home
                  </button>
                </>
              )}
              <button
                onClick={() => setShowLeaveDialog(false)}
                className="w-full text-[13px] font-medium text-foreground/50 hover:text-foreground/70 transition-colors px-4 py-2.5 rounded-xl hover:bg-black/[0.03]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Home button */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleHomeClick}
          className="flex items-center gap-1.5 text-[13px] font-medium text-foreground/40 hover:text-foreground/70 transition-colors px-3 py-1.5 rounded-lg hover:bg-black/[0.03]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          Home
        </button>
      </div>

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
        {step >= 2 && step <= 4 && (
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
