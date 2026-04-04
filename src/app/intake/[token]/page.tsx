'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

/* ─── intake types & constants ─── */

interface ClientIntake {
  occupation: string
  sittingHours: string
  repetitiveActivities: string
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
  occupation: '', sittingHours: '', repetitiveActivities: '',
  medicalConditions: '', pregnantPostnatal: '', pregnantPostnatalDetails: '',
  medication: '', medicationDetails: '', surgeries: '', surgeryDetails: '',
  difficultMovements: '', functionalConcerns: [], medicalRestrictions: '',
  currentInjuries: '', currentInjuryDetails: '', previousInjuries: '', previousInjuryDetails: '',
  recurringPain: [], recurringPainOther: '', painTiming: [], painTimingOther: '',
  currentActivities: [], currentActivitiesOther: '', activityFrequency: '',
  pilatesExperience: '', pilatesGoals: [],
  specificGoals: '', anythingElse: '',
}

const PAIN_AREAS = ['Neck', 'Upper back', 'Lower back', 'Shoulders', 'Hips', 'Knees', 'Ankles & feet', 'Wrists & hands']
const PAIN_TIMING = ['At rest', 'During movement', 'After prolonged sitting', 'After prolonged standing', 'At night', 'Morning stiffness']
const FUNCTIONAL_CONCERNS = ['Balance issues', 'Stiffness', 'Weakness', 'Numbness or tingling', 'Shortness of breath during mild activity', 'Joint clicking or popping']
const SPORTS_ACTIVITIES = ['Running', 'Walking', 'Weight training', 'Gym', 'Yoga', 'Swimming', 'Cycling', 'Dance']
const PILATES_GOALS = ['Pain relief', 'Posture improvement', 'Flexibility', 'Strength', 'Rehabilitation', 'Stress relief', 'Sport performance', 'General wellbeing']

/* ─── page component ─── */

