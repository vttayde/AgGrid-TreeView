import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'

const filterChipSets = {
  carts: [
    { key: 'all', label: 'All orders' },
    { key: 'high-value', label: 'High value' },
    { key: 'discounted', label: 'Discounted' },
    { key: 'large-order', label: 'Large orders' }
  ],
  tradeInventory: [
    { key: 'all', label: 'All items' },
    { key: 'low-stock', label: 'Low stock' },
    { key: 'top-rated', label: 'Top rated' },
    { key: 'discounted', label: 'Discounts' }
  ],
  categories: [
    { key: 'all', label: 'All categories' },
    { key: 'high-stock', label: 'High stock' },
    { key: 'top-rated', label: 'Top rated' },
    { key: 'high-volume', label: 'High products' }
  ]
}

const cartReports = ['daily-transactions', 'high-value-orders', 'offline-store-sales', 'top-merchants', 'repeat-buyers', 'pos-returns']
const categoryReports = ['category-performance', 'sales-by-category', 'supplier-performance']

function getFilterChips(reportId) {
  if (cartReports.includes(reportId)) return filterChipSets.carts
  if (reportId === 'trade-inventory') return filterChipSets.tradeInventory
  if (categoryReports.includes(reportId)) return filterChipSets.categories
  return [{ key: 'all', label: 'All rows' }]
}

function createFilterModel(reportId, filterKey) {
  if (filterKey === 'all') return null

  if (cartReports.includes(reportId)) {
    if (filterKey === 'high-value') return { total: { type: 'greaterThan', filter: 500 } }
    if (filterKey === 'discounted') return { discountPercentage: { type: 'greaterThan', filter: 0 } }
    if (filterKey === 'large-order') return { totalProducts: { type: 'greaterThan', filter: 4 } }
  }

  if (reportId === 'trade-inventory') {
    if (filterKey === 'low-stock') return { stock: { type: 'lessThan', filter: 35 } }
    if (filterKey === 'top-rated') return { rating: { type: 'greaterThan', filter: 4 } }
    if (filterKey === 'discounted') return { discountPercentage: { type: 'greaterThan', filter: 0 } }
  }

  if (categoryReports.includes(reportId)) {
    if (filterKey === 'high-stock') return { totalStock: { type: 'greaterThan', filter: 100 } }
    if (filterKey === 'top-rated') return { averageRating: { type: 'greaterThan', filter: 4 } }
    if (filterKey === 'high-volume') return { productCount: { type: 'greaterThan', filter: 25 } }
  }

  return null
}

function formatCurrency(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-'
  return `$${Number(value).toLocaleString()}`
}

function formatPercent(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-'
  return `${Number(value)}%`
}

const rowClassRules = {
  'row-high-priority': params => params.data?.priority === 'High',
  'row-completed': params => params.data?.status === 'Completed',
  'row-low-progress': params => params.data?.progress !== undefined && params.data.progress < 30
}

