import type { FinanceEntry } from '../../types'
import { currency } from '../../lib/format'

interface FinanceViewProps { finance: FinanceEntry[] }

export function FinanceView({ finance }: FinanceViewProps) {
  const income = finance.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0)
  const expense = finance.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0)

  return (
    <section className="workspace page-enter">
      <div className="page-intro"><span className="section-kicker">MODULE</span><h2>Finance</h2><p>Keep income and expenses visible before connecting a real database.</p></div>
      <div className="stat-row">
        <article className="stat-card"><span>Income</span><strong>{currency.format(income)}</strong><small>tracked locally</small></article>
        <article className="stat-card"><span>Expense</span><strong>{currency.format(expense)}</strong><small>tracked locally</small></article>
        <article className="stat-card"><span>Balance</span><strong>{currency.format(income - expense)}</strong><small>current sample data</small></article>
      </div>
      <div className="content-card module-list">
        {finance.map((entry) => (
          <div className="module-row" key={entry.id}><div className="module-main"><strong>{entry.title}</strong><span>{entry.type}</span></div><strong className={entry.type === 'income' ? 'amount-positive' : 'amount-negative'}>{entry.type === 'income' ? '+' : '-'}{currency.format(entry.amount)}</strong></div>
        ))}
      </div>
    </section>
  )
}
