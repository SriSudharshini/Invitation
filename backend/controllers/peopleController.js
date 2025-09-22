import { getPeople, createPerson, updatePerson, deletePerson } from '../models/peopleModel.js';

export const getAllPeople = async (req, res) => {
  try {
    console.log('Attempting to fetch all people...');
    const people = await getPeople();
    console.log('People fetched successfully:', people);
    res.json(people);
  } catch (err) {
    console.error('Error fetching people:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export const addPerson = async (req, res) => {
  try {
    const newPerson = await createPerson(req.body);
    res.status(201).json(newPerson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const editPerson = async (req, res) => {
  try {
    const updatedPerson = await updatePerson(req.params.id, req.body);
    res.json(updatedPerson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removePerson = async (req, res) => {
  try {
    await deletePerson(req.params.id);
    res.json({ message: 'Person deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};