import { getCategories, addCategory, deleteCategory } from '../models/categoryModel.js';

export const getAllCategories = async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { categoryName } = req.body;
    
    if (!categoryName || categoryName.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const newCategory = await addCategory(categoryName.trim());
    res.status(201).json(newCategory);
  } catch (err) {
    if (err.message === 'Category already exists') {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

export const removeCategory = async (req, res) => {
  try {
    // Decode the URL-encoded category name
    const categoryName = decodeURIComponent(req.params.categoryName);
    
    console.log('Attempting to delete category:', categoryName);
    
    if (!categoryName || categoryName.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const result = await deleteCategory(categoryName.trim());
    res.json(result);
  } catch (err) {
    console.error('Error deleting category:', err.message);
    if (err.message.includes('Cannot delete category')) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};