export default function DataGrid({ reportId, rowData = [], loading }) {
  const gridApiRef = useRef(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const [quickFilter, setQuickFilter] = useState('')
  const [selectedCount, setSelectedCount] = useState(0)
  const [activeChip, setActiveChip] = useState('all')

  useEffect(() => {
    const api = gridApiRef.current
    if (!api) return
    if (loading) api.showLoadingOverlay()
    else if (!rowData.length) api.showNoRowsOverlay()
    else api.hideOverlay()
  }, [loading, rowData])

  const defaultColDef = useMemo(
    () => ({ sortable: true, filter: true, resizable: true, minWidth: 120, flex: 1 }),
    []
  )

  const filterChips = useMemo(() => getFilterChips(reportId), [reportId])

  const columnDefs = useMemo(() => {
    switch (reportId) {
      case 'daily-transactions':
      case 'high-value-orders':
        return [
          {
            headerName: 'Order ID',
            width: 100,
            pinned: 'left',
            valueGetter: params => params.data?.orderId ?? (params.node?.rowIndex != null ? params.node.rowIndex + 1 : '')
          },
          { field: 'userName', headerName: 'User', width: 140 },
          { field: 'date', headerName: 'Date', width: 140 },
          { field: 'total', headerName: 'Total', width: 140, valueFormatter: params => formatCurrency(params.value) },
          { field: 'discountedTotal', headerName: 'Discounted Total', width: 160, valueFormatter: params => formatCurrency(params.value) },
          { field: 'totalProducts', headerName: 'Products', width: 120 },
          { field: 'totalQuantity', headerName: 'Quantity', width: 120 },
          { field: 'discountPercentage', headerName: 'Discount %', width: 130, valueFormatter: params => formatPercent(params.value) }
        ]
      case 'trade-inventory':
        return [
          { field: 'id', headerName: 'Product ID', width: 100, pinned: 'left' },
          { field: 'title', headerName: 'Product', flex: 2 },
          { field: 'category', headerName: 'Category', width: 150 },
          { field: 'brand', headerName: 'Brand', width: 150 },
          { field: 'price', headerName: 'Price', width: 120, valueFormatter: params => formatCurrency(params.value) },
          { field: 'stock', headerName: 'Stock', width: 100 },
          { field: 'rating', headerName: 'Rating', width: 110 },
          { field: 'discountPercentage', headerName: 'Discount %', width: 130, valueFormatter: params => formatPercent(params.value) }
        ]
      case 'category-performance':
        return [
          { field: 'category', headerName: 'Category', flex: 1, pinned: 'left' },
          { field: 'productCount', headerName: 'Products', width: 120 },
          { field: 'averagePrice', headerName: 'Avg Price', width: 130, valueFormatter: params => formatCurrency(params.value) },
          { field: 'averageRating', headerName: 'Avg Rating', width: 120 },
          { field: 'totalStock', headerName: 'Total Stock', width: 130 }
        ]
      default:
        return [
          { field: 'id', headerName: 'ID', width: 100, pinned: 'left' },
          { field: 'projectName', headerName: 'Project', flex: 2 },
          { field: 'category', headerName: 'Category', width: 150 },
          { field: 'owner', headerName: 'Owner', width: 150 },
          { field: 'status', headerName: 'Status', width: 120 },
          { field: 'priority', headerName: 'Priority', width: 120 }
        ]
    }
  }, [reportId])

  const onGridReady = useCallback(params => {
    gridApiRef.current = params.api
  }, [])

  const handleRowClicked = useCallback(params => {
    setSelectedRow(params.data)
    setDrawerOpen(true)
  }, [])

  const handleSelectionChanged = useCallback(params => {
    setSelectedCount(params.api.getSelectedRows().length)
  }, [])

  const handleClearFilter = useCallback(() => {
    setQuickFilter('')
  }, [])

  const applyChip = useCallback(
    chip => {
      setActiveChip(chip.key)
      setQuickFilter('')
      const api = gridApiRef.current
      if (!api) return
      api.setQuickFilter('')
      api.setFilterModel(createFilterModel(reportId, chip.key))
    },
    [reportId]
  )

  return (
    <div className="h-full w-full flex flex-col gap-1 overflow-hidden">
      <div className="rounded-2xl border border-slate-200 bg-white/95 shadow-sm p-2 flex-shrink-0 transition-shadow duration-300 hover:shadow-md">
        <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-blue-100 text-blue-700 p-2 text-xl">🔎</span>
              <div>
                <h3 className="font-semibold text-slate-900">Quick Search & Export</h3>
                <p className="text-xs text-slate-500">Search, filter, and export your current report.</p>
              </div>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 lg:w-auto">
            <TextField
              size="small"
              variant="outlined"
              placeholder="Search all columns..."
              value={quickFilter}
              onChange={e => setQuickFilter(e.target.value)}
              sx={{
                width: '100%',
                maxWidth: 320,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '999px',
                  backgroundColor: '#f8fafc',
                  paddingRight: '8px'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e2e8f0'
                },
                '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#2563eb'
                }
              }}
            />
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: 'none', minWidth: 84 }}
              onClick={handleClearFilter}
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="contained"
              size="small"
              sx={{ backgroundColor: '#2563eb', textTransform: 'none', boxShadow: '0 10px 20px rgba(37,99,235,0.12)' }}
              onClick={() => gridApiRef.current?.exportDataAsCsv({ onlySelected: true })}
            >
              📥 Export Selected
            </Button>
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: 'none', borderColor: '#e2e8f0', color: '#475569', minWidth: 92 }}
              onClick={() => gridApiRef.current?.exportDataAsCsv()}
            >
              📊 Export All
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              {filterChips.map(chip => (
                <Chip
                  key={chip.key}
                  label={chip.label}
                  size="small"
                  clickable
                  color={chip.key === activeChip ? 'primary' : 'default'}
                  onClick={() => applyChip(chip)}
                  sx={{ textTransform: 'none', fontWeight: chip.key === activeChip ? 600 : 500 }}
                />
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-900">{rowData.length}</span> rows • <span className="font-semibold text-slate-900">{selectedCount}</span> selected
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="ag-theme-alpine flex-1 overflow-hidden" style={{ height: '100%', width: '100%' }}>
          <AgGridReact
            rowData={rowData}
            quickFilterText={quickFilter}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowSelection="multiple"
            animateRows
            rowClassRules={rowClassRules}
            onGridReady={onGridReady}
            onRowClicked={handleRowClicked}
            onSelectionChanged={handleSelectionChanged}
            overlayLoadingTemplate='<span class="ag-overlay-loading-center">⏳ Loading data...</span>'
            overlayNoRowsTemplate='<span class="ag-overlay-loading-center">📭 Select a report to load results</span>'
          />
        </div>
      </div>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 420, padding: 4, background: '#f8fafc' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">📋 Row Details</h3>
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-2xl"
            >
              ✕
            </button>
          </div>

          {selectedRow ? (
            <div className="space-y-3">
              {Object.entries(selectedRow).map(([key, value]) => (
                <div key={key} className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-slate-900 break-all">{String(value)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">No row details available</p>
            </div>
          )}
        </Box>
      </Drawer>
    </div>
  )
}

