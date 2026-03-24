export interface ExerciseProp {
  tool: string
  name: string
  for: string
  tip: string
}

export interface PostureAdjustments {
  kyphosis?: string | null
  lordosis?: string | null
  flatback?: string | null
  military?: string | null
  swayback?: string | null
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
  sort_order: number
}

export interface Favorite {
  id: string
  user_id: string
  exercise_id: string
  created_at: string
}
