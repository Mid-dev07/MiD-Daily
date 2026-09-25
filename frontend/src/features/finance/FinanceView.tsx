import { useMemo, useState } from 'react'
import { FinanceForm } from './components/FinanceForm'
import { WorkspaceHeader } from '../../components/ui/WorkspaceHeader'
import { FinanceBudgetForm } from './components/FinanceBudgetForm'
import { isInFinancePeriod, type FinancePeriod } from './finance.date'
import type { FinanceBudget, FinanceBudgetDraft, FinanceEntry, FinanceEntryType } from '../../types'
import { currency, formatDate } from '../../lib/format'

interface FinanceViewProps {
  finance: FinanceEntry[]
  budgets: FinanceBudget[]
  onSaveFinance: (draft: import('../../types').FinanceDraft, editingId?: number) => string | null | Promise<string | null>
  onDeleteFinance: (id: number) => void
  onSaveBudget: (draft: FinanceBudgetDraft, editingId?: number) => string | null | Promise<string | null>
  onDeleteBudget: (id: number) => void
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

function budgetSpent(budget: FinanceBudget, finance: FinanceEntry[]) {
  const period = budget.period === 'WEEK' ? 'week' : 'month'
  return finance
    .filter((entry) => entry.type === 'expense' && isInFinancePeriod(entry.date, period))
    .filter((entry) => !budget.category || entry.category.toLowerCase() === budget.category.toLowerCase())
    .reduce((sum, entry) => sum + entry.amount, 0)
}

export function FinanceView({ finance, budgets, onSaveFinance, onDeleteFinance, onSaveBudget, onDeleteBudget }: FinanceViewProps) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'ALL' | FinanceEntryType>('ALL')
  const [category, setCategory] = useState('ALL')
  const [period, setPeriod] = useState<FinancePeriod>('month')
  const [formOpen, setFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<FinanceEntry>()
  const [budgetFormOpen, setBudgetFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<FinanceBudget>()

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

  const activeBudgets = useMemo(() => {
    const today = new Intl.DateTimeFormat('sv-SE').format(new Date())
    return budgets
      .filter((budget) => budget.startsOn <= today && (!budget.endsOn || budget.endsOn >= today))
      .sort((a, b) => a.period.localeCompare(b.period) || a.name.localeCompare(b.name))
  }, [budgets])

  const openCreate = () => { setEditingEntry(undefined); setFormOpen(true) }
  const openEdit = (entry: FinanceEntry) => { setEditingEntry(entry); setFormOpen(true) }
  const openBudgetCreate = () => { setEditingBudget(undefined); setBudgetFormOpen(true) }
  const openBudgetEdit = (budget: FinanceBudget) => { setEditingBudget(budget); setBudgetFormOpen(true) }

  const remove = (id: number) => {
    const entry = finance.find((item) => item.id === id)
    if (!entry || !window.confirm('Delete “' + entry.title + '”?')) return
    onDeleteFinance(id)
  }

  const removeBudget = (id: number) => {
    const budget = budgets.find((item) => item.id === id)
    if (!budget || !window.confirm('Delete budget “' + budget.name + '”?')) return
    onDeleteBudget(id)
  }

  return (
    <section className="workspace page-enter">
      <WorkspaceHeader
        index="004"
        kicker="MONEY"
        title="Finance"
        description="Track real spending freely, then layer weekly or monthly budgets on top."
        action={<button className="primary-button" type="button" onClick={openCreate}>Add transaction</button>}
      />

      <div className="finance-toolbar workspace-toolbar-surface content-card">
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

      <div className="stat-row workspace-metrics workspace-metrics--three">
        <article className="stat-card workspace-metric"><span>Income</span><strong className="amount-positive">{currency.format(income)}</strong><small>selected period</small></article>
        <article className="stat-card workspace-metric"><span>Expense</span><strong className="amount-negative">{currency.format(expense)}</strong><small>selected period</small></article>
        <article className="stat-card workspace-metric"><span>Balance</span><strong>{currency.format(income - expense)}</strong><small>period net</small></article>
      </div>

      <section className="content-card finance-budget-card">
        <div className="card-heading">
          <div><span className="section-kicker">Planning</span><h3>Budgets</h3></div>
          <button className="text-button" type="button" onClick={openBudgetCreate}>Add budget</button>
        </div>

        {activeBudgets.length === 0 ? (
          <div className="empty-state">
            <strong>No active budgets.</strong>
            <span>Transactions stay unrestricted until you choose to set a weekly or monthly target.</span>
          </div>
        ) : (
          <div className="finance-budget-list">
            {activeBudgets.map((budget) => {
              const spent = budgetSpent(budget, finance)
              const percent = Math.round((spent / budget.amount) * 100)
              return (
                <article className={percent > 100 ? 'finance-budget-row is-over' : 'finance-budget-row'} key={budget.id}>
                  <div className="finance-budget-copy">
                    <strong>{budget.name}</strong>
                    <span>{budget.category || 'All expenses'} · {budget.period === 'WEEK' ? 'weekly' : 'monthly'}</span>
                  </div>
                  <div className="finance-budget-meter" aria-label={percent + '% of budget used'}>
                    <span style={{ width: Math.min(100, percent) + '%' }} />
                  </div>
                  <div className="finance-budget-amounts">
                    <strong>{currency.format(spent)} / {currency.format(budget.amount)}</strong>
                    <small>{percent}% used</small>
                  </div>
                  <div className="finance-row-actions">
                    <button className="text-button" type="button" onClick={() => openBudgetEdit(budget)}>Edit</button>
                    <button className="text-button danger" type="button" onClick={() => removeBudget(budget.id)}>Delete</button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

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
      <FinanceBudgetForm open={budgetFormOpen} initialBudget={editingBudget} defaultDate={new Intl.DateTimeFormat('sv-SE').format(new Date())} onClose={() => setBudgetFormOpen(false)} onSubmit={onSaveBudget} />
    </section>
  )
}
