import { pool } from '../db.js';

// ===================================
// GET ALL PEOPLE
// Modified to show primary details + all categories
// ===================================
export const getPeople = async () => {
  const query = `
    SELECT 
      p.person_id AS id,
      p.title,
      p.name,
      GROUP_CONCAT(DISTINCT c.category_name ORDER BY c.category_name SEPARATOR ', ') AS category,
      -- Get details from the FIRST category (by category_id) for display
      (SELECT pd2.phone FROM people_details pd2 WHERE pd2.person_id = p.person_id ORDER BY pd2.detail_id LIMIT 1) AS phone,
      (SELECT pd2.email FROM people_details pd2 WHERE pd2.person_id = p.person_id ORDER BY pd2.detail_id LIMIT 1) AS email,
      (SELECT pd2.designation FROM people_details pd2 WHERE pd2.person_id = p.person_id ORDER BY pd2.detail_id LIMIT 1) AS designation,
      (SELECT pd2.company FROM people_details pd2 WHERE pd2.person_id = p.person_id ORDER BY pd2.detail_id LIMIT 1) AS company,
      (SELECT pd2.door_no FROM people_details pd2 WHERE pd2.person_id = p.person_id ORDER BY pd2.detail_id LIMIT 1) AS doorNo,
      (SELECT pd2.street FROM people_details pd2 WHERE pd2.person_id = p.person_id ORDER BY pd2.detail_id LIMIT 1) AS street,
      (SELECT pd2.area FROM people_details pd2 WHERE pd2.person_id = p.person_id ORDER BY pd2.detail_id LIMIT 1) AS area,
      (SELECT pd2.city FROM people_details pd2 WHERE pd2.person_id = p.person_id ORDER BY pd2.detail_id LIMIT 1) AS city,
      (SELECT pd2.pincode FROM people_details pd2 WHERE pd2.person_id = p.person_id ORDER BY pd2.detail_id LIMIT 1) AS pincode,
      (SELECT pd2.state FROM people_details pd2 WHERE pd2.person_id = p.person_id ORDER BY pd2.detail_id LIMIT 1) AS state,
      (SELECT pi2.institution_name FROM people_details pd2 
       LEFT JOIN psg_institutions pi2 ON pd2.institution_id = pi2.institution_id 
       WHERE pd2.person_id = p.person_id ORDER BY pd2.detail_id LIMIT 1) AS institution
    FROM people p
    LEFT JOIN people_details pd ON p.person_id = pd.person_id
    LEFT JOIN categories c ON pd.category_id = c.category_id
    GROUP BY p.person_id, p.title, p.name
    ORDER BY p.person_id DESC;
  `;
  
  console.log('Executing getPeople query');
  const [rows] = await pool.query(query);
  console.log(`Found ${rows.length} people`);
  
  return rows.map(row => ({
    ...row,
    category: row.category ? row.category.split(', ') : []
  }));
};

// ===================================
// GET SINGLE PERSON WITH ALL CATEGORY DETAILS
// ===================================
export const getPersonById = async (personId) => {
  const query = `
    SELECT 
      p.person_id AS id,
      p.title,
      p.name,
      pd.detail_id,
      c.category_name AS category,
      pi.institution_name AS institution,
      pd.phone,
      pd.alt_phone AS altPhone,
      pd.email,
      pd.alt_email AS altEmail,
      pd.designation,
      pd.company,
      pd.door_no AS doorNo,
      pd.street,
      pd.area,
      pd.city,
      pd.state,
      pd.pincode
    FROM people p
    LEFT JOIN people_details pd ON p.person_id = pd.person_id
    LEFT JOIN categories c ON pd.category_id = c.category_id
    LEFT JOIN psg_institutions pi ON pd.institution_id = pi.institution_id
    WHERE p.person_id = ?
    ORDER BY c.category_name;
  `;
  
  const [rows] = await pool.query(query, [personId]);
  
  if (rows.length === 0) return null;
  
  // Group by person with category details
  const person = {
    id: rows[0].id,
    title: rows[0].title,
    name: rows[0].name,
    categoryDetails: rows.map(row => ({
      detailId: row.detail_id,
      category: row.category,
      institution: row.institution,
      phone: row.phone,
      altPhone: row.altPhone,
      email: row.email,
      altEmail: row.altEmail,
      designation: row.designation,
      company: row.company,
      doorNo: row.doorNo,
      street: row.street,
      area: row.area,
      city: row.city,
      state: row.state,
      pincode: row.pincode
    }))
  };
  
  return person;
};

