import type { CSSProperties } from 'react'
import type { FinanceEntry } from '../../types'
import { currency } from '../../lib/format'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatCard } from '../../components/ui/StatCard'

interface FinanceViewProps { finance: FinanceEntry[] }

export function FinanceView({ finance }: FinanceViewProps) {
  const income = finance.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0)
  const expense = finance.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0)

  return (
    <section className="workspace page-enter" key="finance">
      <div className="page-intro">
        <span className="section-kicker">MODULE</span>
        <h2>Finance</h2>
        <p>Keep income and expenses visible before connecting a real database.</p>
      </div>
      <div className="finance-layout">
        <StatCard label="Income" value={currency.format(income)} helper="tracked locally" />
        <StatCard label="Expense" value={currency.format(expense)} helper="tracked locally" />
        <div className="content-card module-list finance-list motion-card">
          {finance.length === 0 && <EmptyState title="No finance entries" description="Add finance persistence when the database layer is introduced." />}
          {finance.map((entry, index) => (
            <div className="module-row list-reveal" style={{ '--item-index': index } as CSSProperties} key={entry.id}>
              <div className="module-main"><strong>{entry.title}</strong><span>{entry.type}</span></div>
              <strong className={entry.type === 'income' ? 'amount-positive' : 'amount-negative'}>{entry.type === 'income' ? '+' : '-'}{currency.format(entry.amount)}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
