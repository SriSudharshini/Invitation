import { pool } from '../db.js';

export const getCategories = async () => {
  const [rows] = await pool.query('SELECT category_name FROM categories ORDER BY category_name');
  return rows.map(row => row.category_name);
};

export const addCategory = async (categoryName) => {
  // First check if category already exists
  const [existing] = await pool.query(
    'SELECT category_name FROM categories WHERE category_name = ?',
    [categoryName]
  );
  
  if (existing.length > 0) {
    throw new Error('Category already exists');
  }
  
  // Get all current enum values
  const [enumInfo] = await pool.query(`
    SELECT COLUMN_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? 
    AND TABLE_NAME = 'categories' 
    AND COLUMN_NAME = 'category_name'
  `, [process.env.DB_NAME || 'psg_people_db']);
  
  // Extract enum values
  const enumString = enumInfo[0].COLUMN_TYPE;
  const enumValues = enumString.match(/enum\((.*)\)/i)[1]
    .split(',')
    .map(val => val.replace(/'/g, '').trim());
  
  // Add new category to enum
  enumValues.push(categoryName);
  
  // Update ENUM
  await pool.query(`
    ALTER TABLE categories 
    MODIFY COLUMN category_name ENUM(${enumValues.map(v => `'${v}'`).join(',')}) NOT NULL
  `);
  
  // Insert the new category
  await pool.query('INSERT INTO categories (category_name) VALUES (?)', [categoryName]);
  
  return { category_name: categoryName };
};

export const deleteCategory = async (categoryName) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log('Deleting category:', categoryName);

    // First check if category exists
    const [categoryExists] = await connection.query(
      'SELECT category_id FROM categories WHERE category_name = ?',
      [categoryName]
    );

    if (categoryExists.length === 0) {
      throw new Error(`Category "${categoryName}" not found`);
    }

    const categoryId = categoryExists[0].category_id;

    // Check if category is being used by any person
    const [usageCheck] = await connection.query(
      'SELECT COUNT(*) as count FROM people_details WHERE category_id = ?',
      [categoryId]
    );

    console.log('Category usage count:', usageCheck[0].count);

    if (usageCheck[0].count > 0) {
      throw new Error(`Cannot delete category "${categoryName}" because it is assigned to ${usageCheck[0].count} person(s)`);
    }

    // Delete the category
    const [deleteResult] = await connection.query(
      'DELETE FROM categories WHERE category_name = ?',
      [categoryName]
    );

    console.log('Delete result:', deleteResult);

    // Update ENUM to remove the category
    const [enumInfo] = await connection.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'categories' 
      AND COLUMN_NAME = 'category_name'
    `, [process.env.DB_NAME || 'psg_people_db']);

    const enumString = enumInfo[0].COLUMN_TYPE;
    const enumValues = enumString.match(/enum\((.*)\)/i)[1]
      .split(',')
      .map(val => val.replace(/'/g, '').trim())
      .filter(val => val !== categoryName);

    if (enumValues.length === 0) {
      throw new Error('Cannot delete the last category');
    }

    await connection.query(`
      ALTER TABLE categories 
      MODIFY COLUMN category_name ENUM(${enumValues.map(v => `'${v}'`).join(',')}) NOT NULL
    `);

    await connection.commit();
    console.log('Category deleted successfully');
    return { message: 'Category deleted successfully' };
  } catch (err) {
    await connection.rollback();
    console.error('Error in deleteCategory:', err);
    throw err;
  } finally {
    connection.release();
  }
};