import React, { useEffect, useMemo, useState } from 'react'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import SidebarTree from './components/SidebarTree'
import DataGrid from './components/DataGrid'
import MetricCard from './components/MetricCard'

const reportTree = [
  {
    id: 'transaction-reports',
    label: 'Transaction Reports',
    children: [
      {
        id: 'transaction-online',
        label: 'Online Transactions',
        children: [
          { id: 'daily-transactions', label: 'Daily Transactions' },
          { id: 'high-value-orders', label: 'High Value Orders' },
          { id: 'repeat-buyers', label: 'Repeat Buyers' }
        ]
      },
      {
        id: 'transaction-offline',
        label: 'Offline Transactions',
        children: [
          { id: 'offline-store-sales', label: 'Offline Store Sales' },
          { id: 'top-merchants', label: 'Top Merchants' },
          { id: 'pos-returns', label: 'POS Returns' }
        ]
      }
    ]
  },
  {
    id: 'trade-reports',
    label: 'Trade Reports',
    children: [
      {
        id: 'inventory-reports',
        label: 'Inventory Reports',
        children: [
          {
            id: 'stock-analytics',
            label: 'Stock Analytics',
            children: [
              { id: 'trade-inventory', label: 'Trade Inventory' },
              { id: 'supplier-performance', label: 'Supplier Performance' }
            ]
          },
          {
            id: 'category-insights',
            label: 'Category Insights',
            children: [
              { id: 'category-performance', label: 'Category Performance' },
              { id: 'sales-by-category', label: 'Sales by Category' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'finance-reports',
    label: 'Finance Reports',
    children: [
      {
        id: 'profit-reports',
        label: 'Profit Reports',
        children: [
          { id: 'profit-loss', label: 'Profit & Loss' },
          { id: 'cash-flow', label: 'Cash Flow' }
        ]
      },
      {
        id: 'balance-reports',
        label: 'Balance Reports',
        children: [
          { id: 'balance-sheet', label: 'Balance Sheet' },
          { id: 'expense-summary', label: 'Expense Summary' }
        ]
      }
    ]
  }
]

const reportDefinitions = {
  'daily-transactions': { type: 'carts', limit: 30 },
  'high-value-orders': { type: 'carts', limit: 100, filter: cart => cart.total > 500 },
  'repeat-buyers': { type: 'carts', limit: 40, filter: cart => cart.total >= 125 },
  'offline-store-sales': { type: 'carts', limit: 50, filter: cart => cart.total <= 220 },
  'top-merchants': { type: 'carts', limit: 50, filter: cart => cart.total > 250 },
  'pos-returns': { type: 'carts', limit: 40, filter: cart => cart.total < 200 },
  'trade-inventory': { type: 'products', limit: 80 },
  'supplier-performance': { type: 'categories' },
  'category-performance': { type: 'categories' },
  'sales-by-category': { type: 'categories' },
  'profit-loss': { type: 'products', limit: 50 },
  'cash-flow': { type: 'products', limit: 40 },
  'balance-sheet': { type: 'products', limit: 50 },
  'expense-summary': { type: 'products', limit: 40 }
}

function formatTransactions(carts){
  return carts.map((cart, idx) => ({
    orderId: cart.id,
    // use provided userId when distinct; otherwise provide a readable synthetic id `user1`, `user2`, etc.
    userId: (cart.userId != null && String(cart.userId) !== String(cart.id))
      ? String(cart.userId)
      : `user${idx + 1}`,
    // generate a readable username with prefix 'instantb'
    userName: cart.username || `instantb${idx + 1}`,
    // dummyjson carts don't include a date; generate a stable fallback date
    date: cart.date || new Date(Date.now() - (Number(cart.id) % 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total: cart.total,
    discountedTotal: cart.discountedTotal,
    totalProducts: cart.totalProducts,
    totalQuantity: cart.totalQuantity,
    discountPercentage: cart.total ? Math.round((cart.total - cart.discountedTotal) / cart.total * 100) : 0
  }))
}

function formatInventory(products){
  return products.map(product => ({
    id: product.id,
    title: product.title,
    category: product.category,
    brand: product.brand,
    price: product.price,
    stock: product.stock,
    rating: product.rating,
    discountPercentage: product.discountPercentage
  }))
}

async function loadCategoryPerformance(){
  const categoriesResponse = await fetch('https://dummyjson.com/products/categories')
  const categories = await categoriesResponse.json()
  const rows = []

  for(const category of categories){
    const response = await fetch(`https://dummyjson.com/products/category/${encodeURIComponent(category)}`)
    const categoryData = await response.json()
    const products = categoryData.products || []
    const averagePrice = products.length ? Math.round(products.reduce((sum, product) => sum + product.price, 0) / products.length) : 0
    const averageRating = products.length ? (products.reduce((sum, product) => sum + product.rating, 0) / products.length).toFixed(1) : 0
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0)

    rows.push({
      category,
      productCount: products.length,
      averagePrice,
      averageRating,
      totalStock
    })
  }

  return rows
}

export default function App(){
  const [selectedReport, setSelectedReport] = useState('daily-transactions')
  const [selectedReportLabel, setSelectedReportLabel] = useState('Daily Transactions')
  const [reportRows, setReportRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [summaryCollapsed, setSummaryCollapsed] = useState(true)

  const summaryMetrics = useMemo(() => {
    if(!reportRows.length) return null

    if(selectedReport === 'daily-transactions' || selectedReport === 'high-value-orders'){
      const revenue = reportRows.reduce((sum, row) => sum + (Number(row.total) || 0), 0)
      const discounted = reportRows.reduce((sum, row) => sum + (Number(row.discountedTotal) || 0), 0)
      const avgDiscount = reportRows.length ? Math.round((revenue - discounted) / reportRows.length) : 0
      return {
        rows: reportRows.length,
        revenue,
        avgDiscount
      }
    }

    if(selectedReport === 'trade-inventory'){
      const totalStock = reportRows.reduce((sum, row) => sum + (Number(row.stock) || 0), 0)
      const avgPrice = reportRows.length ? reportRows.reduce((sum, row) => sum + (Number(row.price) || 0), 0) / reportRows.length : 0
      return {
        rows: reportRows.length,
        totalStock,
        avgPrice: Math.round(avgPrice)
      }
    }

    if(selectedReport === 'category-performance'){
      const totalCategories = reportRows.length
      const avgProductCount = reportRows.length ? Math.round(reportRows.reduce((sum, row) => sum + (Number(row.productCount) || 0), 0) / reportRows.length) : 0
      return {
        rows: totalCategories,
        avgProductCount,
        overallStock: reportRows.reduce((sum, row) => sum + (Number(row.totalStock) || 0), 0)
      }
    }

    return { rows: reportRows.length }
  }, [reportRows, selectedReport])

  useEffect(()=>{
    if(!selectedReport){
      setReportRows([])
      return
    }

    const report = reportDefinitions[selectedReport]
    if(!report){
      setReportRows([])
      setError('Selected report configuration is missing.')
      return
    }

    setLoading(true)
    setError(null)

    const fetchRows = async () => {
      try {
        if(report.type === 'carts'){
          const response = await fetch(`https://dummyjson.com/carts?limit=${report.limit}`)
          const data = await response.json()
          let carts = data.carts || []
          if(report.filter){
            carts = carts.filter(report.filter)
          }
          setReportRows(formatTransactions(carts))
        } else if(report.type === 'products'){
          const response = await fetch(`https://dummyjson.com/products?limit=${report.limit}`)
          const data = await response.json()
          setReportRows(formatInventory(data.products || []))
        } else if(report.type === 'categories'){
          const rows = await loadCategoryPerformance()
          setReportRows(rows)
        } else {
          setReportRows([])
        }
      } catch(err) {
        console.error('Failed to load report rows', err)
        setReportRows([])
      } finally {
        setLoading(false)
      }
    }

    fetchRows()
  },[selectedReport])

  return (
    <div className="min-h-screen w-full bg-slate-100">
        <div className="mx-auto flex h-screen max-w-[1700px] flex-col gap-0 px-2 py-2">
          <header className="flex flex-col gap-1 rounded-[20px] border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            {/* <button
              type="button"
              onClick={() => setSidebarOpen(current => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
            >
              <MenuIcon className="h-5 w-5" />
            </button> */}
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-slate-900 truncate">Portfolio Analytics Dashboard</h1>
              <p className="mt-1 text-sm text-slate-500 truncate">Interactive AG Grid reporting with structured tree navigation.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-600">Live</span>
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-600">Connected</span>
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-600">Rows: {reportRows.length}</span>
          </div>
        </header>

        <div className="flex h-full min-h-0 overflow-hidden gap-0">
          <aside className={`${sidebarOpen ? 'w-72' : 'w-16'} flex flex-col flex-shrink-0 border-slate-200 bg-gray text-slate-100 shadow-xl transition-all duration-300 overflow-hidden`}>
            <div className="flex justify-start px-1 py-1 border-b border-slate-800">
              {/* <button
                type="button"
                onClick={() => setSidebarOpen(current => !current)}
                className="rounded-full border border-slate-700 bg-slate-900 p-1 text-slate-300 hover:bg-slate-800 transition"
                aria-label="Toggle sidebar"
              >
                <ChevronLeftIcon className={`h-4 w-4 transition ${sidebarOpen ? '' : 'rotate-180'}`} />
              </button> */}

              <button
              type="button"
              onClick={() => setSidebarOpen(current => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            
            </div>

            <div className={`flex-1 overflow-y-auto ${sidebarOpen ? 'px-3 py-3' : 'px-1 py-2'}`}>
              <SidebarTree
                tree={reportTree}
                selectedReport={selectedReport}
                collapsed={!sidebarOpen}
                onSelectReport={(reportId, reportLabel) => {
                  setSelectedReport(reportId)
                  setSelectedReportLabel(reportLabel)
                }}
              />
            </div>
          </aside>

          <main className="flex-1 flex min-h-0 flex-col overflow-hidden">
            <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Active report</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 truncate">{selectedReportLabel || 'Select a report'}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSummaryCollapsed(current => !current)}
                  className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  {summaryCollapsed ? 'Show metrics' : 'Hide metrics'}
                </button>
                <span className="rounded-full bg-slate-50 px-3 py-2 text-sm text-slate-600">{reportRows.length} rows selected</span>
              </div>
            </div>

            <div className={`${summaryCollapsed ? 'hidden' : ''} mt-2 rounded-[20px] border border-slate-200 bg-slate-50 p-3 shadow-sm`}>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Total rows" value={summaryMetrics?.rows ?? 0} />
                {summaryMetrics?.revenue !== undefined && (
                  <MetricCard label="Revenue" value={`$${summaryMetrics.revenue.toLocaleString()}`} valueClass="text-emerald-700" />
                )}
                {summaryMetrics?.avgDiscount !== undefined && (
                  <MetricCard label="Avg discount" value={`${summaryMetrics.avgDiscount}%`} valueClass="text-orange-700" />
                )}
                {summaryMetrics?.totalStock !== undefined && (
                  <MetricCard label="Total stock" value={summaryMetrics.totalStock} valueClass="text-violet-700" />
                )}
              </div>
            </div>

            <div className="mt-2 flex-1 min-h-0 overflow-hidden">
              <div className="h-full min-h-0 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
                <DataGrid
                  reportId={selectedReport}
                  rowData={reportRows}
                  loading={loading}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
