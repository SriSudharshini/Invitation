import { getInstitutions } from '../models/institutionModel.js';

export const getAllInstitutions = async (req, res) => {
  try {
    const institutions = await getInstitutions();
    res.json(institutions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};