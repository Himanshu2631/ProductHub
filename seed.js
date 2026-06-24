const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('./db');

// Categories list
const CATEGORIES = ['Electronics', 'Fashion', 'Books', 'Sports', 'Home', 'Beauty'];

// Realistic words to generate product names dynamically
const PREFIXES = ['Ultra', 'Smart', 'Premium', 'Eco', 'Classic', 'Pro', 'Active', 'Pocket', 'Wireless', 'Royal'];
const NOUNS = {
  Electronics: ['Headphones', 'Speaker', 'Watch', 'Charger', 'Camera', 'Keyboard', 'Mouse', 'Screen', 'Hub', 'Router'],
  Fashion: ['T-Shirt', 'Jacket', 'Sneakers', 'Jeans', 'Socks', 'Cap', 'Bag', 'Sunglasses', 'Belt', 'Scarf'],
  Books: ['Novel', 'Biography', 'Guide', 'Anthology', 'Textbook', 'Journal', 'Cookbook', 'Encyclopedia', 'Atlas', 'Comic'],
  Sports: ['Mat', 'Bottle', 'Dumbbell', 'Racket', 'Ball', 'Gloves', 'Jersey', 'Bicycle', 'Helmet', 'Backpack'],
  Home: ['Lamp', 'Organizer', 'Chair', 'Table', 'Blanket', 'Pillow', 'Blender', 'Toaster', 'Mug', 'Mirror'],
  Beauty: ['Serum', 'Cream', 'Lipstick', 'Perfume', 'Shampoo', 'Brush', 'Soap', 'Oil', 'Mask', 'Cleanser']
};
const SUFFIXES = ['Edition', 'v2', 'Max', 'Lite', 'Plus', 'X', 'Gold', 'Core', 'Series', 'Solo'];

// Helper functions for random data generation
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateProductName(category) {
  const prefix = getRandomElement(PREFIXES);
  const noun = getRandomElement(NOUNS[category]);
  const suffix = getRandomElement(SUFFIXES);
  return `${prefix} ${noun} ${suffix}`;
}

function getRandomPrice() {
  return parseFloat((Math.random() * 995 + 5).toFixed(2));
}

function getRandomDate() {
  const start = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedDatabase() {
  const TOTAL_PRODUCTS = 200000;
  const BATCH_SIZE = 5000;

  console.log(`Starting PostgreSQL database seed of ${TOTAL_PRODUCTS} products...`);
  console.time('Seeding Complete');

  try {
    // 1. Automatically verify and build the PostgreSQL schema before seeding
    console.log('Ensuring PostgreSQL tables and indexes are created...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await db.query(schemaSql);
    console.log('PostgreSQL schema verified.');

    // 2. Clear existing products to prevent duplicates
    console.log('Clearing existing products data...');
    await db.query('TRUNCATE TABLE products RESTART IDENTITY CASCADE;');

    let insertedCount = 0;

    while (insertedCount < TOTAL_PRODUCTS) {
      const valueRows = [];
      const values = [];
      let paramIndex = 1;

      // Construct a single batch SQL template and value array
      for (let i = 0; i < BATCH_SIZE; i++) {
        const id = randomUUID();
        const category = getRandomElement(CATEGORIES);
        const name = generateProductName(category);
        const price = getRandomPrice();
        const createdAt = getRandomDate();
        const updatedAt = new Date(createdAt.getTime() + (Math.random() > 0.7 ? Math.random() * 10 * 24 * 60 * 60 * 1000 : 0));

        valueRows.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`);

        values.push(id, name, category, price, createdAt, updatedAt);
        paramIndex += 6;
      }

      const queryText = `
        INSERT INTO products (id, name, category, price, created_at, updated_at) 
        VALUES ${valueRows.join(', ')}
      `;

      await db.query(queryText, values);

      insertedCount += BATCH_SIZE;
      console.log(`Progress: ${insertedCount} / ${TOTAL_PRODUCTS} products inserted...`);
    }

    console.timeEnd('Seeding Complete');
    console.log('Seeding finished successfully!');
  } catch (error) {
    console.error('Seeding encountered an error:', error);
  } finally {
    // Close the PostgreSQL pool cleanly
    await db.pool.end();
  }
}

seedDatabase();
