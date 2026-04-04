'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Client, PosturalAssessment, ClientClassPlan } from '@/lib/types'

/* ─── intake types & constants (shared with AssessmentWizard) ─── */

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

const SEX_LABELS: Record<string, string> = { female: 'Female', male: 'Male', prefer_not_to_say: 'Prefer not to say' }

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
  const [tab, setTab] = useState<'intake' | 'assessments' | 'plans' | 'photos'>('intake')
  const [editingNotes, setEditingNotes] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)
  const [notes, setNotes] = useState(client.notes || '')
  const [linkCopied, setLinkCopied] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  /* ─── photos state ─── */
  const [photos, setPhotos] = useState<{ name: string; url: string; created_at: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [photoDeleteTarget, setPhotoDeleteTarget] = useState<string | null>(null)

  const fullName = [client.first_name, client.last_name].filter(Boolean).join(' ')
  const intake: ClientIntake = { ...EMPTY_INTAKE, ...(client.intake as Partial<ClientIntake> || {}) }
  const hasIntake = Object.values(intake).some(v =>
    Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.length > 0
  )
  const intakeCompleted = !!client.intake_completed_at
  const intakeLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/intake/${client.intake_token}`

  /* ─── copy link ─── */
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(intakeLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }

  /* ─── save instructor notes ─── */
  const handleSaveNotes = async () => {
    setSavingNotes(true)
    const { error } = await supabase
      .from('clients')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', client.id)
    if (!error) {
      setEditingNotes(false)
      router.refresh()
    }
    setSavingNotes(false)
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

  /* ─── export client data ─── */
  const handleExport = useCallback(() => {
    const lines = [
      `CLIENT DATA EXPORT`,
      `Generated: ${new Date().toLocaleDateString()}`,
      ``,
      `── CLIENT INFO ──`,
      `Name: ${fullName}`,
      `Age: ${client.age || '-'}`,
      `Created: ${new Date(client.created_at).toLocaleDateString()}`,
      `Consent: ${client.consent_given ? 'Yes' : 'No'}${client.consent_date ? ` (${new Date(client.consent_date).toLocaleDateString()})` : ''}`,
      ``,
      `── INTAKE ──`,
      `Sex: ${SEX_LABELS[intake.sex] || intake.sex || '-'}`,
      `Occupation: ${intake.occupation || '-'}`,
      `Typical day: ${[intake.typicalDay, intake.typicalDayDetails].filter(Boolean).join(' — ') || '-'}`,
      `Medical conditions: ${intake.medicalConditions || '-'}`,
      `Pregnant/postnatal: ${intake.pregnantPostnatal || '-'}${intake.pregnantPostnatalDetails ? ` — ${intake.pregnantPostnatalDetails}` : ''}`,
      `Medication: ${intake.medication || '-'}${intake.medicationDetails ? ` — ${intake.medicationDetails}` : ''}`,
      `Surgeries: ${intake.surgeries || '-'}${intake.surgeryDetails ? ` — ${intake.surgeryDetails}` : ''}`,
      `Difficult movements: ${intake.difficultMovements || '-'}`,
      `Functional concerns: ${intake.functionalConcerns?.join(', ') || '-'}`,
      `Medical restrictions: ${intake.medicalRestrictions || '-'}`,
      `Current injuries: ${intake.currentInjuries || '-'}${intake.currentInjuryDetails ? ` — ${intake.currentInjuryDetails}` : ''}`,
      `Previous injuries: ${intake.previousInjuries || '-'}${intake.previousInjuryDetails ? ` — ${intake.previousInjuryDetails}` : ''}`,
      `Recurring pain: ${[...(intake.recurringPain || []), intake.recurringPainOther].filter(Boolean).join(', ') || '-'}`,
      `Pain timing: ${[...(intake.painTiming || []), intake.painTimingOther].filter(Boolean).join(', ') || '-'}`,
      `Activities: ${[...(intake.currentActivities || []), intake.currentActivitiesOther].filter(Boolean).join(', ') || '-'}`,
      `Frequency: ${intake.activityFrequency || '-'}`,
      `Pilates experience: ${intake.pilatesExperience || '-'}`,
      `Goals: ${intake.pilatesGoals?.join(', ') || '-'}`,
      `Specific goals: ${intake.specificGoals || '-'}`,
      `Other: ${intake.anythingElse || '-'}`,
      ``,
      `── ASSESSMENTS (${assessments.length}) ──`,
      ...(assessments.length > 0
        ? assessments.map(a => {
            const posture = a.confirmed_posture || a.suggested_posture
            return `Date: ${a.assessment_date} | Posture: ${posture ? (POSTURE_META[posture]?.label || posture) : '-'}${a.notes ? ` | Notes: ${a.notes}` : ''}`
          })
        : ['No assessments yet']),
      ``,
      `── CLASS PLANS (${classPlans.length}) ──`,
      ...(classPlans.length > 0
        ? classPlans.map(p => `${p.name} — ${p.exercise_ids.length} exercises${p.notes ? ` | Notes: ${p.notes}` : ''}`)
        : ['No class plans yet']),
      ``,
      `── INSTRUCTOR NOTES ──`,
      client.notes || '(none)',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fullName.replace(/\s+/g, '-').toLowerCase()}-data.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [fullName, client, intake, assessments, classPlans])

  /* ─── load photos ─── */
  const loadPhotos = useCallback(async () => {
    setLoadingPhotos(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingPhotos(false); return }

    const folder = `${user.id}/${client.id}`
    const { data: files } = await supabase.storage
      .from('client-photos')
      .list(folder, { sortBy: { column: 'created_at', order: 'desc' } })

    if (files && files.length > 0) {
      const validFiles = files.filter(f => !f.name.startsWith('.'))
      if (validFiles.length > 0) {
        // Create signed URLs (1 hour expiry) since bucket is private
        const paths = validFiles.map(f => `${folder}/${f.name}`)
        const { data: signedUrls } = await supabase.storage
          .from('client-photos')
          .createSignedUrls(paths, 3600)

        const photoList = validFiles.map((f, i) => ({
          name: f.name,
          url: signedUrls?.[i]?.signedUrl || '',
          created_at: f.created_at || '',
        })).filter(p => p.url)
        setPhotos(photoList)
      } else {
        setPhotos([])
      }
    } else {
      setPhotos([])
    }
    setLoadingPhotos(false)
  }, [client.id, supabase])

  useEffect(() => {
    if (tab === 'photos') loadPhotos()
  }, [tab, loadPhotos])

  /* ─── upload photo ─── */
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const folder = `${user.id}/${client.id}`

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      await supabase.storage.from('client-photos').upload(`${folder}/${fileName}`, file)
    }

    await loadPhotos()
    setUploading(false)
    // Reset input
    e.target.value = ''
  }

  /* ─── delete photo ─── */
  const handlePhotoDelete = async (fileName: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setPhotoDeleteTarget(fileName)
    const folder = `${user.id}/${client.id}`
    await supabase.storage.from('client-photos').remove([`${folder}/${fileName}`])
    await loadPhotos()
    setPhotoDeleteTarget(null)
  }

  /* ─── tab content ─── */
  const tabs = [
    { key: 'intake' as const, label: 'Intake' },
    { key: 'assessments' as const, label: `Assessments (${assessments.length})` },
    { key: 'plans' as const, label: `Class Plans (${classPlans.length})` },
    { key: 'photos' as const, label: 'Photos' },
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
              <div className="flex items-center gap-3 text-[13px] text-muted flex-wrap">
                {client.age && <span>Age {client.age}</span>}
                {intakeCompleted ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    Intake completed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Intake pending
                  </span>
                )}
                {client.consent_date && (
                  <span className="text-foreground/25">
                    Consent {new Date(client.consent_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleExport}
              className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground/50 hover:text-primary bg-white border border-border hover:border-primary/30 px-4 py-2 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export
            </button>
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
            intakeCompleted={intakeCompleted}
            hasIntake={hasIntake}
            intakeLink={intakeLink}
            linkCopied={linkCopied}
            onCopyLink={handleCopyLink}
            notes={notes}
            setNotes={setNotes}
            editingNotes={editingNotes}
            setEditingNotes={setEditingNotes}
            savingNotes={savingNotes}
            onSaveNotes={handleSaveNotes}
          />
        )}

        {tab === 'assessments' && (
          <AssessmentsTab assessments={assessments} clientId={client.id} />
        )}

        {tab === 'plans' && (
          <PlansTab classPlans={classPlans} clientId={client.id} />
        )}

        {tab === 'photos' && (
          <PhotosTab
            photos={photos}
            loading={loadingPhotos}
            uploading={uploading}
            deleteTarget={photoDeleteTarget}
            onUpload={handlePhotoUpload}
            onDelete={handlePhotoDelete}
          />
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
  intake, intakeCompleted, hasIntake, intakeLink, linkCopied, onCopyLink,
  notes, setNotes, editingNotes, setEditingNotes, savingNotes, onSaveNotes,
}: {
  intake: ClientIntake
  intakeCompleted: boolean
  hasIntake: boolean
  intakeLink: string
  linkCopied: boolean
  onCopyLink: () => void
  notes: string
  setNotes: (v: string) => void
  editingNotes: boolean
  setEditingNotes: (v: boolean) => void
  savingNotes: boolean
  onSaveNotes: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Intake link sharing card */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-[14px] font-semibold text-foreground mb-1">
              {intakeCompleted ? 'Intake form submitted by client' : 'Send intake form to client'}
            </h3>
            <p className="text-[12px] text-muted leading-relaxed max-w-md">
              {intakeCompleted
                ? `Completed on ${new Date(intakeCompleted as unknown as string).toLocaleDateString()}. The client filled in their own data and gave consent.`
                : 'Share this link with your client before their first session. They can fill in their health and background information themselves.'
              }
            </p>
          </div>
          <button
            onClick={onCopyLink}
            className={`shrink-0 inline-flex items-center gap-1.5 text-[13px] font-medium px-4 py-2 rounded-xl border transition-all ${
              linkCopied
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-primary/[0.04] border-primary/15 text-primary hover:bg-primary/[0.08]'
            }`}
          >
            {linkCopied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-3.022a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364l1.757 1.757" /></svg>
                Copy intake link
              </>
            )}
          </button>
        </div>
        {/* Show truncated link */}
        <div className="mt-3 px-3 py-2 bg-background rounded-lg border border-border">
          <code className="text-[11px] text-muted break-all select-all">{intakeLink}</code>
        </div>
      </div>

      {/* Client responses (read-only) */}
      {hasIntake && (
        <div>
          <h2 className="font-heading text-[16px] font-semibold text-foreground mb-4">Client Responses</h2>
          <div className="space-y-4">
            <ReadSection title="About" items={[
              { label: 'Sex', value: SEX_LABELS[intake.sex] || intake.sex },
              { label: 'Age', value: intake.age },
              { label: 'Occupation', value: intake.occupation },
              { label: 'Typical day', value: [intake.typicalDay, intake.typicalDayDetails].filter(Boolean).join(' — ') },
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
          </div>
        </div>
      )}

      {!hasIntake && !intakeCompleted && (
        <div className="text-center py-8">
          <p className="text-[13px] text-muted/50">
            Waiting for client to complete the intake form...
          </p>
        </div>
      )}

      {/* Instructor notes (separate from client data) */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-heading text-[14px] font-semibold text-foreground/50 uppercase tracking-wider">Instructor Notes</h4>
          {!editingNotes && (
            <button
              onClick={() => setEditingNotes(true)}
              className="text-[12px] font-medium text-primary hover:text-primary-light transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit
            </button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-3">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Your own observations, things to watch for, session notes..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-border text-[14px] bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={onSaveNotes}
                disabled={savingNotes}
                className="text-[13px] font-semibold text-white bg-primary hover:bg-primary-light transition-all px-5 py-2 rounded-xl shadow-sm shadow-primary/20 disabled:opacity-40"
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
              <button
                onClick={() => setEditingNotes(false)}
                className="text-[13px] font-medium text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-foreground/60 whitespace-pre-wrap">
            {notes || <span className="text-foreground/25 italic">No notes yet. Click Edit to add your observations.</span>}
          </p>
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

/* ═══════════════════════════════════════════════════
   PHOTOS TAB
   ═══════════════════════════════════════════════════ */

function PhotosTab({
  photos, loading, uploading, deleteTarget, onUpload, onDelete,
}: {
  photos: { name: string; url: string; created_at: string }[]
  loading: boolean
  uploading: boolean
  deleteTarget: string | null
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDelete: (name: string) => void
}) {
  const [selectedPhoto, setSelectedPhoto] = useState<{ name: string; url: string; created_at: string } | null>(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-heading text-[16px] font-semibold text-foreground">Photos</h2>
          <p className="text-[12px] text-muted mt-0.5">Track progress, recovery, and posture over time.</p>
        </div>
        <label className="text-[13px] font-semibold text-white bg-primary hover:bg-primary-light transition-all px-4 py-2 rounded-xl shadow-sm shadow-primary/20 flex items-center gap-1.5 cursor-pointer">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {uploading ? 'Uploading...' : 'Upload Photos'}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-muted">Loading photos...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-12 h-12 mx-auto text-foreground/10 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6.75v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <p className="text-[14px] text-muted mb-2">No photos yet.</p>
          <p className="text-[12px] text-muted/60">
            Upload photos to document progress, posture, recovery, or anything relevant to this client.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map(photo => (
            <div
              key={photo.name}
              className="relative group rounded-2xl overflow-hidden border border-border bg-white aspect-square cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.url}
                alt={photo.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                {photo.created_at && (
                  <span className="text-[10px] text-white bg-black/50 rounded-md px-2 py-0.5">
                    {new Date(photo.created_at).toLocaleDateString()}
                  </span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); onDelete(photo.name) }}
                  disabled={deleteTarget === photo.name}
                  className="text-white bg-red-500/80 hover:bg-red-600 rounded-lg p-1.5 transition-colors"
                >
                  {deleteTarget === photo.name ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.name}
              className="w-full h-full object-contain rounded-2xl"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {selectedPhoto.created_at && (
              <div className="absolute bottom-3 left-3 text-[12px] text-white bg-black/50 rounded-lg px-3 py-1.5">
                {new Date(selectedPhoto.created_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
