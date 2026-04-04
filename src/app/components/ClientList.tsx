'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/types'

const POSTURE_META: Record<string, { label: string; color: string }> = {
  kyphosis:      { label: 'Kyphosis-Lordosis', color: '#6b2d5b' },
  kyphosis_only: { label: 'Kyphosis',          color: '#8a6d9a' },
  lordosis:      { label: 'Lordosis',           color: '#c98a24' },
  flatback:      { label: 'Flat Back',          color: '#6a8a6e' },
  military:      { label: 'Military',           color: '#7a9a80' },
  swayback:      { label: 'Sway Back',          color: '#9a7aaa' },
}

const SEX_LABELS: Record<string, string> = { female: 'Female', male: 'Male', prefer_not_to_say: 'Prefer not to say' }

interface Props {
  clients: Client[]
  assessmentMap: Record<string, { date: string; posture: string | null }>
}

export default function ClientList({ clients: initialClients, assessmentMap }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [consent, setConsent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [contextMenu, setContextMenu] = useState<{ clientId: string; x: number; y: number } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const filtered = initialClients.filter(c => {
    const q = search.toLowerCase()
    return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q)
  })

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    if (contextMenu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [contextMenu])

  const handleCreate = async () => {
    if (!firstName.trim() || !consent) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        age: age ? parseInt(age) : null,
        consent_given: true,
        consent_date: new Date().toISOString(),
      })
      .select()
      .single()
    if (!error && data) {
      router.push(`/clients/${data.id}`)
    }
    setSaving(false)
  }

  const handleLongPressStart = (clientId: string, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    longPressTimer.current = setTimeout(() => {
      setContextMenu({
        clientId,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
    }, 500)
  }

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  /* ─── export client data as text ─── */
  const exportClientData = useCallback((client: Client) => {
    const intake = client.intake || {}
    const assessment = assessmentMap[client.id]
    const lines = [
      `CLIENT DATA EXPORT`,
      `Generated: ${new Date().toLocaleDateString()}`,
      ``,
      `── CLIENT INFO ──`,
      `Name: ${[client.first_name, client.last_name].filter(Boolean).join(' ')}`,
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
      `── LAST ASSESSMENT ──`,
      assessment ? `Date: ${assessment.date}\nPosture: ${assessment.posture ? (POSTURE_META[assessment.posture]?.label || assessment.posture) : '-'}` : 'No assessments yet',
      ``,
      `── INSTRUCTOR NOTES ──`,
      client.notes || '(none)',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${[client.first_name, client.last_name].filter(Boolean).join('-').toLowerCase()}-data.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [assessmentMap])

  /* ─── delete client ─── */
  const handleDelete = async (clientId: string) => {
    setDeleting(clientId)
    await supabase.from('postural_assessments').delete().eq('client_id', clientId)
    await supabase.from('client_class_plans').delete().eq('client_id', clientId)
    await supabase.from('clients').delete().eq('id', clientId)
    setContextMenu(null)
    setDeleting(null)
    router.refresh()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border text-[14px] bg-white focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-[13px] font-semibold text-white bg-primary hover:bg-primary-light transition-all px-5 py-2.5 rounded-xl shadow-sm shadow-primary/20 flex items-center gap-2 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Client
        </button>
      </div>

      {/* New client form */}
      {showForm && (
        <div className="mb-6 bg-white rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-heading text-[16px] font-semibold text-foreground">Add New Client</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-[12px] font-medium text-foreground/60">First Name *</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" className="w-full px-3.5 py-2 rounded-xl border border-border text-[14px] bg-background focus:outline-none focus:border-primary/40 transition-all" />
            </div>
            <div>
              <label className="block mb-1 text-[12px] font-medium text-foreground/60">Last Name</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" className="w-full px-3.5 py-2 rounded-xl border border-border text-[14px] bg-background focus:outline-none focus:border-primary/40 transition-all" />
            </div>
            <div>
              <label className="block mb-1 text-[12px] font-medium text-foreground/60">Age</label>
              <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 42" min="1" max="120" className="w-full px-3.5 py-2 rounded-xl border border-border text-[14px] bg-background focus:outline-none focus:border-primary/40 transition-all" />
            </div>
          </div>
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-border bg-background/50">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="w-4 h-4 mt-0.5 accent-primary shrink-0" />
            <span className="text-[12px] text-muted leading-relaxed">
              I confirm that this client will be sent an intake form where they can provide their personal and health data directly. The client will give their own consent before submitting. See our{' '}
              <Link href="/privacy" className="text-primary hover:underline" onClick={e => e.stopPropagation()}>Privacy Policy</Link> for full details.
            </span>
          </label>
          <div className="flex items-center gap-3">
            <button onClick={handleCreate} disabled={!firstName.trim() || !consent || saving} className="text-[13px] font-semibold text-white bg-primary hover:bg-primary-light transition-all px-5 py-2.5 rounded-xl shadow-sm shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? 'Creating...' : 'Create Client'}
            </button>
            <button onClick={() => { setShowForm(false); setFirstName(''); setLastName(''); setAge(''); setConsent(false) }} className="text-[13px] font-medium text-muted hover:text-foreground transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Hint */}
      {filtered.length > 0 && (
        <p className="text-[11px] text-muted/40 mb-3 text-right">Long-press a client for more options</p>
      )}

      {/* Client cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-12 h-12 mx-auto text-foreground/10 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <p className="text-[14px] text-muted">
            {search ? 'No clients match your search.' : 'No clients yet. Add your first client to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(client => {
            const lastAssessment = assessmentMap[client.id]
            const fullName = [client.first_name, client.last_name].filter(Boolean).join(' ')

            return (
              <button
                key={client.id}
                onClick={() => router.push(`/clients/${client.id}`)}
                onContextMenu={e => { e.preventDefault(); handleLongPressStart(client.id, e) }}
                onTouchStart={e => handleLongPressStart(client.id, e)}
                onTouchEnd={handleLongPressEnd}
                onTouchCancel={handleLongPressEnd}
                className="text-left bg-white rounded-2xl border border-border p-5 hover:border-primary/30 hover:shadow-sm hover:shadow-primary/5 transition-all group relative select-none"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-heading text-[16px] font-semibold text-foreground group-hover:text-primary transition-colors">
                      {fullName}
                    </h3>
                    {client.age && <span className="text-[12px] text-muted">Age {client.age}</span>}
                  </div>
                  <svg className="w-4 h-4 text-foreground/15 group-hover:text-primary/40 transition-colors mt-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(client as Client & { intake_completed_at?: string }).intake_completed_at ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-green-50 text-green-600 border border-green-100">Intake completed</span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100">Intake pending</span>
                  )}
                  {lastAssessment ? (
                    <>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                        Last assessed: {lastAssessment.date}
                      </span>
                      {lastAssessment.posture && POSTURE_META[lastAssessment.posture] && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md text-white" style={{ backgroundColor: POSTURE_META[lastAssessment.posture].color }}>
                          {POSTURE_META[lastAssessment.posture].label}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-black/[0.03] text-foreground/30">No assessment yet</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Context menu overlay */}
      {contextMenu && (
        <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px]" onClick={() => setContextMenu(null)}>
          <div
            ref={menuRef}
            className="absolute bg-white rounded-2xl shadow-xl border border-border overflow-hidden w-56 animate-in fade-in zoom-in-95"
            style={{
              left: Math.min(contextMenu.x - 112, window.innerWidth - 240),
              top: Math.min(contextMenu.y - 20, window.innerHeight - 200),
            }}
            onClick={e => e.stopPropagation()}
          >
            {(() => {
              const client = initialClients.find(c => c.id === contextMenu.clientId)
              if (!client) return null
              const fullName = [client.first_name, client.last_name].filter(Boolean).join(' ')
              return (
                <>
                  <div className="px-4 py-3 border-b border-border bg-background/50">
                    <p className="text-[13px] font-semibold text-foreground truncate">{fullName}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { router.push(`/clients/${client.id}`); setContextMenu(null) }}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-foreground hover:bg-primary/[0.04] transition-colors flex items-center gap-2.5"
                    >
                      <svg className="w-4 h-4 text-foreground/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      Open profile
                    </button>
                    <button
                      onClick={() => { exportClientData(client); setContextMenu(null) }}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-foreground hover:bg-primary/[0.04] transition-colors flex items-center gap-2.5"
                    >
                      <svg className="w-4 h-4 text-foreground/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                      Export data
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={() => handleDelete(client.id)}
                      disabled={deleting === client.id}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2.5"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      {deleting === client.id ? 'Deleting...' : 'Delete permanently'}
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
