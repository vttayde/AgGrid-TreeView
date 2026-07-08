const express = require('express')

const app = express()
const PORT = process.env.PORT || 3000

const reportTree = [
  {
    id: 'transaction-reports',
    label: 'Transaction Reports',
    children: [
      { id: 'daily-transactions', label: 'Daily Transactions' },
      { id: 'high-value-orders', label: 'High Value Orders' }
    ]
  },
  {
    id: 'trade-reports',
    label: 'Trade Reports',
    children: [
      { id: 'trade-inventory', label: 'Trade Inventory' },
      { id: 'category-performance', label: 'Category Performance' }
    ]
  }
]

const reportDefinitions = new Map([
  ['daily-transactions', { type: 'carts', limit: 30 }],
  ['high-value-orders', { type: 'carts', limit: 100, filter: cart => cart.total > 500 }],
  ['trade-inventory', { type: 'products', limit: 80 }],
  ['category-performance', { type: 'categories' }]
])

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

async function formatCategoryPerformance(){
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

app.get('/api/report-tree', (req, res) => {
  res.json(reportTree)
})

app.get('/api/report/:reportId', async (req, res) => {
  const { reportId } = req.params
  const report = reportDefinitions.get(reportId)

  if(!report){
    return res.status(404).json({ error: 'Report not found' })
  }

  try {
    if(report.type === 'carts'){
      const response = await fetch(`https://dummyjson.com/carts?limit=${report.limit}`)
      const data = await response.json()
      let carts = data.carts || []
      if(report.filter){
        carts = carts.filter(report.filter)
      }
      return res.json(formatTransactions(carts))
    }

    if(report.type === 'products'){
      const response = await fetch(`https://dummyjson.com/products?limit=${report.limit}`)
      const data = await response.json()
      return res.json(formatInventory(data.products || []))
    }

    if(report.type === 'categories'){
      const rows = await formatCategoryPerformance()
      return res.json(rows)
    }

    res.json([])
  } catch(error) {
    console.error('Failed to load remote report data', error)
    res.status(500).json({ error: 'Failed to load report data' })
  }
})

app.listen(PORT, ()=>{
  console.log(`Mock API server running on http://localhost:${PORT}`)
})
