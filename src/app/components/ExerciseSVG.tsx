'use client'

import React from 'react'

/* ─── shared helpers ──────────────────────────────────────────────── */
const body = {
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
}

const thin = {
  stroke: 'currentColor',
  strokeWidth: 1,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
}

function Mat({ y = 68 }: { y?: number }) {
  return <line x1="10" y1={y} x2="110" y2={y} stroke="currentColor" strokeWidth={0.5} opacity={0.3} />
}

/* ─── Warm-Up (1–10) ──────────────────────────────────────────────── */

function BreathingSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head */}
      <ellipse cx="90" cy="62" rx="5" ry="4.5" {...body} />
      {/* Neck */}
      <line x1="85" y1="62" x2="82" y2="62" {...thin} />
      {/* Torso supine */}
      <path d="M82 62 Q70 60 55 62 Q45 63 35 64" {...body} />
      {/* Ribcage expansion lines */}
      <path d="M72 58 Q68 55 64 58" {...thin} opacity={0.5} />
      <path d="M72 66 Q68 69 64 66" {...thin} opacity={0.5} />
      {/* Arms at sides */}
      <path d="M75 64 L78 68 L85 68" {...thin} />
      <path d="M55 64 L52 68 L45 68" {...thin} />
      {/* Legs */}
      <path d="M35 64 L25 66 L18 66" {...body} />
      <path d="M35 62 L25 60 L18 62" {...body} />
    </svg>
  )
}

function ImprintReleaseSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head */}
      <ellipse cx="92" cy="62" rx="5" ry="4.5" {...body} />
      {/* Torso supine flat on mat */}
      <path d="M87 62 Q75 65 60 66 Q50 66 40 65" {...body} />
      {/* Lower back pressed into mat - flatten curve */}
      <path d="M60 66 L55 67 L50 67" {...thin} opacity={0.4} />
      {/* Arms at sides */}
      <path d="M78 64 L80 68 L88 68" {...thin} />
      <path d="M55 66 L52 68 L46 68" {...thin} />
      {/* Bent knees, feet flat */}
      <path d="M40 65 L35 50 L30 44" {...body} />
      <path d="M30 44 L28 52 L25 66" {...body} />
      <line x1="25" y1="66" x2="22" y2="68" {...body} />
      {/* Second leg */}
      <path d="M40 65 L36 52 L33 46" {...body} />
      <path d="M33 46 L30 54 L27 66" {...body} />
      <line x1="27" y1="66" x2="24" y2="68" {...body} />
      {/* Pelvic tilt arrow */}
      <path d="M48 68 L48 65" {...thin} opacity={0.3} />
    </svg>
  )
}

function HipReleaseSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head */}
      <ellipse cx="95" cy="62" rx="5" ry="4.5" {...body} />
      {/* Torso */}
      <path d="M90 62 Q78 64 65 66 Q55 66 45 65" {...body} />
      {/* Arms at sides */}
      <path d="M80 64 L82 68" {...thin} />
      <path d="M58 66 L55 68" {...thin} />
      {/* Left leg bent, knee dropped to side */}
      <path d="M45 65 L40 52 L38 48" {...body} />
      <path d="M38 48 Q32 55 28 66" {...body} />
      {/* Right leg knee open to side (dropped outward) */}
      <path d="M45 64 L42 55 L40 50" {...body} />
      <path d="M40 50 Q35 45 30 50 Q26 56 24 60" {...body} />
    </svg>
  )
}

function SpinalRotationSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Side-lying figure — knees bent, top arm reaching back */}
      {/* Head on arm */}
      <ellipse cx="85" cy="60" rx="5" ry="4.5" {...body} />
      {/* Bottom arm as pillow */}
      <path d="M90 62 L95 62" {...thin} />
      {/* Torso */}
      <path d="M80 62 Q70 62 58 64" {...body} />
      {/* Top arm reaching back/up — rotation */}
      <path d="M72 60 L65 48 L58 44" {...thin} />
      {/* Rotation arrow hint */}
      <path d="M60 46 L58 44 L62 44" {...thin} opacity={0.4} />
      {/* Hips */}
      <path d="M58 64 L54 65" {...body} />
      {/* Knees bent stacked */}
      <path d="M54 65 Q45 60 38 62" {...body} />
      <path d="M38 62 L32 66" {...body} />
      <path d="M54 65 Q46 62 40 64" {...body} />
      <path d="M40 64 L34 68" {...body} />
    </svg>
  )
}

function SpinalRotationSupineSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head */}
      <ellipse cx="60" cy="61" rx="5" ry="4.5" {...body} />
      {/* Torso supine */}
      <path d="M60 65 Q60 66 60 67" {...body} />
      {/* Arms in T position */}
      <path d="M60 66 L85 66" {...body} />
      <path d="M60 66 L35 66" {...body} />
      {/* Pelvis */}
      <path d="M56 67 L64 67" {...body} />
      {/* Knees dropped to one side (right) */}
      <path d="M60 67 Q65 58 72 50" {...body} />
      <path d="M72 50 Q76 56 78 64" {...body} />
      <path d="M60 67 Q66 56 70 48" {...body} />
      <path d="M70 48 Q74 54 76 62" {...body} />
    </svg>
  )
}

function CatStretchSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head looking down */}
      <ellipse cx="85" cy="48" rx="4" ry="3.5" {...body} />
      {/* Rounded spine - cat position */}
      <path d="M82 46 Q75 42 65 30 Q55 22 50 28 Q45 35 40 45" {...body} />
      {/* Front arms (hands to mat) */}
      <path d="M85 50 L86 58 L86 68" {...body} />
      <path d="M82 50 L82 58 L82 68" {...body} />
      {/* Back legs (knees on mat) */}
      <path d="M40 45 L38 55 L36 68" {...body} />
      <path d="M42 47 L42 56 L40 68" {...body} />
      {/* Rounded back emphasis */}
      <path d="M78 44 Q65 25 48 35" {...thin} opacity={0.3} />
    </svg>
  )
}

function HipRollsSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head */}
      <ellipse cx="95" cy="64" rx="5" ry="4.5" {...body} />
      {/* Neck and upper back on mat */}
      <path d="M90 64 Q82 64 75 63" {...body} />
      {/* Bridge - hips lifted, spine articulated */}
      <path d="M75 63 Q68 56 60 48 Q55 44 50 46" {...body} />
      {/* Thighs going down to feet */}
      <path d="M50 46 Q45 50 42 56 Q40 62 38 68" {...body} />
      <line x1="38" y1="68" x2="35" y2="68" {...body} />
      {/* Second leg */}
      <path d="M50 46 Q46 52 44 58 Q42 63 40 68" {...body} />
      <line x1="40" y1="68" x2="37" y2="68" {...body} />
      {/* Arms flat */}
      <path d="M80 65 L84 68" {...thin} />
      <path d="M60 55 L58 58" {...thin} />
    </svg>
  )
}

function ScapulaIsolationSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head */}
      <ellipse cx="92" cy="63" rx="5" ry="4.5" {...body} />
      {/* Torso supine */}
      <path d="M87 63 Q78 65 65 66 Q55 66 42 65" {...body} />
      {/* Arms reaching toward ceiling */}
      <path d="M78 63 Q76 50 74 38" {...body} />
      <path d="M72 63 Q70 50 68 38" {...body} />
      {/* Shoulder blades lifting - small gap */}
      <path d="M80 62 Q78 60 76 61" {...thin} opacity={0.4} />
      {/* Legs flat */}
      <path d="M42 65 L30 66 L20 66" {...body} />
      <path d="M42 66 L30 68 L20 68" {...body} />
    </svg>
  )
}

function ArmCirclesSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head */}
      <ellipse cx="60" cy="63" rx="5" ry="4.5" {...body} />
      {/* Torso supine */}
      <path d="M55 63 Q50 65 42 66 Q35 66 28 65" {...body} />
      {/* Arms overhead in arc motion */}
      <path d="M55 60 Q52 50 55 40 Q58 32 65 30" {...body} />
      {/* Circle motion indicator */}
      <path d="M65 30 Q72 32 74 40" {...thin} strokeDasharray="2 2" opacity={0.4} />
      <path d="M74 40 Q72 50 66 56" {...thin} strokeDasharray="2 2" opacity={0.4} />
      {/* Other arm */}
      <path d="M56 62 Q54 52 56 42 Q58 35 63 33" {...thin} opacity={0.5} />
      {/* Legs flat */}
      <path d="M28 65 L18 66 L12 66" {...body} />
      <path d="M28 66 L18 68 L12 68" {...body} />
    </svg>
  )
}

function HeadNodsSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head with chin tucked (nodding) */}
      <ellipse cx="92" cy="60" rx="5" ry="4.5" {...body} transform="rotate(-15 92 60)" />
      {/* Torso supine */}
      <path d="M87 62 Q78 64 65 66 Q55 66 42 65" {...body} />
      {/* Chin tuck indicator */}
      <path d="M90 56 Q88 58 87 61" {...thin} opacity={0.4} />
      {/* Arms at sides */}
      <path d="M78 65 L82 68" {...thin} />
      <path d="M55 66 L52 68" {...thin} />
      {/* Legs flat */}
      <path d="M42 65 L30 66 L20 66" {...body} />
      <path d="M42 66 L30 68 L20 68" {...body} />
    </svg>
  )
}

function ElevationDepressionSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head */}
      <ellipse cx="92" cy="62" rx="5" ry="4.5" {...body} />
      {/* Torso supine */}
      <path d="M87 62 Q78 64 65 66 Q55 66 42 65" {...body} />
      {/* Shoulders shrugged up */}
      <path d="M82 60 L80 58 L78 60" {...body} />
      <path d="M72 62 L70 60 L68 62" {...body} />
      {/* Shrug arrows */}
      <path d="M80 62 L80 57" {...thin} opacity={0.3} />
      <path d="M70 64 L70 59" {...thin} opacity={0.3} />
      {/* Arms at sides */}
      <path d="M80 62 L82 68" {...thin} />
      <path d="M68 64 L66 68" {...thin} />
      {/* Legs flat */}
      <path d="M42 65 L30 66 L20 66" {...body} />
      <path d="M42 66 L30 68 L20 68" {...body} />
    </svg>
  )
}

