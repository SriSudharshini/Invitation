import { pool } from '../db.js';

export const getPeople = async () => {
  const query = `
    SELECT 
      p.person_id AS id,
      p.title,
      p.name,
      pd.phone,
      pd.email,
      pd.designation,
      pd.company,
      pd.door_no AS doorNo,
      pd.street,
      pd.area,
      pd.city,
      pd.pincode,
      pd.state,
      pi.institution_name AS institution,
      GROUP_CONCAT(c.category_name SEPARATOR ', ') AS category
    FROM people p
    LEFT JOIN (
      SELECT * FROM people_details pd1
      WHERE detail_id = (
        SELECT detail_id FROM people_details pd2 
        WHERE pd2.person_id = pd1.person_id 
        ORDER BY detail_id DESC LIMIT 1
      )
    ) pd ON p.person_id = pd.person_id
    LEFT JOIN psg_institutions pi ON pd.institution_id = pi.institution_id
    LEFT JOIN people_category_map pcm ON pd.detail_id = pcm.detail_id
    LEFT JOIN categories c ON pcm.category_id = c.category_id
    GROUP BY p.person_id, p.title, p.name, pd.phone, pd.email, pd.designation, pd.company, pd.door_no, pd.street, pd.area, pd.city, pd.pincode, pd.state, pi.institution_name
    ORDER BY p.person_id;
  `;
  console.log('Executing query:', query);
  const [rows] = await pool.query(query);
  console.log('Query result rows:', rows);
  return rows.map(row => ({
    ...row,
    category: row.category ? row.category.split(', ') : []
  }));
};

export const createPerson = async (person) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [personResult] = await connection.query(
      'INSERT INTO people (title, name) VALUES (?, ?)',
      [person.title, person.name]
    );
    const personId = personResult.insertId;

    const [detailsResult] = await connection.query(
      'INSERT INTO people_details (person_id, institution_id, phone, email, designation, company, door_no, street, area, city, state, pincode) VALUES (?, (SELECT institution_id FROM psg_institutions WHERE institution_name = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [personId, person.institution, person.phone, person.email, person.designation, person.company, person.doorNo, person.street, person.area, person.city, person.state, person.pincode]
    );
    const detailId = detailsResult.insertId;

    for (const cat of person.category) {
      await connection.query(
        'INSERT INTO people_category_map (detail_id, category_id) VALUES (?, (SELECT category_id FROM categories WHERE category_name = ?))',
        [detailId, cat]
      );
    }

    await connection.commit();
    return { id: personId, ...person };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const updatePerson = async (id, person) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'UPDATE people SET title = ?, name = ? WHERE person_id = ?',
      [person.title, person.name, id]
    );

    await connection.query(
      'UPDATE people_details SET institution_id = (SELECT institution_id FROM psg_institutions WHERE institution_name = ?), phone = ?, email = ?, designation = ?, company = ?, door_no = ?, street = ?, area = ?, city = ?, state = ?, pincode = ? WHERE person_id = ?',
      [person.institution, person.phone, person.email, person.designation, person.company, person.doorNo, person.street, person.area, person.city, person.state, person.pincode, id]
    );

    const [details] = await connection.query('SELECT detail_id FROM people_details WHERE person_id = ?', [id]);
    const detailId = details[0].detail_id;

    await connection.query('DELETE FROM people_category_map WHERE detail_id = ?', [detailId]);

    for (const cat of person.category) {
      await connection.query(
        'INSERT INTO people_category_map (detail_id, category_id) VALUES (?, (SELECT category_id FROM categories WHERE category_name = ?))',
        [detailId, cat]
      );
    }

    await connection.commit();
    return { id, ...person };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const deletePerson = async (id) => {
  await pool.query('DELETE FROM people WHERE person_id = ?', [id]);
};