export default function PublicIntakePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const supabase = createClient()

  const [status, setStatus] = useState<'loading' | 'form' | 'already_done' | 'not_found' | 'submitted'>('loading')
  const [clientName, setClientName] = useState('')
  const [intake, setIntake] = useState<ClientIntake>({ ...EMPTY_INTAKE })
  const [consent, setConsent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      // Pre-fill with any existing partial intake
      if (data.intake && Object.keys(data.intake).length > 0) {
        setIntake({ ...EMPTY_INTAKE, ...data.intake })
      }
      setStatus('form')
    }
    load()
  }, [token, supabase])

  const handleSubmit = async () => {
    if (!consent) {
      setError('Please confirm your consent before submitting.')
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

  /* ─── states ─── */

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
          <p className="text-[14px] text-[#6b5e6e]/60">
            This intake form link is not valid. Please contact your Pilates instructor for a new link.
          </p>
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
          <p className="text-[14px] text-[#6b5e6e]/60">
            Thanks {clientName}! Your intake form has already been submitted. If you need to make changes, please contact your Pilates instructor.
          </p>
        </div>
      </div>
    )
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
          <p className="text-[14px] text-[#6b5e6e]/60">
            Your intake form has been submitted successfully. Your instructor will review it before your first session. You can close this page now.
          </p>
        </div>
      </div>
    )
  }

  /* ─── form ─── */

  const update = (field: keyof ClientIntake, value: string | string[]) => {
    setIntake(prev => ({ ...prev, [field]: value }))
  }
  const toggleMulti = (field: keyof ClientIntake, value: string) => {
    const arr = ((intake[field] as string[]) || [])
    const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
    setIntake(prev => ({ ...prev, [field]: next }))
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-[#e5e0db] text-[14px] bg-white focus:outline-none focus:border-[#6b5e6e]/40 focus:ring-2 focus:ring-[#6b5e6e]/10 transition-all'
  const labelCls = 'block mb-1.5 text-[13px] font-medium text-[#2c2c2c]'

  const YesNo = ({ field, detailField, detailPlaceholder }: { field: keyof ClientIntake; detailField: keyof ClientIntake; detailPlaceholder: string }) => (
    <div>
      <div className="flex gap-3 mb-2">
        {['Yes', 'No'].map(opt => (
          <label key={opt} className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all text-[13px] border ${
            intake[field] === opt.toLowerCase() ? 'bg-[#6b5e6e]/[0.06] border-[#6b5e6e]/20 font-medium' : 'border-[#e5e0db] hover:bg-black/[0.02]'
          }`}>
            <input type="radio" name={field} checked={intake[field] === opt.toLowerCase()} onChange={() => update(field, opt.toLowerCase())} className="w-3.5 h-3.5 accent-[#6b5e6e]" />
            {opt}
          </label>
        ))}
      </div>
      {intake[field] === 'yes' && (
        <input type="text" value={(intake[detailField] as string) || ''} onChange={e => update(detailField, e.target.value)} placeholder={detailPlaceholder} className={inputCls} />
      )}
    </div>
  )

  const MultiSelect = ({ options, field }: { options: string[]; field: keyof ClientIntake }) => (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const selected = ((intake[field] as string[]) || []).includes(opt)
        return (
          <button key={opt} type="button" onClick={() => toggleMulti(field, opt)} className={`text-[12px] px-3 py-1.5 rounded-lg border transition-all ${
            selected ? 'bg-[#6b5e6e]/[0.08] border-[#6b5e6e]/25 text-[#2c2c2c] font-medium' : 'border-[#e5e0db] text-[#6b5e6e] hover:bg-black/[0.02]'
          }`}>
            {opt}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f6f3]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e0db]">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#6b5e6e] flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#2c2c2c] mb-1">
            Welcome, {clientName}!
          </h1>
          <p className="text-[14px] text-[#6b5e6e]/70 max-w-sm mx-auto">
            Please complete this short questionnaire before your first Pilates session. It helps your instructor understand your body and tailor the sessions to you.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Section 1: Occupation & Daily Life */}
        <div className="bg-white rounded-2xl border border-[#e5e0db] p-5 space-y-4">
          <h4 className="text-[14px] font-semibold text-[#6b5e6e]/50 uppercase tracking-wider">Occupation & Daily Life</h4>
          <div>
            <label className={labelCls}>What is your occupation?</label>
            <input type="text" value={intake.occupation} onChange={e => update('occupation', e.target.value)} placeholder="e.g. office worker, teacher, retired" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>How many hours per day do you sit?</label>
            <select value={intake.sittingHours} onChange={e => update('sittingHours', e.target.value)} className={inputCls}>
              <option value="">Select...</option>
              {['0-2', '2-4', '4-6', '6-8', '8-10', '10+'].map(v => <option key={v} value={v}>{v} hours</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Do you have any daily activities that involve repetitive movement?</label>
            <input type="text" value={intake.repetitiveActivities} onChange={e => update('repetitiveActivities', e.target.value)} placeholder="e.g. gardening, carrying children, playing an instrument, driving long hours" className={inputCls} />
          </div>
        </div>

        {/* Section 2: Health & Medical */}
        <div className="bg-white rounded-2xl border border-[#e5e0db] p-5 space-y-4">
          <h4 className="text-[14px] font-semibold text-[#6b5e6e]/50 uppercase tracking-wider">Health & Medical</h4>
          <div>
            <label className={labelCls}>Do you have any current medical conditions?</label>
            <input type="text" value={intake.medicalConditions} onChange={e => update('medicalConditions', e.target.value)} placeholder="Describe or leave blank" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Are you currently pregnant or postnatal?</label>
            <YesNo field="pregnantPostnatal" detailField="pregnantPostnatalDetails" detailPlaceholder="How many weeks/months?" />
          </div>
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
            <MultiSelect options={FUNCTIONAL_CONCERNS} field="functionalConcerns" />
          </div>
          <div>
            <label className={labelCls}>Is there anything your doctor or physiotherapist has told you to avoid?</label>
            <input type="text" value={intake.medicalRestrictions} onChange={e => update('medicalRestrictions', e.target.value)} placeholder="Describe or leave blank" className={inputCls} />
          </div>
        </div>

        {/* Section 3: Injuries & Pain */}
        <div className="bg-white rounded-2xl border border-[#e5e0db] p-5 space-y-4">
          <h4 className="text-[14px] font-semibold text-[#6b5e6e]/50 uppercase tracking-wider">Injuries & Pain</h4>
          <div>
            <label className={labelCls}>Do you have any current injuries?</label>
            <YesNo field="currentInjuries" detailField="currentInjuryDetails" detailPlaceholder="Location and how long?" />
          </div>
          <div>
            <label className={labelCls}>Do you have any previous injuries that still affect you?</label>
            <YesNo field="previousInjuries" detailField="previousInjuryDetails" detailPlaceholder="What & when?" />
          </div>
          <div>
            <label className={labelCls}>Do you experience recurring pain?</label>
            <MultiSelect options={PAIN_AREAS} field="recurringPain" />
            <input type="text" value={intake.recurringPainOther} onChange={e => update('recurringPainOther', e.target.value)} placeholder="Other area (please specify)" className={inputCls + ' mt-2'} />
          </div>
          {((intake.recurringPain?.length ?? 0) > 0 || intake.recurringPainOther) && (
            <div>
              <label className={labelCls}>When does it typically occur?</label>
              <MultiSelect options={PAIN_TIMING} field="painTiming" />
              <input type="text" value={intake.painTimingOther} onChange={e => update('painTimingOther', e.target.value)} placeholder="Other timing or specific trigger (e.g. when rotating head to the right)" className={inputCls + ' mt-2'} />
            </div>
          )}
        </div>

        {/* Section 4: Movement & Activity */}
        <div className="bg-white rounded-2xl border border-[#e5e0db] p-5 space-y-4">
          <h4 className="text-[14px] font-semibold text-[#6b5e6e]/50 uppercase tracking-wider">Movement & Activity</h4>
          <div>
            <label className={labelCls}>What physical activities or sports do you currently do?</label>
            <MultiSelect options={SPORTS_ACTIVITIES} field="currentActivities" />
            <input type="text" value={intake.currentActivitiesOther} onChange={e => update('currentActivitiesOther', e.target.value)} placeholder="Other (please specify)" className={inputCls + ' mt-2'} />
          </div>
          <div>
            <label className={labelCls}>How often?</label>
            <div className="flex flex-wrap gap-2">
              {['Daily', '3-5x week', '1-2x week', 'A few times per month', 'Not currently active'].map(opt => (
                <button key={opt} type="button" onClick={() => update('activityFrequency', intake.activityFrequency === opt ? '' : opt)} className={`text-[12px] px-3 py-1.5 rounded-lg border transition-all ${
                  intake.activityFrequency === opt ? 'bg-[#6b5e6e]/[0.08] border-[#6b5e6e]/25 text-[#2c2c2c] font-medium' : 'border-[#e5e0db] text-[#6b5e6e] hover:bg-black/[0.02]'
                }`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 5: Pilates Goals */}
        <div className="bg-white rounded-2xl border border-[#e5e0db] p-5 space-y-4">
          <h4 className="text-[14px] font-semibold text-[#6b5e6e]/50 uppercase tracking-wider">Pilates Goals</h4>
          <div>
            <label className={labelCls}>Have you done Pilates before?</label>
            <div className="flex flex-wrap gap-2">
              {['Never', 'A few times', 'Regularly in the past', 'Currently practising'].map(opt => (
                <button key={opt} type="button" onClick={() => update('pilatesExperience', intake.pilatesExperience === opt ? '' : opt)} className={`text-[12px] px-3 py-1.5 rounded-lg border transition-all ${
                  intake.pilatesExperience === opt ? 'bg-[#6b5e6e]/[0.08] border-[#6b5e6e]/25 text-[#2c2c2c] font-medium' : 'border-[#e5e0db] text-[#6b5e6e] hover:bg-black/[0.02]'
                }`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>What are your goals with Pilates?</label>
            <MultiSelect options={PILATES_GOALS} field="pilatesGoals" />
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

        {/* Consent & Submit */}
        <div className="bg-white rounded-2xl border border-[#e5e0db] p-5 space-y-4">
          <h4 className="text-[14px] font-semibold text-[#6b5e6e]/50 uppercase tracking-wider">Data Protection</h4>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#6b5e6e] shrink-0"
            />
            <span className="text-[12px] text-[#6b5e6e] leading-relaxed">
              I consent to my personal and health data being stored and used by my Pilates instructor
              for the purpose of providing safe and appropriate Pilates instruction. I understand that I
              can request access to, correction of, or deletion of my data at any time by contacting my
              instructor. Read the full{' '}
              <Link href="/privacy" className="text-[#6b5e6e] underline font-medium" target="_blank">
                Privacy Policy
              </Link>.
            </span>
          </label>

          {error && (
            <div className="bg-red-50 text-red-700 text-[13px] rounded-xl px-4 py-3 border border-red-200">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3 bg-[#6b5e6e] hover:bg-[#5a4f5c] text-white text-[14px] font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {saving ? 'Submitting...' : 'Submit Intake Form'}
          </button>
        </div>

        <p className="text-[11px] text-center text-[#6b5e6e]/40 pb-4">
          All fields are optional — fill in what applies.
        </p>
      </div>
    </div>
  )
}
