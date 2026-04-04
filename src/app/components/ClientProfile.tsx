'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Client, PosturalAssessment, ClientClassPlan } from '@/lib/types'

/* ─── intake types & constants (shared with AssessmentWizard) ─── */

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

const POSTURE_META: Record<string, { label: string; color: string }> = {
  kyphosis:      { label: 'Kyphosis-Lordosis', color: '#6b2d5b' },
  kyphosis_only: { label: 'Kyphosis',          color: '#8a6d9a' },
  lordosis:      { label: 'Lordosis',           color: '#c98a24' },
  flatback:      { label: 'Flat Back',          color: '#6a8a6e' },
  military:      { label: 'Military',           color: '#7a9a80' },
  swayback:      { label: 'Sway Back',          color: '#9a7aaa' },
}

/* ─── props ─── */

interface Props {
  client: Client
  assessments: PosturalAssessment[]
  classPlans: ClientClassPlan[]
}

/* ─── main component ─── */

export default function ClientProfile({ client, assessments, classPlans }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<'intake' | 'assessments' | 'plans'>('intake')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [intake, setIntake] = useState<ClientIntake>({
    ...EMPTY_INTAKE,
    ...(client.intake as Partial<ClientIntake> || {}),
  })
  const [notes, setNotes] = useState(client.notes || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fullName = [client.first_name, client.last_name].filter(Boolean).join(' ')
  const hasIntake = Object.values(intake).some(v =>
    Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.length > 0
  )

  /* ─── save intake ─── */
  const handleSaveIntake = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('clients')
      .update({ intake, notes, updated_at: new Date().toISOString() })
      .eq('id', client.id)
    if (!error) {
      setEditing(false)
      router.refresh()
    }
    setSaving(false)
  }

  /* ─── delete client ─── */
  const handleDelete = async () => {
    setDeleting(true)
    // Delete assessments linked to this client
    await supabase.from('postural_assessments').delete().eq('client_id', client.id)
    // Delete class plans
    await supabase.from('client_class_plans').delete().eq('client_id', client.id)
    // Delete client
    const { error } = await supabase.from('clients').delete().eq('id', client.id)
    if (!error) {
      router.push('/clients')
    }
    setDeleting(false)
  }

  /* ─── tab content ─── */
  const tabs = [
    { key: 'intake' as const, label: 'Intake' },
    { key: 'assessments' as const, label: `Assessments (${assessments.length})` },
    { key: 'plans' as const, label: `Class Plans (${classPlans.length})` },
  ]

  return (
    <div>
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary-light transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            All Clients
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">
                {fullName}
              </h1>
              <div className="flex items-center gap-3 text-[13px] text-muted">
                {client.age && <span>Age {client.age}</span>}
                {client.consent_date && (
                  <span className="text-foreground/25">
                    Consent recorded {new Date(client.consent_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 -mb-[1px]">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`text-[13px] font-medium px-4 py-2.5 rounded-t-xl border border-b-0 transition-all ${
                  tab === t.key
                    ? 'bg-white border-border text-foreground'
                    : 'bg-transparent border-transparent text-muted hover:text-foreground/60'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {tab === 'intake' && (
          <IntakeTab
            intake={intake}
            setIntake={setIntake}
            notes={notes}
            setNotes={setNotes}
            editing={editing}
            setEditing={setEditing}
            saving={saving}
            hasIntake={hasIntake}
            onSave={handleSaveIntake}
          />
        )}

        {tab === 'assessments' && (
          <AssessmentsTab assessments={assessments} clientId={client.id} />
        )}

        {tab === 'plans' && (
          <PlansTab classPlans={classPlans} clientId={client.id} />
        )}
      </div>

      {/* Footer: data protection & delete */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-10">
        <div className="border-t border-border pt-6 mt-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="text-[12px] text-foreground/30 leading-relaxed max-w-md">
              Client data is stored securely and processed in accordance with our{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              The client can request access to or deletion of their data at any time.
            </div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-[12px] font-medium text-red-400 hover:text-red-600 transition-colors shrink-0"
              >
                Delete client & all data
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-red-600 font-medium">Delete all data for {fullName}?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-[12px] text-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   INTAKE TAB
   ═══════════════════════════════════════════════════ */

function IntakeTab({
  intake, setIntake, notes, setNotes,
  editing, setEditing, saving, hasIntake, onSave,
}: {
  intake: ClientIntake
  setIntake: (v: ClientIntake) => void
  notes: string
  setNotes: (v: string) => void
  editing: boolean
  setEditing: (v: boolean) => void
  saving: boolean
  hasIntake: boolean
  onSave: () => void
}) {
  if (!editing && !hasIntake) {
    return (
      <div className="text-center py-16">
        <svg className="w-12 h-12 mx-auto text-foreground/10 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <p className="text-[14px] text-muted mb-4">No intake form filled in yet.</p>
        <button
          onClick={() => setEditing(true)}
          className="text-[13px] font-semibold text-white bg-primary hover:bg-primary-light transition-all px-5 py-2.5 rounded-xl shadow-sm shadow-primary/20"
        >
          Fill In Intake Form
        </button>
      </div>
    )
  }

  if (editing) {
    return (
      <div>
        <IntakeForm intake={intake} onChange={setIntake} />

        {/* Notes */}
        <div className="max-w-lg mx-auto mt-4">
          <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
            <h4 className="font-heading text-[14px] font-semibold text-foreground/50 uppercase tracking-wider">Additional Notes</h4>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional observations or notes about this client..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border text-[14px] bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={onSave}
            disabled={saving}
            className="text-[13px] font-semibold text-white bg-primary hover:bg-primary-light transition-all px-6 py-2.5 rounded-xl shadow-sm shadow-primary/20 disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save Intake'}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="text-[13px] font-medium text-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Read-only view
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-[16px] font-semibold text-foreground">Client Intake</h2>
        <button
          onClick={() => setEditing(true)}
          className="text-[13px] font-medium text-primary hover:text-primary-light transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Edit
        </button>
      </div>

      <div className="space-y-4">
        <ReadSection title="Occupation & Daily Life" items={[
          { label: 'Occupation', value: intake.occupation },
          { label: 'Sitting hours/day', value: intake.sittingHours },
          { label: 'Repetitive activities', value: intake.repetitiveActivities },
        ]} />

        <ReadSection title="Health & Medical" items={[
          { label: 'Medical conditions', value: intake.medicalConditions },
          { label: 'Pregnant/postnatal', value: intake.pregnantPostnatal, detail: intake.pregnantPostnatalDetails },
          { label: 'Medication', value: intake.medication, detail: intake.medicationDetails },
          { label: 'Surgeries', value: intake.surgeries, detail: intake.surgeryDetails },
          { label: 'Difficult movements', value: intake.difficultMovements },
          { label: 'Functional concerns', value: intake.functionalConcerns?.join(', ') },
          { label: 'Medical restrictions', value: intake.medicalRestrictions },
        ]} />

        <ReadSection title="Injuries & Pain" items={[
          { label: 'Current injuries', value: intake.currentInjuries, detail: intake.currentInjuryDetails },
          { label: 'Previous injuries', value: intake.previousInjuries, detail: intake.previousInjuryDetails },
          { label: 'Recurring pain areas', value: [intake.recurringPain?.join(', '), intake.recurringPainOther].filter(Boolean).join(', ') },
          { label: 'Pain timing', value: [intake.painTiming?.join(', '), intake.painTimingOther].filter(Boolean).join(', ') },
        ]} />

        <ReadSection title="Movement & Activity" items={[
          { label: 'Activities', value: [...(intake.currentActivities || []), intake.currentActivitiesOther].filter(Boolean).join(', ') },
          { label: 'Frequency', value: intake.activityFrequency },
        ]} />

        <ReadSection title="Pilates Goals" items={[
          { label: 'Pilates experience', value: intake.pilatesExperience },
          { label: 'Goals', value: intake.pilatesGoals?.join(', ') },
          { label: 'Specific goals', value: intake.specificGoals },
          { label: 'Anything else', value: intake.anythingElse },
        ]} />

        {notes && (
          <div className="bg-white rounded-2xl border border-border p-5">
            <h4 className="font-heading text-[14px] font-semibold text-foreground/50 uppercase tracking-wider mb-3">Additional Notes</h4>
            <p className="text-[14px] text-foreground/70 whitespace-pre-wrap">{notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── read-only section ─── */

function ReadSection({ title, items }: { title: string; items: { label: string; value?: string; detail?: string }[] }) {
  const filledItems = items.filter(i => i.value && i.value.length > 0)
  if (filledItems.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <h4 className="font-heading text-[14px] font-semibold text-foreground/50 uppercase tracking-wider mb-3">{title}</h4>
      <div className="space-y-2.5">
        {filledItems.map(item => (
          <div key={item.label} className="flex flex-col sm:flex-row sm:items-baseline gap-1">
            <span className="text-[12px] font-medium text-foreground/40 sm:w-40 shrink-0">{item.label}</span>
            <span className="text-[14px] text-foreground/70">
              {item.value === 'yes' ? 'Yes' : item.value === 'no' ? 'No' : item.value}
              {item.detail && item.value === 'yes' && (
                <span className="text-foreground/50"> — {item.detail}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   INTAKE FORM (editable)
   ═══════════════════════════════════════════════════ */

function IntakeForm({ intake, onChange }: { intake: ClientIntake; onChange: (v: ClientIntake) => void }) {
  const update = (field: keyof ClientIntake, value: string | string[]) => {
    onChange({ ...intake, [field]: value })
  }
  const toggleMulti = (field: keyof ClientIntake, value: string) => {
    const arr = (intake[field] as string[]) || []
    const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
    onChange({ ...intake, [field]: next })
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-border text-[14px] bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all'
  const labelCls = 'block mb-1.5 text-[13px] font-medium text-foreground'

  const YesNo = ({ field, detailField, detailPlaceholder }: { field: keyof ClientIntake; detailField: keyof ClientIntake; detailPlaceholder: string }) => (
    <div>
      <div className="flex gap-3 mb-2">
        {['Yes', 'No'].map(opt => (
          <label key={opt} className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all text-[13px] border ${
            intake[field] === opt.toLowerCase() ? 'bg-primary/[0.06] border-primary/20 font-medium' : 'border-border hover:bg-black/[0.02]'
          }`}>
            <input type="radio" name={field} checked={intake[field] === opt.toLowerCase()} onChange={() => update(field, opt.toLowerCase())} className="w-3.5 h-3.5 accent-primary" />
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
            selected ? 'bg-primary/[0.08] border-primary/25 text-foreground font-medium' : 'border-border text-muted hover:bg-black/[0.02]'
          }`}>
            {opt}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Section 1: Occupation & Daily Life */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h4 className="font-heading text-[14px] font-semibold text-foreground/50 uppercase tracking-wider">Occupation & Daily Life</h4>
        <div>
          <label className={labelCls}>Occupation</label>
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
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h4 className="font-heading text-[14px] font-semibold text-foreground/50 uppercase tracking-wider">Health & Medical</h4>
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
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h4 className="font-heading text-[14px] font-semibold text-foreground/50 uppercase tracking-wider">Injuries & Pain</h4>
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
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h4 className="font-heading text-[14px] font-semibold text-foreground/50 uppercase tracking-wider">Movement & Activity</h4>
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
                intake.activityFrequency === opt ? 'bg-primary/[0.08] border-primary/25 text-foreground font-medium' : 'border-border text-muted hover:bg-black/[0.02]'
              }`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 5: Pilates Goals */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h4 className="font-heading text-[14px] font-semibold text-foreground/50 uppercase tracking-wider">Pilates Goals</h4>
        <div>
          <label className={labelCls}>Have you done Pilates before?</label>
          <div className="flex flex-wrap gap-2">
            {['Never', 'A few times', 'Regularly in the past', 'Currently practising'].map(opt => (
              <button key={opt} type="button" onClick={() => update('pilatesExperience', intake.pilatesExperience === opt ? '' : opt)} className={`text-[12px] px-3 py-1.5 rounded-lg border transition-all ${
                intake.pilatesExperience === opt ? 'bg-primary/[0.08] border-primary/25 text-foreground font-medium' : 'border-border text-muted hover:bg-black/[0.02]'
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
          <label className={labelCls}>Anything else you&apos;d like me to know?</label>
          <textarea value={intake.anythingElse} onChange={e => update('anythingElse', e.target.value)} placeholder="Free text" rows={3} className={inputCls} />
        </div>
      </div>

      <p className="text-[11px] text-center text-muted/50">All fields are optional — fill in what applies.</p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   ASSESSMENTS TAB
   ═══════════════════════════════════════════════════ */

function AssessmentsTab({ assessments, clientId }: { assessments: PosturalAssessment[]; clientId: string }) {
  if (assessments.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-12 h-12 mx-auto text-foreground/10 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
        <p className="text-[14px] text-muted mb-4">No postural assessments yet.</p>
        <Link
          href={`/assessment?client=${clientId}`}
          className="inline-flex text-[13px] font-semibold text-white bg-primary hover:bg-primary-light transition-all px-5 py-2.5 rounded-xl shadow-sm shadow-primary/20"
        >
          Start Assessment
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-[16px] font-semibold text-foreground">Postural Assessments</h2>
        <Link
          href={`/assessment?client=${clientId}`}
          className="text-[13px] font-semibold text-white bg-primary hover:bg-primary-light transition-all px-4 py-2 rounded-xl shadow-sm shadow-primary/20 flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Assessment
        </Link>
      </div>

      <div className="space-y-3">
        {assessments.map(a => {
          const posture = a.confirmed_posture || a.suggested_posture
          const meta = posture ? POSTURE_META[posture] : null
          return (
            <div key={a.id} className="bg-white rounded-2xl border border-border p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-[14px] font-medium text-foreground">{a.assessment_date}</span>
                  {meta && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md text-white"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.label}
                    </span>
                  )}
                </div>
                {a.notes && (
                  <p className="text-[12px] text-muted line-clamp-1">{a.notes}</p>
                )}
              </div>
              <svg className="w-4 h-4 text-foreground/15 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   CLASS PLANS TAB
   ═══════════════════════════════════════════════════ */

function PlansTab({ classPlans, clientId }: { classPlans: ClientClassPlan[]; clientId: string }) {
  if (classPlans.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-12 h-12 mx-auto text-foreground/10 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
        <p className="text-[14px] text-muted mb-2">No class plans yet.</p>
        <p className="text-[12px] text-muted/60">
          Class plans can be created from the exercise browser and saved to this client.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-heading text-[16px] font-semibold text-foreground mb-5">Class Plans</h2>
      <div className="space-y-3">
        {classPlans.map(plan => (
          <div key={plan.id} className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[14px] font-medium text-foreground">{plan.name}</h3>
              <span className="text-[11px] text-muted">
                {new Date(plan.updated_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-muted">
                {plan.exercise_ids.length} exercise{plan.exercise_ids.length !== 1 ? 's' : ''}
              </span>
              {plan.notes && (
                <span className="text-[12px] text-muted/60 line-clamp-1">— {plan.notes}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
