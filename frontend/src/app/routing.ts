import type { View } from '../types'

const viewPaths: Record<View, string> = {
  dashboard: '/',
  schedule: '/schedule',
  tasks: '/tasks',
  finance: '/finance',
  social: '/social',
  assistant: '/assistant',
  profile: '/profile',
  insights: '/insights',
  habits: '/habits',
}

const pathViews = Object.fromEntries(
  Object.entries(viewPaths).map(([view, path]) => [path, view]),
) as Record<string, View>

export function viewFromPath(pathname: string): View {
  return pathViews[pathname.replace(/\/$/, '') || '/'] ?? 'dashboard'
}

export function pathForView(view: View) {
  return viewPaths[view]
}

export function navigateToView(view: View, replace = false) {
  const nextPath = pathForView(view)
  if (window.location.pathname !== nextPath) {
    window.history[replace ? 'replaceState' : 'pushState']({ view }, '', nextPath)
  }
  window.dispatchEvent(new PopStateEvent('popstate'))
}
