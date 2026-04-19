import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function bestEffort<T>(promise: Promise<T>): Promise<T | null> {
  const [result] = await Promise.allSettled([promise])
  return result.status === 'fulfilled' ? result.value : null
}
