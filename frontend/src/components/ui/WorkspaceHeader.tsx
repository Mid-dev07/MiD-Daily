import type { ReactNode } from 'react'

interface WorkspaceHeaderProps {
  index: string
  kicker: string
  title: string
  description: string
  action?: ReactNode
}

export function WorkspaceHeader({ index, kicker, title, description, action }: WorkspaceHeaderProps) {
  return (
    <header className="workspace-header" data-spatial-role="orientation">
      <div className="workspace-header-main">
        <div className="workspace-header-code" aria-hidden="true">
          <span>{index}</span>
          <i>/</i>
          <strong>{kicker}</strong>
          <em>LIVE WORKSPACE</em>
        </div>
        <span className="section-kicker">{kicker}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action && <div className="workspace-header-actions">{action}</div>}
    </header>
  )
}
