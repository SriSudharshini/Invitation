import express from 'express';
import { getAllCategories, createCategory, removeCategory } from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getAllCategories);
router.post('/', createCategory);
router.delete('/:categoryName', removeCategory); 

export default router;