// ===================================
// CREATE PERSON WITH MULTIPLE CATEGORY DETAILS
// ===================================
export const createPerson = async (personData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log('Creating person - Full data:', JSON.stringify(personData, null, 2));

    // === DEBUG categoryDetails === (MOVED INSIDE FUNCTION)
    if (personData.categoryDetails) {
      console.log('=== DEBUG categoryDetails ===');
      console.log('Type:', typeof personData.categoryDetails);
      console.log('Keys:', Object.keys(personData.categoryDetails));
      console.log('Entries:', Object.entries(personData.categoryDetails));
      console.log('Has own properties:', Object.getOwnPropertyNames(personData.categoryDetails));
      console.log('=== END DEBUG ===');
    }

    // Step 1: Insert into people table
    const [personResult] = await connection.query(
      'INSERT INTO people (title, name) VALUES (?, ?)',
      [personData.title, personData.name]
    );
    const personId = personResult.insertId;

    // Step 2: Handle category details
    if (personData.categoryDetails && typeof personData.categoryDetails === 'object') {
      // NEW FORMAT: Multiple category-specific details
      const categoryEntries = Object.entries(personData.categoryDetails);
      console.log('Processing category entries:', categoryEntries);

      for (const [categoryName, details] of categoryEntries) {
        // SAFETY CHECK: Skip if categoryName is undefined, null, or empty
        if (!categoryName || categoryName === 'undefined' || categoryName === 'null') {
          console.warn('Skipping invalid category name:', categoryName);
          continue;
        }

        // SAFETY CHECK: Skip if details is not an object
        if (!details || typeof details !== 'object') {
          console.warn('Skipping invalid details for category:', categoryName);
          continue;
        }

        console.log(`Processing category: "${categoryName}"`);
        
        // Get category_id
        const [categoryResult] = await connection.query(
          'SELECT category_id FROM categories WHERE category_name = ?',
          [categoryName]
        );
        
        if (categoryResult.length === 0) {
          console.error(`Category not found in database: "${categoryName}"`);
          throw new Error(`Category not found: ${categoryName}`);
        }
        
        const categoryId = categoryResult[0].category_id;
        console.log(`Category "${categoryName}" has ID: ${categoryId}`);
        
        // Get institution_id (if provided)
        let institutionId = null;
        if (details.institution) {
          const [institutionResult] = await connection.query(
            'SELECT institution_id FROM psg_institutions WHERE institution_name = ?',
            [details.institution]
          );
          institutionId = institutionResult.length > 0 ? institutionResult[0].institution_id : null;
        }

        // Insert detail row for this category
        await connection.query(
          `INSERT INTO people_details 
          (person_id, category_id, institution_id, phone, alt_phone, email, alt_email, 
           designation, company, door_no, street, area, city, state, pincode) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            personId,
            categoryId,
            institutionId,
            details.phone || null,
            details.altPhone || null,
            details.email || null,
            details.altEmail || null,
            details.designation || null,
            details.company || null,
            details.doorNo || null,
            details.street || null,
            details.area || null,
            details.city || null,
            details.state || null,
            details.pincode || null
          ]
        );
        console.log(`Successfully inserted details for category: "${categoryName}"`);
      }
    } else if (personData.category) {
      // OLD FORMAT: Backward compatibility
      console.log('Using old format (single category array)');
      const categories = Array.isArray(personData.category) ? personData.category : [personData.category];
      
      for (const categoryName of categories) {
        if (!categoryName || categoryName === 'undefined' || categoryName === 'null') {
          console.warn('Skipping invalid category name:', categoryName);
          continue;
        }

        // Get category_id
        const [categoryResult] = await connection.query(
          'SELECT category_id FROM categories WHERE category_name = ?',
          [categoryName]
        );
        
        if (categoryResult.length === 0) {
          throw new Error(`Category not found: ${categoryName}`);
        }
        
        const categoryId = categoryResult[0].category_id;
        
        // Get institution_id (if provided)
        let institutionId = null;
        if (personData.institution) {
          const [institutionResult] = await connection.query(
            'SELECT institution_id FROM psg_institutions WHERE institution_name = ?',
            [personData.institution]
          );
          institutionId = institutionResult.length > 0 ? institutionResult[0].institution_id : null;
        }

        // Insert detail row for this category
        await connection.query(
          `INSERT INTO people_details 
          (person_id, category_id, institution_id, phone, alt_phone, email, alt_email, 
           designation, company, door_no, street, area, city, state, pincode) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            personId,
            categoryId,
            institutionId,
            personData.phone || null,
            personData.altPhone || null,
            personData.email || null,
            personData.altEmail || null,
            personData.designation || null,
            personData.company || null,
            personData.doorNo || null,
            personData.street || null,
            personData.area || null,
            personData.city || null,
            personData.state || null,
            personData.pincode || null
          ]
        );
      }
    } else {
      throw new Error('No category information provided');
    }

    await connection.commit();
    console.log('Transaction committed successfully');
    
    // Return created person with all details
    const createdPerson = await getPersonById(personId);
    console.log('Created person:', createdPerson);
    return createdPerson;
    
  } catch (err) {
    await connection.rollback();
    console.error('Error in createPerson, rolling back:', err);
    throw err;
  } finally {
    connection.release();
  }
};

