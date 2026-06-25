require('dotenv').config();
const express = require('express');
const path = require('path');
const { performance } = require('perf_hooks');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Allowed product categories
const VALID_CATEGORIES = [
  'Electronics',
  'Fashion',
  'Books',
  'Sports',
  'Home',
  'Beauty',
];

// ===============================
// Health Check
// ===============================
app.get('/health', async (req, res) => {
  try {
    const dbResult = await db.query('SELECT NOW()');

    res.status(200).json({
      success: true,
      status: 'healthy',
      message: 'Server and database are running.',
      timestamp: new Date(),
      dbTime: dbResult.rows[0].now,
    });
  } catch (error) {
    console.error('Health Check Error:', error);

    res.status(500).json({
      success: false,
      status: 'unhealthy',
      message: 'Database connection failed.',
      error: error.message,
    });
  }
});

// ===============================
// Frontend
// ===============================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ===============================
// GET /products
// Cursor-based pagination
// ===============================
app.get('/products', async (req, res) => {
  try {
    const {
      category,
      cursor_created_at,
      cursor_id,
    } = req.query;

    // -------------------------------
    // Validate limit
    // -------------------------------
    const parsedLimit = parseInt(req.query.limit || '20', 10);

    const limit = Number.isNaN(parsedLimit)
      ? 20
      : Math.min(Math.max(parsedLimit, 1), 100);

    // -------------------------------
    // Validate category
    // -------------------------------
    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category.',
      });
    }

    let queryText = `
      SELECT *
      FROM products
    `;

    const queryParams = [];
    const filters = [];

    // -------------------------------
    // Category Filter
    // -------------------------------
    if (category) {
      queryParams.push(category);
      filters.push(`category = $${queryParams.length}`);
    }

    // -------------------------------
    // Cursor Pagination
    //
    // Fetch products older than the
    // last product from previous page.
    // Using (created_at, id) ensures
    // stable ordering even when
    // timestamps are identical.
    // -------------------------------
    if (cursor_created_at && cursor_id) {
      queryParams.push(cursor_created_at);
      queryParams.push(cursor_id);

      filters.push(
        `(created_at, id) < ($${queryParams.length - 1}, $${queryParams.length})`
      );
    }

    if (filters.length > 0) {
      queryText += `
        WHERE ${filters.join(' AND ')}
      `;
    }

    queryParams.push(limit);

    queryText += `
      ORDER BY created_at DESC, id DESC
      LIMIT $${queryParams.length}
    `;

    // -------------------------------
    // Measure database query time
    // -------------------------------
    const queryStart = performance.now();

    const result = await db.query(queryText, queryParams);

    const queryEnd = performance.now();

    const queryTimeMs = Number(
      (queryEnd - queryStart).toFixed(2)
    );

    // -------------------------------
    // Build next cursor
    // -------------------------------
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
      queryTimeMs,
      products: result.rows,
      nextCursor,
    });

  } catch (error) {
    console.error('Error fetching products:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products.',
      error: error.message,
    });
  }
});

// ===============================
// Start Server
// ===============================
app.listen(PORT, async () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);

  try {
    const result = await db.query('SELECT NOW()');

    console.log('✅ PostgreSQL connected successfully');
    console.log('Database Time:', result.rows[0].now);
  } catch (error) {
    console.error('❌ Database connection failed');
    console.error(error.message);
  }
});