/* ─── Layer 1 (11–21) ─────────────────────────────────────────────── */

function AbPrepSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head curled up */}
      <ellipse cx="82" cy="50" rx="5" ry="4.5" {...body} />
      {/* Hands behind head */}
      <path d="M86 48 Q88 46 87 50" {...thin} />
      <path d="M84 46 Q86 44 88 46" {...thin} />
      {/* Curled upper body */}
      <path d="M78 52 Q72 56 65 62 Q58 66 48 66" {...body} />
      {/* Arms behind head shape */}
      <path d="M82 46 Q80 44 78 46 Q76 50 78 52" {...thin} />
      {/* Legs bent, feet flat */}
      <path d="M48 66 L42 52 L38 46" {...body} />
      <path d="M38 46 L35 54 L32 66" {...body} />
      <line x1="32" y1="66" x2="28" y2="68" {...body} />
      <path d="M48 66 L44 54 L41 48" {...body} />
      <path d="M41 48 L38 56 L35 66" {...body} />
      <line x1="35" y1="66" x2="31" y2="68" {...body} />
    </svg>
  )
}

function BreastStrokePrepsSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head lifted */}
      <ellipse cx="82" cy="50" rx="4.5" ry="4" {...body} />
      {/* Prone body with upper back extension */}
      <path d="M78 52 Q72 56 65 60 Q55 64 45 66 Q35 67 25 67" {...body} />
      {/* Arms reaching forward */}
      <path d="M82 54 L90 50 L100 48" {...body} />
      <path d="M80 56 L88 52 L98 50" {...thin} opacity={0.6} />
      {/* Legs flat prone */}
      <path d="M25 67 L18 67" {...body} />
      <path d="M25 66 L18 66" {...body} />
    </svg>
  )
}

function ShellStretchSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Child's pose - head down */}
      <ellipse cx="72" cy="62" rx="4" ry="3.5" {...body} />
      {/* Rounded back curving from head to hips */}
      <path d="M68 60 Q62 48 55 40 Q50 36 45 40 Q40 45 38 55" {...body} />
      {/* Knees tucked under */}
      <path d="M38 55 Q36 60 35 66 Q34 68 36 68" {...body} />
      <path d="M40 55 Q38 60 38 66 Q38 68 40 68" {...body} />
      {/* Arms extended forward */}
      <path d="M72 64 L82 66 L95 66" {...body} />
      <path d="M70 66 L80 68 L93 68" {...body} />
      {/* Feet */}
      <path d="M36 68 L33 68" {...thin} />
    </svg>
  )
}

function HundredSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head/shoulders curled up */}
      <ellipse cx="80" cy="46" rx="5" ry="4.5" {...body} />
      {/* Curled torso to pelvis on mat */}
      <path d="M76 49 Q70 54 62 60 Q56 64 50 66" {...body} />
      {/* Legs extended at 45 degrees */}
      <path d="M50 66 L35 50 L22 38" {...body} />
      <path d="M50 65 L36 52 L24 40" {...body} />
      {/* Arms pumping alongside body, lifted */}
      <path d="M74 52 L72 56 L68 58" {...body} />
      <path d="M70 52 L68 56 L64 58" {...thin} />
      {/* Pump indicators */}
      <path d="M68 56 L68 60" {...thin} opacity={0.3} strokeDasharray="1 1" />
      <path d="M64 56 L64 60" {...thin} opacity={0.3} strokeDasharray="1 1" />
    </svg>
  )
}

function HalfRollBackSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head */}
      <ellipse cx="68" cy="25" rx="5" ry="4.5" {...body} />
      {/* C-curve torso leaned back ~45° */}
      <path d="M66 29 Q62 35 58 42 Q54 50 52 58 Q51 64 52 66" {...body} />
      {/* Arms reaching forward */}
      <path d="M66 32 L76 38 L82 42" {...body} />
      <path d="M64 34 L74 40 L80 44" {...thin} opacity={0.6} />
      {/* Bent knees */}
      <path d="M52 66 Q56 60 62 58 Q68 58 72 62" {...body} />
      {/* Shins */}
      <path d="M72 62 L74 66 L76 68" {...body} />
      {/* Feet */}
      <line x1="76" y1="68" x2="80" y2="68" {...body} />
    </svg>
  )
}

function RollUpSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head - seated forward */}
      <ellipse cx="62" cy="26" rx="5" ry="4.5" {...body} />
      {/* Torso curled forward over legs */}
      <path d="M60 30 Q56 38 54 46 Q52 54 52 60" {...body} />
      {/* Arms reaching forward past toes */}
      <path d="M60 28 L72 30 L85 32" {...body} />
      <path d="M58 30 L70 32 L83 34" {...thin} opacity={0.6} />
      {/* Straight legs on mat */}
      <path d="M52 64 Q58 66 68 66 Q78 66 90 67" {...body} />
      <path d="M52 66 Q58 68 68 68 Q78 68 90 68" {...body} />
      {/* Feet */}
      <path d="M90 67 L93 65" {...body} />
    </svg>
  )
}

function OneLegCircleSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head */}
      <ellipse cx="92" cy="62" rx="5" ry="4.5" {...body} />
      {/* Torso supine */}
      <path d="M87 62 Q78 64 65 66 Q55 66 48 65" {...body} />
      {/* Arms at sides */}
      <path d="M80 65 L82 68" {...thin} />
      <path d="M58 66 L55 68" {...thin} />
      {/* One leg to ceiling */}
      <path d="M48 65 L46 45 L45 22" {...body} />
      {/* Circle indicator around raised leg */}
      <path d="M42 22 Q40 18 45 16 Q50 18 48 22" {...thin} opacity={0.3} strokeDasharray="2 2" />
      {/* Other leg flat */}
      <path d="M48 66 L38 67 L28 67" {...body} />
    </svg>
  )
}

function SpineTwistSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head - rotated */}
      <ellipse cx="55" cy="18" rx="5" ry="4.5" {...body} />
      {/* Upright torso with rotation */}
      <path d="M55 22 Q54 30 53 40 Q52 50 52 58" {...body} />
      {/* Arms in T - one coming toward viewer, one away */}
      <path d="M54 34 L40 30 L28 28" {...body} />
      <path d="M54 34 L62 36 L72 40" {...body} />
      {/* Rotation indicator */}
      <path d="M56 36 Q58 34 56 32" {...thin} opacity={0.3} />
      {/* Legs extended */}
      <path d="M52 62 Q60 64 70 66 Q80 67 92 67" {...body} />
      <path d="M52 64 Q60 66 70 68 Q80 68 92 68" {...body} />
      {/* Feet */}
      <path d="M92 67 L95 65" {...body} />
    </svg>
  )
}

function RollingBallSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Compact ball shape - balanced on sit bones */}
      {/* Head tucked */}
      <ellipse cx="68" cy="28" rx="5" ry="4.5" {...body} />
      {/* Rounded spine */}
      <path d="M65 32 Q60 38 56 45 Q54 52 55 58" {...body} />
      {/* Knees tucked to chest */}
      <path d="M55 58 Q56 52 60 48 Q64 44 68 44" {...body} />
      <path d="M68 44 Q72 46 74 50 Q76 56 74 60" {...body} />
      {/* Shins */}
      <path d="M74 60 Q72 62 68 60 Q64 56 62 52" {...body} />
      {/* Hands on shins */}
      <path d="M66 34 Q64 38 62 44 Q60 48 60 50" {...thin} />
      <path d="M70 32 Q70 38 70 44 Q70 48 68 50" {...thin} />
      {/* Feet */}
      <path d="M74 60 L76 58" {...body} />
    </svg>
  )
}

function SingleLegStretchSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head curled up */}
      <ellipse cx="80" cy="46" rx="5" ry="4.5" {...body} />
      {/* Curled torso */}
      <path d="M76 50 Q70 55 62 60 Q56 64 50 66" {...body} />
      {/* One knee pulled in */}
      <path d="M50 66 L52 54 L56 48" {...body} />
      <path d="M56 48 L58 52 L60 56" {...body} />
      {/* Hands on pulled knee */}
      <path d="M76 50 Q72 50 66 48" {...thin} />
      <path d="M74 52 Q70 52 64 50" {...thin} />
      {/* Other leg extended at 45° */}
      <path d="M50 65 L38 56 L24 44" {...body} />
    </svg>
  )
}

function ObliquesSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head curled up with rotation */}
      <ellipse cx="76" cy="44" rx="5" ry="4.5" {...body} transform="rotate(-20 76 44)" />
      {/* Hands behind head */}
      <path d="M78 40 Q80 38 78 42" {...thin} />
      <path d="M74 40 Q72 38 74 42" {...thin} />
      {/* Curled and rotated torso */}
      <path d="M73 48 Q68 54 62 60 Q56 64 50 66" {...body} />
      {/* Rotation twist indicator */}
      <path d="M73 48 Q70 46 68 48" {...thin} opacity={0.4} />
      {/* Bent knees */}
      <path d="M50 66 L44 52 L40 46" {...body} />
      <path d="M40 46 L37 54 L34 66" {...body} />
      <path d="M50 65 L46 54 L43 48" {...body} />
      <path d="M43 48 L40 56 L37 66" {...body} />
      {/* Feet */}
      <line x1="34" y1="66" x2="30" y2="68" {...body} />
    </svg>
  )
}

/* ─── Layer 2 (22–35) ─────────────────────────────────────────────── */

function DoubleLegStretchSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head curled up */}
      <ellipse cx="68" cy="42" rx="5" ry="4.5" {...body} />
      {/* Curled torso */}
      <path d="M65 46 Q60 52 56 58 Q54 62 54 66" {...body} />
      {/* Arms extended overhead (star) */}
      <path d="M66 38 L72 30 L80 22" {...body} />
      <path d="M64 40 L70 32 L78 24" {...thin} opacity={0.6} />
      {/* Legs extended at 45° */}
      <path d="M54 66 L42 54 L28 40" {...body} />
      <path d="M54 65 L40 52 L26 38" {...body} />
    </svg>
  )
}

function ScissorsSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head curled up */}
      <ellipse cx="78" cy="48" rx="5" ry="4.5" {...body} />
      {/* Torso */}
      <path d="M75 52 Q70 56 64 62 Q58 65 54 66" {...body} />
      {/* One leg pulled toward face */}
      <path d="M54 66 L56 48 L60 32 L64 20" {...body} />
      {/* Hands on pulled leg */}
      <path d="M75 50 Q72 44 66 34" {...thin} />
      <path d="M73 52 Q70 46 64 36" {...thin} />
      {/* Other leg reaching away at 45° */}
      <path d="M54 65 L44 60 L32 54" {...body} />
    </svg>
  )
}

function ShoulderBridgePrepSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head on mat */}
      <ellipse cx="95" cy="64" rx="5" ry="4.5" {...body} />
      {/* Neck to upper back */}
      <path d="M90 64 Q84 63 78 62" {...body} />
      {/* Bridge - hips lifted */}
      <path d="M78 62 Q70 52 62 46 Q58 44 55 46" {...body} />
      {/* Standing leg */}
      <path d="M55 46 Q52 52 50 60 Q48 65 46 68" {...body} />
      <line x1="46" y1="68" x2="43" y2="68" {...body} />
      {/* Extended leg to ceiling */}
      <path d="M55 46 L52 32 L50 18" {...body} />
      {/* Arms flat */}
      <path d="M82 64 L86 68" {...thin} />
    </svg>
  )
}

function RollOverPrepSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head */}
      <ellipse cx="85" cy="64" rx="5" ry="4.5" {...body} />
      {/* Upper back on mat */}
      <path d="M80 64 Q75 64 70 63" {...body} />
      {/* Torso going vertical, hips overhead */}
      <path d="M70 63 Q66 56 64 48 Q62 40 60 34" {...body} />
      {/* Legs overhead toward floor behind head */}
      <path d="M60 34 L56 26 L50 20" {...body} />
      <path d="M60 34 L54 28 L48 22" {...body} />
      {/* Arms flat for support */}
      <path d="M76 65 L80 68" {...thin} />
      <path d="M68 64 L66 68" {...thin} />
    </svg>
  )
}

function HeelSqueezeProneSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head resting on hands */}
      <ellipse cx="85" cy="60" rx="4.5" ry="4" {...body} />
      {/* Hands under forehead */}
      <path d="M88 62 L92 64 L96 64" {...thin} />
      {/* Prone body */}
      <path d="M81 62 Q72 64 62 66 Q52 67 42 67" {...body} />
      {/* Legs slightly lifted with heels squeezed */}
      <path d="M42 67 L32 66 L24 64" {...body} />
      <path d="M42 66 L32 65 L24 62" {...body} />
      {/* Heels together */}
      <path d="M24 64 L22 62 L24 62" {...body} />
      {/* Lift indicator */}
      <path d="M30 68 L30 65" {...thin} opacity={0.3} />
    </svg>
  )
}

function OneLegKickPrepSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head upright */}
      <ellipse cx="88" cy="38" rx="4.5" ry="4" {...body} />
      {/* Propped on forearms, torso lifted */}
      <path d="M85 42 Q80 48 75 54 Q70 60 62 66" {...body} />
      {/* Forearms on mat */}
      <path d="M82 44 Q86 50 90 56 L92 62 L92 68" {...body} />
      <path d="M80 46 Q84 52 88 58 L90 64 L90 68" {...thin} opacity={0.6} />
      {/* Back leg straight */}
      <path d="M62 66 L50 67 L38 67" {...body} />
      {/* Kicking leg - lower leg bent toward glute */}
      <path d="M62 65 L52 64 L46 62" {...body} />
      <path d="M46 62 L44 54 L46 48" {...body} />
      {/* Foot */}
      <path d="M46 48 L48 46" {...body} />
    </svg>
  )
}

function BreastStrokeSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head lifted high - full extension */}
      <ellipse cx="78" cy="38" rx="4.5" ry="4" {...body} />
      {/* Full back extension from prone */}
      <path d="M75 42 Q68 48 60 56 Q52 62 42 66 Q35 67 28 67" {...body} />
      {/* Arms sweeping back alongside body */}
      <path d="M76 42 L82 48 L90 56 L96 62" {...body} />
      <path d="M74 44 L80 50 L88 58 L94 64" {...thin} opacity={0.6} />
      {/* Legs */}
      <path d="M28 67 L20 67" {...body} />
      <path d="M28 66 L20 66" {...body} />
    </svg>
  )
}

function SawSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head - rotated and reaching forward */}
      <ellipse cx="78" cy="32" rx="5" ry="4" {...body} />
      {/* Torso rotated and reaching past opposite foot */}
      <path d="M74 34 Q66 40 58 48 Q52 54 50 58" {...body} />
      {/* Front arm reaching past opposite foot */}
      <path d="M76 30 L84 30 L94 32" {...body} />
      {/* Back arm reaching behind */}
      <path d="M72 36 L64 34 L56 30" {...thin} />
      {/* Legs wide in V */}
      <path d="M50 62 Q56 64 66 66 Q76 67 88 68" {...body} />
      <path d="M50 62 Q46 64 38 66 Q30 67 20 68" {...body} />
      {/* Feet */}
      <path d="M88 68 L92 66" {...body} />
      <path d="M20 68 L16 66" {...body} />
    </svg>
  )
}

function NeckPullPrepSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head with hands behind */}
      <ellipse cx="62" cy="28" rx="5" ry="4.5" {...body} />
      {/* Hands behind head */}
      <path d="M64 24 Q66 22 64 26" {...thin} />
      <path d="M60 24 Q58 22 60 26" {...thin} />
      {/* C-curve rolling down */}
      <path d="M60 32 Q56 40 54 48 Q52 56 52 62" {...body} />
      {/* Legs extended */}
      <path d="M52 64 Q60 66 72 66 Q82 67 92 67" {...body} />
      <path d="M52 66 Q60 68 72 68 Q82 68 92 68" {...body} />
      {/* Feet */}
      <path d="M92 67 L95 65" {...body} />
    </svg>
  )
}

function ObliquesRollBackSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head - rotated and leaned back */}
      <ellipse cx="60" cy="24" rx="5" ry="4.5" {...body} transform="rotate(-25 60 24)" />
      {/* Oblique C-curve, torso rotated and leaned back */}
      <path d="M58 28 Q56 36 54 44 Q52 52 52 60" {...body} />
      {/* Rotation emphasis */}
      <path d="M60 30 Q62 32 60 34" {...thin} opacity={0.4} />
      {/* Arms - one reaching forward, one back */}
      <path d="M60 26 L68 24 L76 24" {...body} />
      <path d="M56 30 L50 28 L44 24" {...thin} />
      {/* Bent knees */}
      <path d="M52 64 Q58 60 64 58 Q70 58 74 62" {...body} />
      <path d="M74 62 L76 66 L78 68" {...body} />
      <line x1="78" y1="68" x2="82" y2="68" {...body} />
    </svg>
  )
}

function SideKickSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Side-lying - head */}
      <ellipse cx="92" cy="58" rx="5" ry="4.5" {...body} />
      {/* Hand supporting head */}
      <path d="M92 54 L90 48 L88 44" {...thin} />
      {/* Torso side-lying */}
      <path d="M88 60 Q80 62 70 64 Q62 65 55 65" {...body} />
      {/* Bottom leg */}
      <path d="M55 66 L42 67 L30 67" {...body} />
      {/* Top leg kicking forward */}
      <path d="M55 64 L65 56 L78 48 L90 42" {...body} />
      {/* Front hand on mat */}
      <path d="M78 62 L80 66 L80 68" {...thin} />
    </svg>
  )
}

function SideLegLiftSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Side-lying - head */}
      <ellipse cx="90" cy="50" rx="5" ry="4.5" {...body} />
      {/* Hand supporting head */}
      <path d="M90 46 L88 40 L86 36" {...thin} />
      {/* Torso side-lying, slightly lifted */}
      <path d="M86 52 Q78 54 68 56 Q60 58 52 58" {...body} />
      {/* Both legs lifted together off mat */}
      <path d="M52 58 L40 56 L28 54" {...body} />
      <path d="M52 57 L40 54 L28 52" {...body} />
      {/* Front arm on mat */}
      <path d="M76 56 L78 62 L78 68" {...thin} />
      {/* Space between legs and mat */}
      <path d="M35 68 L35 56" {...thin} opacity={0.2} strokeDasharray="1 2" />
    </svg>
  )
}

function TeaserPrepSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head */}
      <ellipse cx="62" cy="20" rx="5" ry="4.5" {...body} />
      {/* V-sit torso */}
      <path d="M60 24 Q58 32 56 40 Q54 48 54 56" {...body} />
      {/* Arms reaching parallel to legs */}
      <path d="M60 22 L72 28 L82 34" {...body} />
      <path d="M58 24 L70 30 L80 36" {...thin} opacity={0.6} />
      {/* Legs extended at ~45° */}
      <path d="M54 60 L62 54 L74 46 L84 40" {...body} />
      <path d="M54 62 L62 56 L74 48 L84 42" {...body} />
    </svg>
  )
}

function SingleLegExtensionSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head on mat */}
      <ellipse cx="92" cy="62" rx="5" ry="4.5" {...body} />
      {/* Torso supine */}
      <path d="M87 62 Q78 64 65 66 Q55 66 48 65" {...body} />
      {/* Arms at sides */}
      <path d="M80 65 L82 68" {...thin} />
      <path d="M60 66 L58 68" {...thin} />
      {/* One leg to ceiling */}
      <path d="M48 65 L46 48 L44 28" {...body} />
      {/* Other leg lowered at 45° */}
      <path d="M48 66 L40 60 L30 52" {...body} />
    </svg>
  )
}

/* ─── Layer 3 (36–43) ─────────────────────────────────────────────── */

function SwanDivePrepSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head lifted high */}
      <ellipse cx="82" cy="32" rx="4.5" ry="4" {...body} />
      {/* Full back extension from prone */}
      <path d="M78 35 Q72 42 64 52 Q56 60 46 65 Q38 67 28 67" {...body} />
      {/* Arms alongside body */}
      <path d="M76 38 Q74 46 70 54 L68 60" {...body} />
      <path d="M80 36 Q78 44 74 52 L72 58" {...thin} opacity={0.6} />
      {/* Legs */}
      <path d="M28 67 L20 67" {...body} />
      <path d="M28 66 L20 66" {...body} />
    </svg>
  )
}

function SwimmingPrepSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head lifted */}
      <ellipse cx="72" cy="50" rx="4.5" ry="4" {...body} />
      {/* Prone torso, slight lift */}
      <path d="M68 52 Q60 56 52 60 Q44 64 36 66" {...body} />
      {/* Opposite arm lifted (right arm forward) */}
      <path d="M72 48 L80 42 L90 36" {...body} />
      {/* Other arm down */}
      <path d="M66 54 L62 60 L60 66" {...thin} opacity={0.5} />
      {/* Opposite leg lifted (left leg) */}
      <path d="M36 66 L28 62 L20 56" {...body} />
      {/* Other leg on mat */}
      <path d="M36 65 L28 66 L20 67" {...thin} opacity={0.5} />
    </svg>
  )
}

function LegPullFrontPrepSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Front plank position */}
      {/* Head */}
      <ellipse cx="88" cy="38" rx="4.5" ry="4" {...body} />
      {/* Straight body - plank */}
      <path d="M84 40 Q74 42 64 44 Q54 46 44 48 Q36 50 28 52" {...body} />
      {/* Arms straight down */}
      <path d="M86 42 L88 52 L88 68" {...body} />
      <path d="M84 42 L84 52 L84 68" {...thin} opacity={0.6} />
      {/* Legs */}
      <path d="M28 52 L22 58 L18 64 L16 68" {...body} />
      <path d="M28 54 L24 60 L20 66 L18 68" {...thin} opacity={0.6} />
      {/* Toes */}
      <path d="M16 68 L14 66" {...body} />
    </svg>
  )
}

function SealSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Balanced on sit bones, similar to rolling ball but feet together */}
      {/* Head */}
      <ellipse cx="66" cy="26" rx="5" ry="4.5" {...body} />
      {/* Rounded spine */}
      <path d="M64 30 Q60 38 56 46 Q54 52 55 58" {...body} />
      {/* Soles of feet together, knees open */}
      <path d="M55 58 Q58 54 64 50 Q68 52 72 58" {...body} />
      <path d="M55 58 Q58 62 64 64 Q68 62 72 58" {...body} />
      {/* Feet together at bottom */}
      <path d="M64 64 L64 66" {...body} />
      {/* Hands wrapped around ankles */}
      <path d="M64 30 Q62 36 60 44 Q58 50 58 56" {...thin} />
      <path d="M66 30 Q66 36 66 44 Q68 50 68 56" {...thin} />
    </svg>
  )
}

function SideBendPrepSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Side plank on forearm */}
      {/* Head */}
      <ellipse cx="58" cy="18" rx="4.5" ry="4" {...body} />
      {/* Torso - side plank */}
      <path d="M56 22 Q54 30 52 40 Q50 50 48 58" {...body} />
      {/* Top arm reaching over head */}
      <path d="M56 24 L62 18 L70 14" {...body} />
      {/* Forearm on mat */}
      <path d="M48 58 Q50 62 54 66 L58 68" {...body} />
      {/* Elbow on mat */}
      <circle cx="58" cy="68" r="1" fill="currentColor" />
      {/* Legs stacked */}
      <path d="M48 58 L40 62 L30 66 L22 68" {...body} />
      <path d="M48 60 L40 64 L30 68 L24 68" {...body} />
    </svg>
  )
}

function PushUpPrepSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Bottom of push-up - body close to ground */}
      {/* Head */}
      <ellipse cx="90" cy="50" rx="4.5" ry="4" {...body} />
      {/* Body parallel to ground, lower */}
      <path d="M86 52 Q76 54 66 56 Q56 58 46 60 Q38 62 30 63" {...body} />
      {/* Bent arms */}
      <path d="M88 54 Q90 58 92 62 L92 68" {...body} />
      <path d="M86 54 Q86 58 86 62 L86 68" {...thin} opacity={0.6} />
      {/* Elbow angle */}
      <path d="M90 58 Q88 56 86 58" {...thin} opacity={0.3} />
      {/* Legs */}
      <path d="M30 63 L24 66 L18 68" {...body} />
      <path d="M30 64 L24 67 L20 68" {...thin} opacity={0.6} />
      {/* Toes */}
      <path d="M18 68 L16 66" {...body} />
    </svg>
  )
}

function SpineStretchForwardSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head - deeply curled forward */}
      <ellipse cx="68" cy="30" rx="5" ry="4.5" {...body} />
      {/* C-curve torso curled forward */}
      <path d="M66 34 Q62 40 58 48 Q54 54 52 60" {...body} />
      {/* Arms reaching past toes */}
      <path d="M68 28 L78 26 L90 26" {...body} />
      <path d="M66 30 L76 28 L88 28" {...thin} opacity={0.6} />
      {/* Legs extended */}
      <path d="M52 62 Q60 64 70 66 Q80 67 92 67" {...body} />
      <path d="M52 64 Q60 66 70 68 Q80 68 92 68" {...body} />
      {/* Feet */}
      <path d="M92 67 L95 65" {...body} />
    </svg>
  )
}