// ===================================
// UPDATE PERSON
// ===================================
export const updatePerson = async (id, personData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Step 1: Update people table
    await connection.query(
      'UPDATE people SET title = ?, name = ? WHERE person_id = ?',
      [personData.title, personData.name, id]
    );

    // Step 2: Delete all existing details for this person
    await connection.query(
      'DELETE FROM people_details WHERE person_id = ?',
      [id]
    );

    // Step 3: Insert new category details
    // Check if we have categoryDetails (new format) or single category (old format)
    if (personData.categoryDetails && typeof personData.categoryDetails === 'object') {
      // NEW FORMAT: Multiple category-specific details
      for (const [categoryName, details] of Object.entries(personData.categoryDetails)) {
        // Get category_id
        const [categoryResult] = await connection.query(
          'SELECT category_id FROM categories WHERE category_name = ?',
          [categoryName]
        );
        
        if (categoryResult.length === 0) {
          throw new Error(`Category not found: ${categoryName}`);
        }
        
        const categoryId = categoryResult[0].category_id;
        
        // Get institution_id (if provided)
        let institutionId = null;
        if (details.institution) {
          const [institutionResult] = await connection.query(
            'SELECT institution_id FROM psg_institutions WHERE institution_name = ?',
            [details.institution]
          );
          institutionId = institutionResult.length > 0 ? institutionResult[0].institution_id : null;
        }

        // Insert detail row for this category
        await connection.query(
          `INSERT INTO people_details 
          (person_id, category_id, institution_id, phone, alt_phone, email, alt_email, 
           designation, company, door_no, street, area, city, state, pincode) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            categoryId,
            institutionId,
            details.phone || null,
            details.altPhone || null,
            details.email || null,
            details.altEmail || null,
            details.designation || null,
            details.company || null,
            details.doorNo || null,
            details.street || null,
            details.area || null,
            details.city || null,
            details.state || null,
            details.pincode || null
          ]
        );
      }
    } else {
      // OLD FORMAT: Single category (backward compatibility)
      const categories = Array.isArray(personData.category) ? personData.category : [personData.category];
      
      for (const categoryName of categories) {
        // Get category_id
        const [categoryResult] = await connection.query(
          'SELECT category_id FROM categories WHERE category_name = ?',
          [categoryName]
        );
        
        if (categoryResult.length === 0) {
          throw new Error(`Category not found: ${categoryName}`);
        }
        
        const categoryId = categoryResult[0].category_id;
        
        // Get institution_id (if provided)
        let institutionId = null;
        if (personData.institution) {
          const [institutionResult] = await connection.query(
            'SELECT institution_id FROM psg_institutions WHERE institution_name = ?',
            [personData.institution]
          );
          institutionId = institutionResult.length > 0 ? institutionResult[0].institution_id : null;
        }

        // Insert detail row for this category
        await connection.query(
          `INSERT INTO people_details 
          (person_id, category_id, institution_id, phone, alt_phone, email, alt_email, 
           designation, company, door_no, street, area, city, state, pincode) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            categoryId,
            institutionId,
            personData.phone || null,
            personData.altPhone || null,
            personData.email || null,
            personData.altEmail || null,
            personData.designation || null,
            personData.company || null,
            personData.doorNo || null,
            personData.street || null,
            personData.area || null,
            personData.city || null,
            personData.state || null,
            personData.pincode || null
          ]
        );
      }
    }

    await connection.commit();
    
    // Return updated person with all details
    return await getPersonById(id);
    
  } catch (err) {
    await connection.rollback();
    console.error('Error in updatePerson:', err);
    throw err;
  } finally {
    connection.release();
  }
};

// ===================================
// DELETE PERSON
// ===================================
export const deletePerson = async (id) => {
  // Due to CASCADE, deleting person will auto-delete all people_details
  await pool.query('DELETE FROM people WHERE person_id = ?', [id]);
};


// ===================================
// GET PEOPLE BY SPECIFIC CATEGORY
// Returns only that category's details for each person
// ===================================
export const getPeopleByCategory = async (categoryName) => {
  const query = `
    SELECT 
      p.person_id AS id,
      p.title,
      p.name,
      c.category_name AS category,
      pi.institution_name AS institution,
      pd.phone,
      pd.email,
      pd.designation,
      pd.company,
      pd.door_no AS doorNo,
      pd.street,
      pd.area,
      pd.city,
      pd.pincode,
      pd.state
    FROM people p
    INNER JOIN people_details pd ON p.person_id = pd.person_id
    INNER JOIN categories c ON pd.category_id = c.category_id
    LEFT JOIN psg_institutions pi ON pd.institution_id = pi.institution_id
    WHERE c.category_name = ?
    ORDER BY p.person_id DESC;
  `;
  
  const [rows] = await pool.query(query, [categoryName]);
  return rows;
};