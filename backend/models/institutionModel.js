import { pool } from '../db.js';

export const getInstitutions = async () => {
  const [rows] = await pool.query('SELECT institution_name FROM psg_institutions');
  return rows.map(row => row.institution_name);
};