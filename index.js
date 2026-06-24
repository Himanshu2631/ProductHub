require('dotenv').config();
const express = require('express');
const path = require('path');
const { performance } = require('perf_hooks');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request body
app.use(express.json());

// Health check route: tests both Express server and PostgreSQL connection
app.get('/health', async (req, res) => {
  try {
    const dbResult = await db.query('SELECT NOW()');
    
    res.status(200).json({
      status: 'healthy',
      message: 'Server and Database are functioning correctly',
      timestamp: new Date(),
      dbTime: dbResult.rows[0].now,
    });
  } catch (error) {
    console.error('Database connection error during health check:', error);
    
    res.status(500).json({
      status: 'unhealthy',
      message: 'Server is running, but database connection failed',
      error: error.message,
    });
  }
});

// Serve frontend API explorer page at root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// GET /products: Retrieve list of products with cursor-based pagination
// Sorts by created_at DESC, id DESC (newest first, stable order)
// Supports optional filtering by category: ?category=Electronics
// Supports cursor params: ?cursor_created_at=2026-06-24...&cursor_id=uuid-123
app.get('/products', async (req, res) => {
  try {
    const { category, cursor_created_at, cursor_id } = req.query;
    const limit = parseInt(req.query.limit || '20', 10);

    let queryText = 'SELECT * FROM products';
    const queryParams = [];
    const filters = [];

    // 1. Category filter
    if (category) {
      queryParams.push(category);
      filters.push(`category = $${queryParams.length}`);
    }

    // 2. Cursor filter: tuple comparison (created_at, id) < (cursor_created_at, cursor_id)
    if (cursor_created_at && cursor_id) {
      queryParams.push(cursor_created_at, cursor_id);
      filters.push(`(created_at, id) < ($${queryParams.length - 1}, $${queryParams.length})`);
    }

    // Append WHERE filters if any exist
    if (filters.length > 0) {
      queryText += ' WHERE ' + filters.join(' AND ');
    }

    // 3. Sorting and Limit
    queryParams.push(limit);
    queryText += ` ORDER BY created_at DESC, id DESC LIMIT $${queryParams.length}`;

    // Measure PostgreSQL query performance
    const startTime = performance.now();
    const result = await db.query(queryText, queryParams);
    const endTime = performance.now();
    const queryTimeMs = Math.round(endTime - startTime);

    // 4. Determine next cursor if we retrieved a full page (indicating more items might exist)
    let nextCursor = null;
    if (result.rows.length === limit) {
      const lastProduct = result.rows[result.rows.length - 1];
      nextCursor = {
        cursor_created_at: lastProduct.created_at,
        cursor_id: lastProduct.id,
      };
    }

    res.status(200).json({
      success: true,
      count: result.rows.length,
      queryTimeMs, // Return exact database query time in milliseconds
      products: result.rows,
      nextCursor,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
      error: error.message,
    });
  }
});

// Start the server and test database connection immediately on startup
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  
  try {
    const res = await db.query('SELECT NOW()');
    console.log('PostgreSQL database connected successfully. Database time:', res.rows[0].now);
  } catch (error) {
    console.error('Failed to connect to the PostgreSQL database on startup:', error.message);
    console.error('Please verify your database server is running and credentials in .env are correct.');
  }
});
