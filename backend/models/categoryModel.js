import { pool } from '../db.js'; // Assume db.js has the pool export

export const getCategories = async () => {
  const [rows] = await pool.query('SELECT category_name FROM categories');
  return rows.map(row => row.category_name);
};