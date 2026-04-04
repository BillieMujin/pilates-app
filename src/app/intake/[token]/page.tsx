'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

/* ─── intake types & constants ─── */

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

const TYPICAL_DAY = ['Mostly sitting', 'Mostly standing', 'Mix of sitting & standing', 'Physically active / on the move', 'Repetitive movements']
const PAIN_AREAS = ['Neck', 'Upper back', 'Lower back', 'Shoulders', 'Hips', 'Knees', 'Ankles & feet', 'Wrists & hands']
const PAIN_TIMING = ['At rest', 'During movement', 'After prolonged sitting', 'After prolonged standing', 'At night', 'Morning stiffness']
const FUNCTIONAL_CONCERNS = ['Balance issues', 'Stiffness', 'Weakness', 'Numbness or tingling', 'Shortness of breath during mild activity', 'Joint clicking or popping']
const SPORTS_ACTIVITIES = ['Running', 'Walking', 'Weight training', 'Gym', 'Yoga', 'Swimming', 'Cycling', 'Dance']
const PILATES_GOALS = ['Pain relief', 'Posture improvement', 'Flexibility', 'Strength', 'Rehabilitation', 'Stress relief', 'Sport performance', 'General wellbeing']

const TOTAL_STEPS = 6 // 0-based: About You, Health, Injuries, Movement, Goals, Consent

/* ─── step section labels ─── */
const STEP_LABELS = ['About You', 'Health & Medical', 'Injuries & Pain', 'Movement & Activity', 'Pilates Goals', 'Review & Submit']

/* ─── page component ─── */

