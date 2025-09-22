import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import peopleRoutes from './routes/peopleRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import institutionRoutes from './routes/institutionRoutes.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/people', peopleRoutes);
app.use('/categories', categoryRoutes);
app.use('/institutions', institutionRoutes);

// Test endpoint (keep if needed)
app.get('/ping', (req, res) => res.json({ message: 'pong' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));