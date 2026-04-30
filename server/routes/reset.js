const { Router } = require('express');
const { getPool } = require('../db/queries');

const router = Router();

/**
 * POST /api/reset
 * Truncates transactional tables (orders, order_items, reviews) to keep
 * the dataset bounded for CI smoke tests. Products, vendors, categories,
 * and customers are left intact (seeded data).
 *
 * Protected by EMBR_ALLOW_RESET=true env var — disabled in production.
 */
router.post('/', async (req, res) => {
  if (process.env.EMBR_ALLOW_RESET !== 'true') {
    return res.status(403).json({ error: 'Reset is disabled (set EMBR_ALLOW_RESET=true)' });
  }

  const pool = getPool();
  try {
    await pool.query('TRUNCATE order_items, orders, reviews RESTART IDENTITY CASCADE');
    // Reset product rating aggregates since reviews are gone
    await pool.query('UPDATE products SET rating_avg = 0, review_count = 0');
    res.json({ status: 'reset', tables: ['orders', 'order_items', 'reviews'] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
