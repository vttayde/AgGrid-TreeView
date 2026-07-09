import React from 'react'

export default function MetricCard({ label, value, valueClass = 'text-slate-900' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  )
}
