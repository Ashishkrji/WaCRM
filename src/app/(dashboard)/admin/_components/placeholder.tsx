"use client"

import { FileText, Key, Code2 } from "lucide-react"

export default function PlaceholderPage({ title, desc, icon: Icon }: { title: string, desc: string, icon: any }) {
  return (
    <div className="p-6 h-[calc(100vh-2rem)] flex flex-col items-center justify-center text-center">
      <div className="rounded-full bg-slate-900 p-6 mb-6">
        <Icon className="h-16 w-16 text-slate-600" />
      </div>
      <h1 className="text-2xl font-bold text-slate-200 mb-2">{title}</h1>
      <p className="text-slate-500 max-w-md">{desc}</p>
      <button className="mt-8 rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700">Coming in next update</button>
    </div>
  )
}
