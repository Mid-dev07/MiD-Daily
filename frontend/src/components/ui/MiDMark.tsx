import type { SVGProps } from 'react'

interface MiDMarkProps extends SVGProps<SVGSVGElement> {
  size?: number
  title?: string
}

export function MiDMark({ size = 32, title, ...props }: MiDMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <rect x="1" y="1" width="30" height="30" rx="10" fill="currentColor" opacity=".08" />
      <path
        d="M7 23V8l9 8 9-8v15"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 22h5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
