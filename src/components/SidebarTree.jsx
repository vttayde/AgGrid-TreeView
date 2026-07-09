import React, { useState } from 'react'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CloseIcon from '@mui/icons-material/Close'
import ReceiptIcon from '@mui/icons-material/Receipt'
import StorageIcon from '@mui/icons-material/Storage'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import TimelineIcon from '@mui/icons-material/Timeline'
import BarChartIcon from '@mui/icons-material/BarChart'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import InventoryIcon from '@mui/icons-material/Inventory'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import InsertChartIcon from '@mui/icons-material/InsertChart'
import ShareIcon from '@mui/icons-material/Share'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

function getIconColorForNode(label) {
  const lower = label.toLowerCase()
  
  if (lower.includes('transaction')) return { icon: <ReceiptIcon />, color: 'text-blue-600', bgColor: 'bg-blue-50' }
  if (lower.includes('trade')) return { icon: <StorageIcon />, color: 'text-purple-600', bgColor: 'bg-purple-50' }
  if (lower.includes('finance')) return { icon: <AccountBalanceIcon />, color: 'text-green-600', bgColor: 'bg-green-50' }
  if (lower.includes('inventory')) return { icon: <InventoryIcon />, color: 'text-indigo-600', bgColor: 'bg-indigo-50' }
  if (lower.includes('profit')) return { icon: <AttachMoneyIcon />, color: 'text-emerald-600', bgColor: 'bg-emerald-50' }
  if (lower.includes('balance')) return { icon: <AccountBalanceIcon />, color: 'text-teal-600', bgColor: 'bg-teal-50' }
  if (lower.includes('cash')) return { icon: <AttachMoneyIcon />, color: 'text-orange-600', bgColor: 'bg-orange-50' }
  if (lower.includes('expense')) return { icon: <TrendingUpIcon />, color: 'text-red-600', bgColor: 'bg-red-50' }
  if (lower.includes('category')) return { icon: <BarChartIcon />, color: 'text-cyan-600', bgColor: 'bg-cyan-50' }
  if (lower.includes('sales')) return { icon: <ShoppingCartIcon />, color: 'text-pink-600', bgColor: 'bg-pink-50' }
  if (lower.includes('supplier')) return { icon: <ShareIcon />, color: 'text-violet-600', bgColor: 'bg-violet-50' }
  
  return { icon: <BarChartIcon />, color: 'text-slate-600', bgColor: 'bg-slate-50' }
}

function getLeafIconColor(label) {
  const lower = label.toLowerCase()
  
  if (lower.includes('transaction') || lower.includes('order')) return { icon: <TimelineIcon />, color: 'text-blue-500' }
  if (lower.includes('inventory') || lower.includes('stock')) return { icon: <StorageIcon />, color: 'text-indigo-500' }
  if (lower.includes('profit') || lower.includes('expense')) return { icon: <AttachMoneyIcon />, color: 'text-emerald-500' }
  if (lower.includes('cash') || lower.includes('balance')) return { icon: <AccountBalanceIcon />, color: 'text-teal-500' }
  if (lower.includes('category') || lower.includes('sales')) return { icon: <BarChartIcon />, color: 'text-cyan-500' }
  if (lower.includes('merchant') || lower.includes('supplier')) return { icon: <ShareIcon />, color: 'text-violet-500' }
  
  return { icon: <InsertChartIcon />, color: 'text-slate-500' }
}

function getCategoryIds(nodes) {
  return nodes.reduce((ids, node) => {
    if (node.children?.length) {
      ids.push(node.id)
      ids.push(...getCategoryIds(node.children))
    }
    return ids
  }, [])
}

function countLeafReports(node) {
  if (!node.children?.length) return 1
  return node.children.reduce((count, child) => count + countLeafReports(child), 0)
}

export default function SidebarTree({ tree = [], selectedReport, onSelectReport }) {
  const [expanded, setExpanded] = useState(() => getCategoryIds(tree))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerNode, setDrawerNode] = useState(null)

  const toggleCategory = id => {
    setExpanded(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  }

  const renderNode = (node, level = 0) => {
    const isCategory = Boolean(node.children?.length)
    const isExpanded = expanded.includes(node.id)

    if (isCategory) {
      const { icon, color, bgColor } = getIconColorForNode(node.label)
      return (
        <div key={node.id} className={level === 0 ? 'rounded-xl border border-slate-200 overflow-hidden shadow-sm mb-2' : 'mb-1'}>
          <button
            type="button"
            onClick={() => toggleCategory(node.id)}
            className={`w-full flex items-center justify-between px-4 ${level === 0 ? 'py-2.5' : 'py-2 text-sm'} transition-all duration-200 ${level === 0 ? `${bgColor} hover:scale-[1.01] border-b border-slate-200` : 'hover:bg-slate-50 border-b border-slate-100'}`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className={`${color} flex items-center justify-center flex-shrink-0 rounded-full bg-white/80 p-2 ${level === 0 ? 'text-2xl' : 'text-lg'}`}>
                {icon}
              </span>
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className={`${level === 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-800 text-sm'} truncate`}>
                  {node.label}
                </span>
                {level === 0 && (
                  <span className="text-xs text-slate-500 mt-0.5">{countLeafReports(node)} reports</span>
                )}
              </div>
            </div>
            <span className={`text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
              {isExpanded ? <KeyboardArrowDownIcon /> : <ChevronRightIcon />}
            </span>
          </button>
          
          {isExpanded && (
            <div className={level === 0 ? 'bg-white' : ''}>
              {node.children.map(child => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    const { icon, color } = getLeafIconColor(node.label)
    const isSelected = selectedReport === node.id
    
    return (
      <button
        key={node.id}
        type="button"
        onClick={() => { onSelectReport(node.id, node.label) }}
        className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-all duration-200 border-l-4 flex-shrink-0 ${
          isSelected
            ? 'bg-slate-100 border-l-4 border-blue-500 font-semibold text-slate-900 shadow-sm'
            : 'border-l-4 border-transparent text-slate-700 hover:bg-slate-50 hover:-translate-y-0.5'
        }`}
      >
        <span className={`${color} flex items-center justify-center flex-shrink-0 rounded-full bg-slate-100 p-2 text-lg`}>{icon}</span>
        <span className="truncate flex-1">{node.label}</span>
        <IconButton
          size="small"
          onClick={e => { e.stopPropagation(); setDrawerNode(node); setDrawerOpen(true); }}
          aria-label="More info"
        >
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {tree.map(category => renderNode(category))}

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 360, p: 3 }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{drawerNode?.label}</h3>
              {drawerNode?.children?.length ? (
                <p className="text-sm text-slate-500 mt-1">{drawerNode.children.length} child nodes</p>
              ) : (
                <p className="text-sm text-slate-500 mt-1">Leaf report</p>
              )}
            </div>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </div>

          <div className="mt-4">
            <p className="text-sm text-slate-600">Quick actions</p>
            <div className="mt-3 flex flex-col gap-2">
              {drawerNode && !drawerNode.children?.length && (
                <button
                  onClick={() => { onSelectReport(drawerNode.id, drawerNode.label); setDrawerOpen(false); }}
                  className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm"
                >
                  Open report
                </button>
              )}
            </div>
          </div>
        </Box>
      </Drawer>
    </div>
  )
}
