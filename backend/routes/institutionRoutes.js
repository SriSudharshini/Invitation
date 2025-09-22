import express from 'express';
import { getAllInstitutions } from '../controllers/institutionController.js';

const router = express.Router();

router.get('/', getAllInstitutions);

export default router;