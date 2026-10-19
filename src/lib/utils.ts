import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const rtf = new Intl.RelativeTimeFormat("fa", { numeric: "always" })

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (!(d instanceof Date) || isNaN(d.getTime())) return ""
  const diffMs = d.getTime() - Date.now()
  const diffSec = Math.round(diffMs / 1000)
  const abs = Math.abs(diffSec)
  if (abs < 60) return "همین حالا"
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour")
  if (abs < 2592000) return rtf.format(Math.round(diffSec / 86400), "day")
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" }).format(d)
}

export function faTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (!(d instanceof Date) || isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(d)
}

export function faDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (!(d instanceof Date) || isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long" }).format(d)
}

export function greetingByHour(): { text: string; emoji: string } {
  const h = new Date().getHours()
  if (h < 5) return { text: "شب بخیر", emoji: "🌙" }
  if (h < 12) return { text: "صبح بخیر", emoji: "🌅" }
  if (h < 17) return { text: "ظهر بخیر", emoji: "☀️" }
  if (h < 21) return { text: "عصر بخیر", emoji: "🌆" }
  return { text: "شب بخیر", emoji: "🌙" }
}