function SpineTwistAdvancedSVG() {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Mat />
      {/* Head - deeply rotated */}
      <ellipse cx="50" cy="16" rx="5" ry="4.5" {...body} />
      {/* Upright torso with deep rotation */}
      <path d="M50 20 Q50 28 50 38 Q50 48 52 58" {...body} />
      {/* Arms in T - deeper rotation than Layer 1 */}
      <path d="M50 32 L36 26 L22 22" {...body} />
      <path d="M50 32 L58 38 L68 46" {...body} />
      {/* Deep rotation indicator */}
      <path d="M52 34 Q56 30 54 26" {...thin} opacity={0.4} />
      <path d="M54 36 Q58 32 56 28" {...thin} opacity={0.2} />
      {/* Legs extended */}
      <path d="M52 62 Q60 64 72 66 Q82 67 94 67" {...body} />
      <path d="M52 64 Q60 66 72 68 Q82 68 94 68" {...body} />
      {/* Feet */}
      <path d="M94 67 L97 65" {...body} />
    </svg>
  )
}

/* ─── Name → Component map ────────────────────────────────────────── */

const SVG_MAP: Record<string, () => React.JSX.Element> = {
  // Warm-Up
  'Breathing': BreathingSVG,
  'Breathing Awareness': BreathingSVG,
  'Breathing + Activation': BreathingSVG,
  'Imprint & Release': ImprintReleaseSVG,
  'Hip Release': HipReleaseSVG,
  'Spinal Rotation': SpinalRotationSVG,
  'Spinal Rotation Supine': SpinalRotationSupineSVG,
  'Cat Stretch': CatStretchSVG,
  'Hip Rolls': HipRollsSVG,
  'Scapula Isolation': ScapulaIsolationSVG,
  'Arm Circles': ArmCirclesSVG,
  'Head Nods': HeadNodsSVG,
  'Elevation & Depression of Scapulae': ElevationDepressionSVG,

  // Layer 1
  'Ab Prep': AbPrepSVG,
  'Breast Stroke Preps 1–3': BreastStrokePrepsSVG,
  'Breast Stroke Prep 1': BreastStrokePrepsSVG,
  'Breast Stroke Prep 2': BreastStrokePrepsSVG,
  'Breast Stroke Prep 3': BreastStrokePrepsSVG,
  'Shell Stretch': ShellStretchSVG,
  'Hundred': HundredSVG,
  'Half Roll Back': HalfRollBackSVG,
  'Roll Up': RollUpSVG,
  'One Leg Circle': OneLegCircleSVG,
  'Spine Twist': SpineTwistSVG,
  'Rolling Like a Ball': RollingBallSVG,
  'Single Leg Stretch': SingleLegStretchSVG,
  'Obliques': ObliquesSVG,

  // Layer 2
  'Double Leg Stretch': DoubleLegStretchSVG,
  'Scissors': ScissorsSVG,
  'Shoulder Bridge Prep': ShoulderBridgePrepSVG,
  'Roll Over Prep': RollOverPrepSVG,
  'Heel Squeeze Prone': HeelSqueezeProneSVG,
  'One Leg Kick Prep': OneLegKickPrepSVG,
  'Breast Stroke': BreastStrokeSVG,
  'Saw': SawSVG,
  'Neck Pull Prep': NeckPullPrepSVG,
  'Obliques Roll Back': ObliquesRollBackSVG,
  'Side Kick': SideKickSVG,
  'Side Leg Lift Series 1–5': SideLegLiftSVG,
  'Teaser Prep': TeaserPrepSVG,
  'Single Leg Extension': SingleLegExtensionSVG,

  // Layer 3
  'Swan Dive Prep': SwanDivePrepSVG,
  'Swimming Prep': SwimmingPrepSVG,
  'Leg Pull Front Prep': LegPullFrontPrepSVG,
  'Seal': SealSVG,
  'Side Bend Prep': SideBendPrepSVG,
  'Push Up Prep': PushUpPrepSVG,
  'Spine Stretch Forward': SpineStretchForwardSVG,
  'Spine Twist (advanced)': SpineTwistAdvancedSVG,
}

/* ─── Public component ────────────────────────────────────────────── */

export default function ExerciseSVG({ name, className }: { name: string; className?: string }) {
  const SvgComponent = SVG_MAP[name]

  if (!SvgComponent) {
    // Fallback: generic placeholder
    return (
      <div className={className}>
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="40" r="15" stroke="currentColor" strokeWidth={1} opacity={0.2} />
          <line x1="50" y1="40" x2="70" y2="40" stroke="currentColor" strokeWidth={0.5} opacity={0.15} />
          <line x1="60" y1="30" x2="60" y2="50" stroke="currentColor" strokeWidth={0.5} opacity={0.15} />
        </svg>
      </div>
    )
  }

  return (
    <div className={className}>
      <SvgComponent />
    </div>
  )
}

export { SVG_MAP }
