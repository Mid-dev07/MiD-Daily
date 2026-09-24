import type { SVGProps } from 'react'

export type MiDIconName = 'home' | 'clock' | 'check' | 'wallet' | 'pulse' | 'spark' | 'user' | 'chart' | 'habit'

const paths: Record<MiDIconName, string> = {
  home: 'M3 10.5 10 4l7 6.5v6a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1z',
  clock: 'M10 3.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 3v3.9l2.6 1.5',
  check: 'm4.5 10 3.2 3.2L15.5 5.8',
  wallet: 'M3.5 6.5h11a2 2 0 0 1 2 2v4.9a2 2 0 0 1-2 2h-11a1 1 0 0 1-1-1v-6.9a1 1 0 0 1 1-1Zm0 0 1.2-1.2h8.8a1.5 1.5 0 0 1 1.5 1.5v.2M12.5 10.2h4',
  pulse: 'M3 10h3l1.7-4 3.2 8 1.8-4H17',
  spark: 'm10 2 1.2 5.8L17 10l-5.8 1.2L10 17l-1.2-5.8L3 10l5.8-2.2L10 2Z',
  user: 'M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.5 6.5c.7-2.5 2.7-3.8 5.5-3.8s4.8 1.3 5.5 3.8',
  chart: 'M4 16V9m4 7V5m4 11v-4m4 4V3',
  habit: 'M10 16a6 6 0 1 0-6-6c0 3.3 2.7 6 6 6Zm0 0c2.8 0 5-2.2 5-5 0-2.2-1.5-4-3.5-4.7M10 4V2',
}

export function MiDIcon({ name, size = 18, strokeWidth = 1.7, ...props }: { name: MiDIconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={props['aria-label'] ? undefined : true}
      focusable="false"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  )
}
