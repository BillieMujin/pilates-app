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
  sort_order: number
  variations: ExerciseVariation[] | null
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
