import express from 'express';
import { getAllPeople, getOnePerson, getPeopleByCategory, addPerson, editPerson, removePerson } from '../controllers/peopleController.js';

const router = express.Router();

router.get('/', getAllPeople);
router.get('/by-category/:category', getPeopleByCategory);  // NEW ROUTE
router.get('/:id', getOnePerson);
router.post('/', addPerson);
router.put('/:id', editPerson);
router.delete('/:id', removePerson);

export default router;