export default function PublicIntakePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const supabase = createClient()

  const [status, setStatus] = useState<'loading' | 'form' | 'already_done' | 'not_found' | 'submitted'>('loading')
  const [clientName, setClientName] = useState('')
  const [intake, setIntake] = useState<ClientIntake>({ ...EMPTY_INTAKE })
  const [consent, setConsent] = useState(false)
  const [truthful, setTruthful] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data, error: fetchErr } = await supabase
        .from('clients')
        .select('first_name, intake_completed_at, intake')
        .eq('intake_token', token)
        .single()

      if (fetchErr || !data) {
        setStatus('not_found')
        return
      }

      if (data.intake_completed_at) {
        setClientName(data.first_name)
        setStatus('already_done')
        return
      }

      setClientName(data.first_name)
      if (data.intake && Object.keys(data.intake).length > 0) {
        setIntake({ ...EMPTY_INTAKE, ...data.intake })
      }
      setStatus('form')
    }
    load()
  }, [token, supabase])

  /* ─── validation per step ─── */
  const validateStep = (s: number): string | null => {
    switch (s) {
      case 0: // About You
        if (!intake.sex) return 'Please select your sex.'
        if (!intake.age.trim()) return 'Please enter your age.'
        return null
      case 1: // Health
        if (!intake.medicalConditions.trim()) return 'Please answer the medical conditions question (or type "none").'
        return null
      case 2: // Injuries
        if (!intake.currentInjuries) return 'Please answer whether you have any current injuries.'
        return null
      case 3: // Movement — no mandatory
        return null
      case 4: // Pilates Goals
        if (intake.pilatesGoals.length === 0) return 'Please select at least one Pilates goal.'
        return null
      case 5: // Consent
        return null
      default:
        return null
    }
  }

  const handleNext = () => {
    const err = validateStep(step)
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError(null)
    setStep(prev => Math.min(prev + 1, TOTAL_STEPS - 1))
  }

  const handleBack = () => {
    setValidationError(null)
    setStep(prev => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    if (!consent || !truthful) {
      setError('Please confirm both checkboxes before submitting.')
      return
    }
    setError(null)
    setSaving(true)

    const { error: updateErr } = await supabase
      .from('clients')
      .update({
        intake,
        intake_completed_at: new Date().toISOString(),
        consent_given: true,
        consent_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('intake_token', token)

    if (updateErr) {
      setError('Something went wrong. Please try again.')
      setSaving(false)
      return
    }

    setStatus('submitted')
    setSaving(false)
  }

  /* ─── helpers ─── */
  const update = (field: keyof ClientIntake, value: string | string[]) => {
    setIntake(prev => ({ ...prev, [field]: value }))
    setValidationError(null)
  }
  const toggleMulti = (field: keyof ClientIntake, value: string) => {
    const arr = ((intake[field] as string[]) || [])
    const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
    setIntake(prev => ({ ...prev, [field]: next }))
    setValidationError(null)
  }

  const isMale = intake.sex === 'male'

  /* ─── shared styles ─── */
  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-[#e5e0db] text-[14px] bg-white focus:outline-none focus:border-[#6b5e6e]/40 focus:ring-2 focus:ring-[#6b5e6e]/10 transition-all'
  const labelCls = 'block mb-1.5 text-[13px] font-medium text-[#2c2c2c]'
  const hintCls = 'text-[11px] text-[#6b5e6e]/50 mt-1'
  const reqCls = 'text-red-400 ml-0.5'

  const Chip = ({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) => (
    <button type="button" onClick={onClick} className={`text-[13px] px-4 py-2 rounded-xl border transition-all ${
      selected ? 'bg-[#6b5e6e]/[0.08] border-[#6b5e6e]/25 text-[#2c2c2c] font-medium' : 'border-[#e5e0db] text-[#6b5e6e] hover:bg-black/[0.02]'
    }`}>
      {label}
    </button>
  )

  const MultiChips = ({ options, field }: { options: string[]; field: keyof ClientIntake }) => (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <Chip key={opt} label={opt} selected={((intake[field] as string[]) || []).includes(opt)} onClick={() => toggleMulti(field, opt)} />
      ))}
    </div>
  )

  const YesNo = ({ field, detailField, detailPlaceholder }: { field: keyof ClientIntake; detailField: keyof ClientIntake; detailPlaceholder: string }) => (
    <div>
      <div className="flex gap-3 mb-2">
        {['Yes', 'No'].map(opt => (
          <Chip key={opt} label={opt} selected={intake[field] === opt.toLowerCase()} onClick={() => update(field, opt.toLowerCase())} />
        ))}
      </div>
      {intake[field] === 'yes' && (
        <input type="text" value={(intake[detailField] as string) || ''} onChange={e => update(detailField, e.target.value)} placeholder={detailPlaceholder} className={inputCls} />
      )}
    </div>
  )

  /* ─── status screens ─── */

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f6f3]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#6b5e6e]/20 border-t-[#6b5e6e] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[14px] text-[#6b5e6e]/60">Loading your form...</p>
        </div>
      </div>
    )
  }

  if (status === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f6f3] px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#2c2c2c] mb-2">Link not found</h1>
          <p className="text-[14px] text-[#6b5e6e]/60">This intake form link is not valid. Please contact your Pilates instructor for a new link.</p>
        </div>
      </div>
    )
  }

  if (status === 'already_done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f6f3] px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#2c2c2c] mb-2">Already completed</h1>
          <p className="text-[14px] text-[#6b5e6e]/60">Thanks {clientName}! Your intake form has already been submitted. If you need to make changes, please contact your Pilates instructor.</p>
        </div>
      </div>
    )
  }

  const downloadCopy = () => {
    const SEX_LABELS: Record<string, string> = { female: 'Female', male: 'Male', prefer_not_to_say: 'Prefer not to say' }
    const lines = [
      `PILATES INTAKE FORM — ${clientName}`,
      `Date: ${new Date().toLocaleDateString()}`,
      '',
      '── ABOUT YOU ──',
      `Sex: ${SEX_LABELS[intake.sex] || intake.sex || '-'}`,
      `Age: ${intake.age || '-'}`,
      `Occupation: ${intake.occupation || '-'}`,
      `Typical day: ${[intake.typicalDay, intake.typicalDayDetails].filter(Boolean).join(' — ') || '-'}`,
      '',
      '── HEALTH & MEDICAL ──',
      `Medical conditions: ${intake.medicalConditions || '-'}`,
      `Pregnant/postnatal: ${intake.pregnantPostnatal || '-'}${intake.pregnantPostnatalDetails ? ` — ${intake.pregnantPostnatalDetails}` : ''}`,
      `Medication: ${intake.medication || '-'}${intake.medicationDetails ? ` — ${intake.medicationDetails}` : ''}`,
      `Surgeries: ${intake.surgeries || '-'}${intake.surgeryDetails ? ` — ${intake.surgeryDetails}` : ''}`,
      `Difficult movements: ${intake.difficultMovements || '-'}`,
      `Functional concerns: ${intake.functionalConcerns?.join(', ') || '-'}`,
      `Medical restrictions: ${intake.medicalRestrictions || '-'}`,
      '',
      '── INJURIES & PAIN ──',
      `Current injuries: ${intake.currentInjuries || '-'}${intake.currentInjuryDetails ? ` — ${intake.currentInjuryDetails}` : ''}`,
      `Previous injuries: ${intake.previousInjuries || '-'}${intake.previousInjuryDetails ? ` — ${intake.previousInjuryDetails}` : ''}`,
      `Recurring pain: ${[...(intake.recurringPain || []), intake.recurringPainOther].filter(Boolean).join(', ') || '-'}`,
      `Pain timing: ${[...(intake.painTiming || []), intake.painTimingOther].filter(Boolean).join(', ') || '-'}`,
      '',
      '── MOVEMENT & ACTIVITY ──',
      `Activities: ${[...(intake.currentActivities || []), intake.currentActivitiesOther].filter(Boolean).join(', ') || '-'}`,
      `Frequency: ${intake.activityFrequency || '-'}`,
      '',
      '── PILATES GOALS ──',
      `Experience: ${intake.pilatesExperience || '-'}`,
      `Goals: ${intake.pilatesGoals?.join(', ') || '-'}`,
      `Specific goals: ${intake.specificGoals || '-'}`,
      `Other notes: ${intake.anythingElse || '-'}`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `intake-form-${clientName.toLowerCase().replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (status === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f6f3] px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#2c2c2c] mb-2">Thank you, {clientName}!</h1>
          <p className="text-[14px] text-[#6b5e6e]/60 mb-5">Your intake form has been submitted successfully. Your instructor will review it before your first session.</p>
          <button
            onClick={downloadCopy}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#6b5e6e] hover:text-[#2c2c2c] border border-[#e5e0db] hover:border-[#6b5e6e]/30 px-4 py-2 rounded-xl transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Save a copy for your records
          </button>
          <p className="text-[11px] text-[#6b5e6e]/40 mt-4">You can close this page now.</p>
        </div>
      </div>
    )
  }

  /* ─── form steps ─── */

  const renderStep = () => {
    switch (step) {
      /* ═══ Step 0: About You ═══ */
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className={labelCls}>Sex (at birth)<span className={reqCls}>*</span></label>
              <div className="flex flex-wrap gap-2">
                {[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }, { value: 'prefer_not_to_say', label: 'Prefer not to say' }].map(opt => (
                  <Chip key={opt.value} label={opt.label} selected={intake.sex === opt.value} onClick={() => update('sex', opt.value)} />
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Age<span className={reqCls}>*</span></label>
              <input type="number" value={intake.age} onChange={e => update('age', e.target.value)} placeholder="e.g. 42" min="1" max="120" className={inputCls + ' max-w-[120px]'} />
            </div>
            <div>
              <label className={labelCls}>Occupation</label>
              <input type="text" value={intake.occupation} onChange={e => update('occupation', e.target.value)} placeholder="e.g. office worker, teacher, retired" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Which best describes your typical day?</label>
              <div className="flex flex-wrap gap-2">
                {TYPICAL_DAY.map(opt => (
                  <Chip key={opt} label={opt} selected={intake.typicalDay === opt} onClick={() => update('typicalDay', intake.typicalDay === opt ? '' : opt)} />
                ))}
              </div>
              {intake.typicalDay && (
                <input type="text" value={intake.typicalDayDetails} onChange={e => update('typicalDayDetails', e.target.value)} placeholder="Tell us more (e.g. I sit at a desk 8 hours, I carry heavy boxes at work)" className={inputCls + ' mt-2'} />
              )}
            </div>
          </div>
        )

      /* ═══ Step 1: Health & Medical ═══ */
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className={labelCls}>Do you have any current medical conditions?<span className={reqCls}>*</span></label>
              <input type="text" value={intake.medicalConditions} onChange={e => update('medicalConditions', e.target.value)} placeholder='Describe, or type "none"' className={inputCls} />
              <p className={hintCls}>e.g. asthma, diabetes, high blood pressure, osteoporosis</p>
            </div>
            {!isMale && (
              <div>
                <label className={labelCls}>Are you currently pregnant or postnatal?</label>
                <YesNo field="pregnantPostnatal" detailField="pregnantPostnatalDetails" detailPlaceholder="How many weeks/months?" />
              </div>
            )}
            <div>
              <label className={labelCls}>Are you taking any medication that affects movement, balance, or bone density?</label>
              <YesNo field="medication" detailField="medicationDetails" detailPlaceholder="Which medication?" />
            </div>
            <div>
              <label className={labelCls}>Have you had any surgeries?</label>
              <YesNo field="surgeries" detailField="surgeryDetails" detailPlaceholder="What & when?" />
            </div>
            <div>
              <label className={labelCls}>Are there any movements you find difficult or avoid?</label>
              <input type="text" value={intake.difficultMovements} onChange={e => update('difficultMovements', e.target.value)} placeholder="e.g. bending forward, looking over shoulder, getting up from floor" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Do you experience any of the following?</label>
              <MultiChips options={FUNCTIONAL_CONCERNS} field="functionalConcerns" />
            </div>
            <div>
              <label className={labelCls}>Is there anything your doctor or physiotherapist has told you to avoid?</label>
              <input type="text" value={intake.medicalRestrictions} onChange={e => update('medicalRestrictions', e.target.value)} placeholder="Describe or leave blank" className={inputCls} />
            </div>
          </div>
        )

      /* ═══ Step 2: Injuries & Pain ═══ */
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className={labelCls}>Do you have any current injuries?<span className={reqCls}>*</span></label>
              <YesNo field="currentInjuries" detailField="currentInjuryDetails" detailPlaceholder="Location and how long?" />
            </div>
            <div>
              <label className={labelCls}>Do you have any previous injuries that still affect you?</label>
              <YesNo field="previousInjuries" detailField="previousInjuryDetails" detailPlaceholder="What & when?" />
            </div>
            <div>
              <label className={labelCls}>Do you experience recurring pain?</label>
              <MultiChips options={PAIN_AREAS} field="recurringPain" />
              <input type="text" value={intake.recurringPainOther} onChange={e => update('recurringPainOther', e.target.value)} placeholder="Other area (please specify)" className={inputCls + ' mt-2'} />
            </div>
            {((intake.recurringPain?.length ?? 0) > 0 || intake.recurringPainOther) && (
              <div>
                <label className={labelCls}>When does it typically occur?</label>
                <MultiChips options={PAIN_TIMING} field="painTiming" />
                <input type="text" value={intake.painTimingOther} onChange={e => update('painTimingOther', e.target.value)} placeholder="Other timing or trigger (e.g. when rotating head to the right)" className={inputCls + ' mt-2'} />
              </div>
            )}
          </div>
        )

      /* ═══ Step 3: Movement & Activity ═══ */
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className={labelCls}>What physical activities or sports do you currently do?</label>
              <MultiChips options={SPORTS_ACTIVITIES} field="currentActivities" />
              <input type="text" value={intake.currentActivitiesOther} onChange={e => update('currentActivitiesOther', e.target.value)} placeholder="Other (please specify)" className={inputCls + ' mt-2'} />
            </div>
            <div>
              <label className={labelCls}>How often?</label>
              <div className="flex flex-wrap gap-2">
                {['Daily', '3-5x week', '1-2x week', 'A few times per month', 'Not currently active'].map(opt => (
                  <Chip key={opt} label={opt} selected={intake.activityFrequency === opt} onClick={() => update('activityFrequency', intake.activityFrequency === opt ? '' : opt)} />
                ))}
              </div>
            </div>
          </div>
        )

      /* ═══ Step 4: Pilates Goals ═══ */
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className={labelCls}>Have you done Pilates before?</label>
              <div className="flex flex-wrap gap-2">
                {['Never', 'A few times', 'Regularly in the past', 'Currently practising'].map(opt => (
                  <Chip key={opt} label={opt} selected={intake.pilatesExperience === opt} onClick={() => update('pilatesExperience', intake.pilatesExperience === opt ? '' : opt)} />
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>What are your goals with Pilates?<span className={reqCls}>*</span></label>
              <MultiChips options={PILATES_GOALS} field="pilatesGoals" />
            </div>
            <div>
              <label className={labelCls}>Is there anything specific you&apos;d like to work on or improve?</label>
              <input type="text" value={intake.specificGoals} onChange={e => update('specificGoals', e.target.value)} placeholder="Free text" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Anything else you&apos;d like your instructor to know?</label>
              <textarea value={intake.anythingElse} onChange={e => update('anythingElse', e.target.value)} placeholder="Free text" rows={3} className={inputCls} />
            </div>
          </div>
        )

      /* ═══ Step 5: Consent & Submit ═══ */
      case 5:
        return (
          <div className="space-y-5">
            <p className="text-[14px] text-[#6b5e6e]/80 leading-relaxed">
              Thank you for completing the questionnaire, {clientName}. Please confirm the following before submitting:
            </p>

            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-[#e5e0db] bg-white hover:border-[#6b5e6e]/20 transition-all">
              <input type="checkbox" checked={truthful} onChange={e => setTruthful(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#6b5e6e] shrink-0" />
              <span className="text-[13px] text-[#2c2c2c] leading-relaxed">
                I confirm that the information I have provided is truthful and accurate to the best of my knowledge. I understand the importance of this information for my safety and agree to inform my instructor promptly if any of my medical or health information changes.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-[#e5e0db] bg-white hover:border-[#6b5e6e]/20 transition-all">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#6b5e6e] shrink-0" />
              <span className="text-[13px] text-[#2c2c2c] leading-relaxed">
                I consent to my personal and health data being stored and used by my Pilates instructor for the purpose of providing safe and appropriate Pilates instruction. I understand that I can request access to, correction of, or deletion of my data at any time by contacting my instructor. Read the full{' '}
                <Link href="/privacy" className="text-[#6b5e6e] underline font-medium" target="_blank">Privacy Policy</Link>.
              </span>
            </label>

            {error && (
              <div className="bg-red-50 text-red-700 text-[13px] rounded-xl px-4 py-3 border border-red-200">{error}</div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  /* ─── main form layout ─── */

  return (
    <div className="min-h-screen bg-[#f8f6f3] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e0db]">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 text-center">
          <div className="w-9 h-9 rounded-xl bg-[#6b5e6e] flex items-center justify-center mx-auto mb-3">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
          </div>
          {step === 0 ? (
            <>
              <h1 className="text-lg sm:text-xl font-semibold text-[#2c2c2c] mb-1">Welcome, {clientName}!</h1>
              <p className="text-[13px] text-[#6b5e6e]/70 max-w-sm mx-auto">Please complete this short questionnaire before your first Pilates session.</p>
            </>
          ) : (
            <h1 className="text-lg font-semibold text-[#2c2c2c]">{STEP_LABELS[step]}</h1>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-[#e5e0db]">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="flex gap-1.5 py-3">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <div className={`h-1 w-full rounded-full transition-all duration-300 ${
                  i < step ? 'bg-[#6b5e6e]' : i === step ? 'bg-[#6b5e6e]/50' : 'bg-[#e5e0db]'
                }`} />
                <span className={`text-[9px] font-medium hidden sm:block ${
                  i <= step ? 'text-[#6b5e6e]' : 'text-[#6b5e6e]/30'
                }`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
          <div className="bg-white rounded-2xl border border-[#e5e0db] p-5 sm:p-6">
            {renderStep()}
          </div>

          {/* Validation error */}
          {validationError && (
            <div className="mt-3 bg-red-50 text-red-700 text-[13px] rounded-xl px-4 py-3 border border-red-200">
              {validationError}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 bg-white border-t border-[#e5e0db] safe-area-bottom">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {step > 0 ? (
            <button onClick={handleBack} className="text-[14px] font-medium text-[#6b5e6e] hover:text-[#2c2c2c] transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              Back
            </button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS - 1 ? (
            <button onClick={handleNext} className="text-[14px] font-semibold text-white bg-[#6b5e6e] hover:bg-[#5a4f5c] px-6 py-2.5 rounded-xl transition-colors shadow-sm flex items-center gap-1.5">
              Next
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving || !consent || !truthful}
              className="text-[14px] font-semibold text-white bg-[#6b5e6e] hover:bg-[#5a4f5c] px-6 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
