import React, { useEffect, useMemo, useState } from 'react'
import SidebarTree from './components/SidebarTree'
import DataGrid from './components/DataGrid'

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
  return carts.map(cart => ({
    id: cart.id,
    userId: cart.userId,
    date: cart.date,
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

function countLeaves(nodes) {
  return nodes.reduce((sum, node) => {
    if (!node.children?.length) return sum + 1
    return sum + countLeaves(node.children)
  }, 0)
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
  const [headerCollapsed, setHeaderCollapsed] = useState(true)
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
      setError(null)
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
        setError('Unable to load report data. Check network or try again.')
        setReportRows([])
      } finally {
        setLoading(false)
      }
    }

    fetchRows()
  },[selectedReport])

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Collapsible Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md border-b border-slate-700 flex-shrink-0 transition-all duration-300">
        <div className="flex items-center px-4 py-2 md:justify-between w-full gap-3">
          <div className="min-w-0">
            <h1 className="font-bold text-lg md:text-2xl truncate">📊 Portfolio Analytics Dashboard</h1>
            {!headerCollapsed && (
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">Real-time analytics, interactive portfolio reporting, and live metrics in one workspace.</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-200">Live</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-200">Connected</span>
            <button
              onClick={() => setHeaderCollapsed(!headerCollapsed)}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 transition-colors"
            >
              {headerCollapsed ? 'Expand header ▲' : 'Collapse header ▼'}
            </button>
          </div>
        </div>
        {!headerCollapsed && (
          <div className="border-t border-white/10 px-6 pb-3">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-2xl bg-white/10 px-3 py-2.5 text-sm text-slate-100">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Current report</p>
                <p className="mt-1 font-semibold">{selectedReportLabel}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-slate-100">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Visible rows</p>
                <p className="mt-1 font-semibold">{reportRows.length}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-slate-100">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Loaded reports</p>
                <p className="mt-1 font-semibold">{countLeaves(reportTree)}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-slate-100">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Last update</p>
                <p className="mt-1 font-semibold">Live</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-shrink-0">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4 flex-shrink-0">
            <h2 className="font-bold text-lg text-white">📋 Report Library</h2>
            <p className="text-xs text-blue-100 mt-1">Browse & select reports</p>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-3">
            <SidebarTree
              tree={reportTree}
              selectedReport={selectedReport}
              onSelectReport={(reportId, reportLabel) => {
                setSelectedReport(reportId)
                setSelectedReportLabel(reportLabel)
              }}
            />
          </div>
        </aside>
        
        {/* Main Content Area */}
        <main className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-2 text-white border-b border-slate-300 flex-shrink-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="font-bold text-2xl">{selectedReportLabel || 'Select a Report'}</h1>
                <p className="text-sm text-slate-300 mt-1">Real-time data analysis and reporting</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-200">Rows: {reportRows.length}</span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-200">{loading ? 'Loading...' : 'Live data'}</span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-200">{selectedReport ? 'Report selected' : 'No report selected'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 min-h-0">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700 font-medium">⚠️ {error}</p>
            </div>
          )}
          
          {summaryMetrics && (
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Quick Summary</p>
                  <p className="text-xs text-slate-500">Toggle the metric cards for a cleaner workspace.</p>
                </div>
                <button
                  onClick={() => setSummaryCollapsed(!summaryCollapsed)}
                  className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  {summaryCollapsed ? 'Show metrics ▼' : 'Hide metrics ▲'}
                </button>
              </div>

              {!summaryCollapsed && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 hover:shadow-md transition-shadow">
                    <p className="text-xs uppercase tracking-wider text-slate-600 font-semibold">Total Rows</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{summaryMetrics.rows}</p>
                  </div>

                  {summaryMetrics.revenue !== undefined && (
                    <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-green-50 to-green-100 p-4 hover:shadow-md transition-shadow">
                      <p className="text-xs uppercase tracking-wider text-slate-600 font-semibold">Revenue</p>
                      <p className="mt-2 text-3xl font-bold text-green-700">${summaryMetrics.revenue.toLocaleString()}</p>
                    </div>
                  )}

                  {summaryMetrics.avgDiscount !== undefined && (
                    <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-orange-50 to-orange-100 p-4 hover:shadow-md transition-shadow">
                      <p className="text-xs uppercase tracking-wider text-slate-600 font-semibold">Avg Discount</p>
                      <p className="mt-2 text-3xl font-bold text-orange-700">{summaryMetrics.avgDiscount}%</p>
                    </div>
                  )}

                  {summaryMetrics.totalStock !== undefined && (
                    <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4 hover:shadow-md transition-shadow">
                      <p className="text-xs uppercase tracking-wider text-slate-600 font-semibold">Total Stock</p>
                      <p className="mt-2 text-3xl font-bold text-purple-700">{summaryMetrics.totalStock}</p>
                    </div>
                  )}

                  {summaryMetrics.avgPrice !== undefined && (
                    <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 hover:shadow-md transition-shadow">
                      <p className="text-xs uppercase tracking-wider text-slate-600 font-semibold">Avg Price</p>
                      <p className="mt-2 text-3xl font-bold text-cyan-700">${summaryMetrics.avgPrice.toLocaleString()}</p>
                    </div>
                  )}

                  {summaryMetrics.avgProductCount !== undefined && (
                    <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 hover:shadow-md transition-shadow">
                      <p className="text-xs uppercase tracking-wider text-slate-600 font-semibold">Avg Products</p>
                      <p className="mt-2 text-3xl font-bold text-indigo-700">{summaryMetrics.avgProductCount}</p>
                    </div>
                  )}

                  {summaryMetrics.overallStock !== undefined && (
                    <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-rose-50 to-rose-100 p-4 hover:shadow-md transition-shadow">
                      <p className="text-xs uppercase tracking-wider text-slate-600 font-semibold">Overall Stock</p>
                      <p className="mt-2 text-3xl font-bold text-rose-700">{summaryMetrics.overallStock}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="flex-1 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex flex-col min-h-0">
            <DataGrid
              reportId={selectedReport}
              reportName={selectedReportLabel}
              rowData={reportRows}
              loading={loading}
            />
          </div>
          </div>
        </main>
      </div>
    </div>
  )
}
