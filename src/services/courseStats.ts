type CourseStatsRecord = {
  views: number
  ratingSum: number
  ratingCount: number
}

export type CourseStats = {
  courses: Record<string, CourseStatsRecord>
}

const emptyStats = (): CourseStats => ({ courses: {} })

const normalizeStats = (data: unknown): CourseStats => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return emptyStats()
  const rawCourses = (data as { courses?: unknown }).courses
  if (!rawCourses || typeof rawCourses !== 'object' || Array.isArray(rawCourses)) {
    return emptyStats()
  }
  const courses: Record<string, CourseStatsRecord> = {}
  Object.entries(rawCourses as Record<string, unknown>).forEach(([key, value]) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return
    const record = value as Partial<CourseStatsRecord>
    courses[key] = {
      views: Number.isFinite(record.views) ? Number(record.views) : 0,
      ratingSum: Number.isFinite(record.ratingSum) ? Number(record.ratingSum) : 0,
      ratingCount: Number.isFinite(record.ratingCount) ? Number(record.ratingCount) : 0,
    }
  })
  return { courses }
}

const ensureCourse = (stats: CourseStats, uid: string) => {
  if (!stats.courses[uid]) {
    stats.courses[uid] = { views: 0, ratingSum: 0, ratingCount: 0 }
  }
}

const STORAGE_KEY = 'elenipad-course-stats-v1'

const loadStats = (): CourseStats => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStats()
    return normalizeStats(JSON.parse(raw))
  } catch {
    return emptyStats()
  }
}

const saveStats = (stats: CourseStats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}

export const fetchCourseStats = async (): Promise<CourseStats> => {
  return loadStats()
}

export const incrementCourseView = async (uid: string) => {
  const stats = loadStats()
  ensureCourse(stats, uid)
  stats.courses[uid].views += 1
  saveStats(stats)
}

export const submitCourseRating = async (uid: string, rating: number) => {
  const value = Math.max(1, Math.min(5, Math.round(rating)))
  const stats = loadStats()
  ensureCourse(stats, uid)
  stats.courses[uid].ratingSum += value
  stats.courses[uid].ratingCount += 1
  saveStats(stats)
}
