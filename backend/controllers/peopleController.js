import { getPeople, getPersonById, getPeopleByCategory as getPeopleByCategoryModel, createPerson, updatePerson, deletePerson } from '../models/peopleModel.js';

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

export const getOnePerson = async (req, res) => {
  try {
    const person = await getPersonById(req.params.id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }
    res.json(person);
  } catch (err) {
    console.error('Error fetching person:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getPeopleByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    console.log(`Fetching people for category: ${category}`);

    const people = await getPeopleByCategoryModel(category);

    console.log(`Found ${people.length} people in ${category}`);
    res.json(people);
  } catch (err) {
    console.error('Error fetching people by category:', err.message);
    res.status(500).json({ error: err.message });
  }
};


export const addPerson = async (req, res) => {
  try {
    console.log('=== CREATE PERSON REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Category details:', req.body.categoryDetails);
    
    const newPerson = await createPerson(req.body);
    console.log('Person created successfully:', newPerson);
    res.status(201).json(newPerson);
  } catch (err) {
    console.error('Error creating person:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
};

export const editPerson = async (req, res) => {
  try {
    console.log('Updating person', req.params.id, 'with data:', req.body);
    const updatedPerson = await updatePerson(req.params.id, req.body);
    console.log('Person updated successfully:', updatedPerson);
    res.json(updatedPerson);
  } catch (err) {
    console.error('Error updating person:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export const removePerson = async (req, res) => {
  try {
    console.log('Deleting person:', req.params.id);
    await deletePerson(req.params.id);
    res.json({ message: 'Person deleted successfully' });
  } catch (err) {
    console.error('Error deleting person:', err.message);
    res.status(500).json({ error: err.message });
  }
};