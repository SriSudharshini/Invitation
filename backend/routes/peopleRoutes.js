import express from 'express';
import { getAllPeople, addPerson, editPerson, removePerson } from '../controllers/peopleController.js';

const router = express.Router();

router.get('/', getAllPeople);
router.post('/', addPerson);
router.put('/:id', editPerson);
router.delete('/:id', removePerson);

export default router;