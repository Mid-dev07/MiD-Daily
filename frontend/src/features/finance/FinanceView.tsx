import { useMemo, useState } from 'react'
import { FinanceForm } from './components/FinanceForm'
import type { FinanceDraft, FinanceEntry, FinanceEntryType } from '../../types'
import { currency, formatDate } from '../../lib/format'

interface FinanceViewProps {
  finance: FinanceEntry[]
  onSaveFinance: (draft: FinanceDraft, editingId?: number) => string | null
  onDeleteFinance: (id: number) => void
}

const typeOptions: Array<{ value: 'ALL' | FinanceEntryType; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'expense', label: 'Expenses' },
  { value: 'income', label: 'Income' },
]

export function FinanceView({ finance, onSaveFinance, onDeleteFinance }: FinanceViewProps) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'ALL' | FinanceEntryType>('ALL')
  const [category, setCategory] = useState('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<FinanceEntry>()

  const categories = useMemo(() => ['ALL', ...Array.from(new Set(finance.map((entry) => entry.category).filter(Boolean))).sort()], [finance])
  const filtered = useMemo(() => finance
    .filter((entry) => {
      const q = query.toLowerCase()
      return (!q || entry.title.toLowerCase().includes(q) || entry.category.toLowerCase().includes(q))
        && (type === 'ALL' || entry.type === type)
        && (category === 'ALL' || entry.category === category)
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), [finance, query, type, category])

  const income = finance.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0)
  const expense = finance.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0)

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
        <div><span className="section-kicker">FINANCE</span><h2>Money, made visible.</h2><p>Track income and expenses by date and category before the real database layer is connected.</p></div>
        <button className="primary-button" type="button" onClick={openCreate}>+ Add transaction</button>
      </div>

      <div className="stat-row">
        <article className="stat-card"><span>Income</span><strong className="amount-positive">{currency.format(income)}</strong><small>all recorded income</small></article>
        <article className="stat-card"><span>Expense</span><strong className="amount-negative">{currency.format(expense)}</strong><small>all recorded expenses</small></article>
        <article className="stat-card"><span>Balance</span><strong>{currency.format(income - expense)}</strong><small>income minus expense</small></article>
      </div>

      <div className="finance-toolbar content-card">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or category" aria-label="Search transactions" />
        <div className="filter-row">
          {typeOptions.map((option) => <button key={option.value} className={type === option.value ? 'filter-button is-active' : 'filter-button'} type="button" onClick={() => setType(option.value)}>{option.label}</button>)}
        </div>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
          {categories.map((value) => <option key={value} value={value}>{value === 'ALL' ? 'All categories' : value}</option>)}
        </select>
      </div>

      <div className="content-card module-list">
        {filtered.length === 0 ? (
          <div className="empty-state"><strong>No matching transactions</strong><span>Adjust the filters or create a new transaction.</span></div>
        ) : filtered.map((entry) => (
          <article className="finance-row" key={entry.id}>
            <div className="module-main">
              <strong>{entry.title}</strong>
              <span>{entry.category} · {formatDate(entry.date)}{entry.notes ? ' · ' + entry.notes : ''}</span>
            </div>
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
