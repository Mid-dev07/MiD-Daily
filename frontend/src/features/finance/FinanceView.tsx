import { StatCard } from '../../components/ui/StatCard'
import type { FinanceEntry } from '../../types'

interface FinanceViewProps { finance: FinanceEntry[] }

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

export function FinanceView({ finance }: FinanceViewProps) {
  const income = finance.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0)
  const expense = finance.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0)

  return (
    <section className="workspace">
      <div className="page-intro">
        <span className="section-kicker">MODULE</span>
        <h2>Finance</h2>
        <p>Keep income and expenses visible before connecting a real database.</p>
      </div>

      <div className="finance-layout">
        <StatCard label="Income" value={currency.format(income)} hint="tracked locally" />
        <StatCard label="Expense" value={currency.format(expense)} hint="tracked locally" />
        <div className="content-card module-list finance-list">
          {finance.map((entry) => (
            <div className="module-row" key={entry.id}>
              <div className="module-main"><strong>{entry.title}</strong><span>{entry.type}</span></div>
              <strong className={entry.type === 'income' ? 'amount-positive' : 'amount-negative'}>{entry.type === 'income' ? '+' : '-'}{currency.format(entry.amount)}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
