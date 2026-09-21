import { useMemo, useState } from 'react'
import { FinanceForm } from './components/FinanceForm'
import { isInFinancePeriod, type FinancePeriod } from './finance.date'
import type { FinanceDraft, FinanceEntry, FinanceEntryType } from '../../types'
import { currency, formatDate } from '../../lib/format'

interface FinanceViewProps {
  finance: FinanceEntry[]
  onSaveFinance: (draft: FinanceDraft, editingId?: number) => string | null | Promise<string | null>
  onDeleteFinance: (id: number) => void
}

const typeOptions: Array<{ value: 'ALL' | FinanceEntryType; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'expense', label: 'Expenses' },
  { value: 'income', label: 'Income' },
]

const periodOptions: Array<{ value: FinancePeriod; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All time' },
]

export function FinanceView({ finance, onSaveFinance, onDeleteFinance }: FinanceViewProps) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'ALL' | FinanceEntryType>('ALL')
  const [category, setCategory] = useState('ALL')
  const [period, setPeriod] = useState<FinancePeriod>('month')
  const [formOpen, setFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<FinanceEntry>()

  const categories = useMemo(() => ['ALL', ...Array.from(new Set(finance.map((entry) => entry.category).filter(Boolean))).sort()], [finance])
  const periodFinance = useMemo(() => finance.filter((entry) => isInFinancePeriod(entry.date, period)), [finance, period])
  const filtered = useMemo(() => periodFinance
    .filter((entry) => {
      const q = query.trim().toLowerCase()
      return (!q || entry.title.toLowerCase().includes(q) || entry.category.toLowerCase().includes(q))
        && (type === 'ALL' || entry.type === type)
        && (category === 'ALL' || entry.category === category)
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), [periodFinance, query, type, category])

  const income = periodFinance.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0)
  const expense = periodFinance.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0)

  const expenseByCategory = useMemo(() => {
    const totals = new Map<string, number>()
    for (const entry of periodFinance) {
      if (entry.type !== 'expense') continue
      totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount)
    }
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [periodFinance])

  const openCreate = () => { setEditingEntry(undefined); setFormOpen(true) }
  const openEdit = (entry: FinanceEntry) => { setEditingEntry(entry); setFormOpen(true) }

  const remove = (id: number) => {
    const entry = finance.find((item) => item.id === id)
    if (!entry || !window.confirm('Delete “' + entry.title + '”?')) return
    onDeleteFinance(id)
  }

  return (
    <section className="workspace page-enter">
      <div className="page-intro">
        <div>
          <h2>Finance</h2>
          <p>See income, spending, and balance for the period you choose.</p>
        </div>
        <button className="primary-button" type="button" onClick={openCreate}>Add transaction</button>
      </div>

      <div className="finance-toolbar content-card">
        <div className="finance-toolbar-periods filter-row">
          {periodOptions.map((option) => (
            <button key={option.value} className={period === option.value ? 'filter-button is-active' : 'filter-button'} type="button" onClick={() => setPeriod(option.value)}>
              {option.label}
            </button>
          ))}
        </div>
        <div className="finance-toolbar-controls">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transactions" aria-label="Search transactions" />
          <div className="filter-row">
            {typeOptions.map((option) => (
              <button key={option.value} className={type === option.value ? 'filter-button is-active' : 'filter-button'} type="button" onClick={() => setType(option.value)}>
                {option.label}
              </button>
            ))}
          </div>
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
            {categories.map((value) => <option key={value} value={value}>{value === 'ALL' ? 'All categories' : value}</option>)}
          </select>
        </div>
      </div>

      <div className="stat-row">
        <article className="stat-card"><span>Income</span><strong className="amount-positive">{currency.format(income)}</strong><small>selected period</small></article>
        <article className="stat-card"><span>Expense</span><strong className="amount-negative">{currency.format(expense)}</strong><small>selected period</small></article>
        <article className="stat-card"><span>Balance</span><strong>{currency.format(income - expense)}</strong><small>period net</small></article>
      </div>

      <section className="content-card finance-insights">
        <div className="card-heading">
          <div><span className="section-kicker">Breakdown</span><h3>Top expenses</h3></div>
          <span className="card-meta">{expenseByCategory.length} categories</span>
        </div>
        {expenseByCategory.length === 0 ? (
          <div className="empty-state"><strong>No expenses in this period.</strong><span>Add an expense to see the breakdown.</span></div>
        ) : expenseByCategory.map(([name, amount]) => (
          <div className="finance-breakdown-row" key={name}>
            <span>{name}</span>
            <div className="finance-breakdown-track" aria-hidden="true"><span style={{ width: expense ? Math.min(100, (amount / expense) * 100) + '%' : '0%' }} /></div>
            <strong>{currency.format(amount)}</strong>
          </div>
        ))}
      </section>

      <div className="content-card module-list">
        {filtered.length === 0 ? (
          <div className="empty-state"><strong>No matching transactions.</strong><span>Adjust the filters or add a transaction.</span></div>
        ) : filtered.map((entry) => (
          <article className="finance-row" key={entry.id}>
            <div className="module-main"><strong>{entry.title}</strong><span>{entry.category} · {formatDate(entry.date)}{entry.notes ? ' · ' + entry.notes : ''}</span></div>
            <strong className={entry.type === 'income' ? 'amount-positive' : 'amount-negative'}>{entry.type === 'income' ? '+' : '-'}{currency.format(entry.amount)}</strong>
            <div className="finance-row-actions">
              <button className="text-button" type="button" onClick={() => openEdit(entry)}>Edit</button>
              <button className="text-button danger" type="button" onClick={() => remove(entry.id)}>Delete</button>
            </div>
          </article>
        ))}
      </div>

      <FinanceForm open={formOpen} initialEntry={editingEntry} defaultDate={new Intl.DateTimeFormat('sv-SE').format(new Date())} onClose={() => setFormOpen(false)} onSubmit={onSaveFinance} />
    </section>
  )
}
