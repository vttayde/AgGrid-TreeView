import React, { useEffect, useMemo, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'

export default function DataGrid({ reportId, reportName, rowData = [], loading }){
  const [gridApi, setGridApi] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const [quickFilter, setQuickFilter] = useState('')
  const [selectedCount, setSelectedCount] = useState(0)
  const [activeChip, setActiveChip] = useState('all')

  useEffect(() => {
    if(gridApi) gridApi.setQuickFilter(quickFilter)
  }, [gridApi, quickFilter])

  useEffect(() => {
    if(!gridApi) return
    if(loading) {
      gridApi.showLoadingOverlay()
    } else if (!rowData.length) {
      gridApi.showNoRowsOverlay()
    } else {
      gridApi.hideOverlay()
    }
  }, [gridApi, loading, rowData])

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 120,
    flex: 1
  }), [])

  const columnDefs = useMemo(() => {
    switch(reportId){
      case 'daily-transactions':
      case 'high-value-orders':
        return [
          { field: 'id', headerName: 'Order ID', width: 100, pinned: 'left' },
          { field: 'userId', headerName: 'User ID', width: 110 },
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
let v= 0
  const formatCurrency = value => {
    if (value === undefined || value === null || Number.isNaN(Number(value))) return '-'
    return `$${Number(value).toLocaleString()}`
  }

  const formatPercent = value => {
    if (value === undefined || value === null || Number.isNaN(Number(value))) return '-'
    return `${Number(value)}%`
  }

  const getFilterChips = useMemo(() => {
    if (reportId === 'daily-transactions' || reportId === 'high-value-orders' || reportId === 'offline-store-sales' || reportId === 'top-merchants' || reportId === 'repeat-buyers' || reportId === 'pos-returns') {
      return [
        { key: 'all', label: 'All orders' },
        { key: 'high-value', label: 'High value' },
        { key: 'discounted', label: 'Discounted' },
        { key: 'large-order', label: 'Large orders' }
      ]
    }

    if (reportId === 'trade-inventory') {
      return [
        { key: 'all', label: 'All items' },
        { key: 'low-stock', label: 'Low stock' },
        { key: 'top-rated', label: 'Top rated' },
        { key: 'discounted', label: 'Discounts' }
      ]
    }

    if (reportId === 'category-performance' || reportId === 'sales-by-category' || reportId === 'supplier-performance') {
      return [
        { key: 'all', label: 'All categories' },
        { key: 'high-stock', label: 'High stock' },
        { key: 'top-rated', label: 'Top rated' },
        { key: 'high-volume', label: 'High products' }
      ]
    }

    return [
      { key: 'all', label: 'All rows' }
    ]
  }, [reportId])

  const applyFilterModel = (filterKey) => {
    if (!gridApi) return

    if (filterKey === 'all') {
      gridApi.setFilterModel(null)
      return
    }

    const model = {}

    if (reportId === 'daily-transactions' || reportId === 'high-value-orders') {
      if (filterKey === 'high-value') {
        model.total = { type: 'greaterThan', filter: 500 }
      } else if (filterKey === 'discounted') {
        model.discountPercentage = { type: 'greaterThan', filter: 0 }
      } else if (filterKey === 'large-order') {
        model.totalProducts = { type: 'greaterThan', filter: 4 }
      }
    }

    if (reportId === 'trade-inventory') {
      if (filterKey === 'low-stock') {
        model.stock = { type: 'lessThan', filter: 35 }
      } else if (filterKey === 'top-rated') {
        model.rating = { type: 'greaterThan', filter: 4 }
      } else if (filterKey === 'discounted') {
        model.discountPercentage = { type: 'greaterThan', filter: 0 }
      }
    }

    if (reportId === 'category-performance' || reportId === 'sales-by-category' || reportId === 'supplier-performance') {
      if (filterKey === 'high-stock') {
        model.totalStock = { type: 'greaterThan', filter: 100 }
      } else if (filterKey === 'top-rated') {
        model.averageRating = { type: 'greaterThan', filter: 4 }
      } else if (filterKey === 'high-volume') {
        model.productCount = { type: 'greaterThan', filter: 25 }
      }
    }

    gridApi.setFilterModel(model)
  }

  const applyChip = chip => {
    setActiveChip(chip.key)
    setQuickFilter('')
    if (gridApi) {
      gridApi.setQuickFilter('')
      applyFilterModel(chip.key)
    }
  }

  const rowClassRules = useMemo(() => ({
    'row-high-priority': params => params.data?.priority === 'High',
    'row-completed': params => params.data?.status === 'Completed',
    'row-low-progress': params => params.data?.progress !== undefined && params.data.progress < 30
  }), [])

  const title = reportName || 'No report selected'

  return (
    <div className="h-full w-full flex flex-col gap-3 overflow-hidden">
      <div className="rounded-3xl border border-slate-200 bg-white/95 shadow-sm p-4 flex-shrink-0 transition-shadow duration-300 hover:shadow-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
              onClick={() => setQuickFilter('')}
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="contained"
              size="small"
              sx={{ backgroundColor: '#2563eb', textTransform: 'none', boxShadow: '0 10px 20px rgba(37,99,235,0.12)' }}
              onClick={() => gridApi?.exportDataAsCsv({ onlySelected: true })}
            >
              📥 Export Selected
            </Button>
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: 'none', borderColor: '#e2e8f0', color: '#475569', minWidth: 92 }}
              onClick={() => gridApi?.exportDataAsCsv()}
            >
              📊 Export All
            </Button>
            {getFilterChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {getFilterChips.map(chip => (
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
            )}
          </div>

          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-900">{rowData.length}</span> rows • <span className="font-semibold text-slate-900">{selectedCount}</span> selected
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="ag-theme-alpine flex-1 overflow-hidden" style={{height: '100%', width: '100%'}}>
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowSelection="multiple"
            animateRows
            rowClassRules={rowClassRules}
            onGridReady={params => setGridApi(params.api)}
            onRowClicked={params => { setSelectedRow(params.data); setDrawerOpen(true) }}
            onSelectionChanged={params => setSelectedCount(params.api.getSelectedRows().length)}
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

