export interface ExerciseProp {
  tool: string
  name: string
  for: string
  tip: string
  category: 'correction' | 'modification'
}

export interface PostureAdjustments {
  kyphosis?: string | null
  kyphosis_only?: string | null
  lordosis?: string | null
  flatback?: string | null
  military?: string | null
  swayback?: string | null
}

export interface ExerciseVariation {
  name: string
  description: string
}

export interface PostureBenefits {
  kyphosis?: 'corrective' | 'awareness'
  kyphosis_only?: 'corrective' | 'awareness'
  lordosis?: 'corrective' | 'awareness'
  flatback?: 'corrective' | 'awareness'
  military?: 'corrective' | 'awareness'
  swayback?: 'corrective' | 'awareness'
}

export interface StructuredCues {
  setup: string[]
  movement: string[]
  key_cues: string[]
  watch_for: string[]
}

export interface Exercise {
  id: string
  name: string
  layer: 'warmup' | 'layer1' | 'layer2' | 'layer3'
  reps: string
  start_position: string
  inhale: string
  exhale: string
  breath_note: string | null
  primary_muscles: string[]
  secondary_muscles: string[]
  props: ExerciseProp[] | null
  postures: PostureAdjustments | null
  posture_benefits: PostureBenefits | null
  principles: string[] | null
  sort_order: number
  variations: ExerciseVariation[] | null
  cues: StructuredCues | null
}

export interface Favorite {
  id: string
  user_id: string
  exercise_id: string
  created_at: string
}

export interface ClassPlan {
  id: string
  user_id: string
  name: string
  exercise_ids: string[]
  created_at: string
  updated_at: string
}

export interface PosturalAssessment {
  id: string
  user_id: string
  client_name: string
  assessment_date: string
  side_view: Record<string, any>
  front_view: Record<string, any>
  back_view: Record<string, any>
  spine_sequencing: Record<string, any>
  plumb_line: Record<string, any>
  suggested_posture: string | null
  confirmed_posture: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
