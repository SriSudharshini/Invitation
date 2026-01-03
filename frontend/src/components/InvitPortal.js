import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Users, Building, Filter, UserCheck, Printer, Eye, Copy, X } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const InvitPortal = () => {
  const [categories, setCategories] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [people, setPeople] = useState([]);
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingPerson, setEditingPerson] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printCategory, setPrintCategory] = useState('');
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [viewingPerson, setViewingPerson] = useState(null);
  
  const [formData, setFormData] = useState({
    title: 'Mr',
    name: '',
    selectedCategories: [],
    categoryDetails: {}
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [catRes, instRes, peopleRes] = await Promise.all([
        axios.get(`${API_URL}/categories`),
        axios.get(`${API_URL}/institutions`),
        axios.get(`${API_URL}/people`)
      ]);
      setCategories(catRes.data);
      setInstitutions(instRes.data);
      setPeople(peopleRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  };

  useEffect(() => {
    const fetchFilteredData = async () => {
      try {
        let filtered = [];

        if (selectedCategory) {
          const res = await axios.get(`${API_URL}/people/by-category/${selectedCategory}`);
          filtered = res.data;
          
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(person =>
              (person.name ? person.name.toLowerCase() : '').includes(searchLower) ||
              (person.email ? person.email.toLowerCase() : '').includes(searchLower)
            );
          }
          
          if (selectedInstitution) {
            filtered = filtered.filter(person => person.institution === selectedInstitution);
          }
        } else if (selectedInstitution || searchTerm) {
          filtered = people;
          
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(person =>
              (person.name ? person.name.toLowerCase() : '').includes(searchLower) ||
              (person.email ? person.email.toLowerCase() : '').includes(searchLower)
            );
          }
          
          if (selectedInstitution) {
            filtered = filtered.filter(person => person.institution === selectedInstitution);
          }
        }
        
        setFilteredPeople(filtered);
      } catch (err) {
        console.error('Error fetching filtered data:', err);
      }
    };

    fetchFilteredData();
  }, [selectedCategory, selectedInstitution, searchTerm, people]);

  const getCategoryCount = (category) => {
    return people.filter(person => person.category && person.category.includes(category)).length;
  };

  const getInstitutionCount = (institution) => {
    return people.filter(person => person.institution === institution).length;
  };

  const getFullAddress = (person) => {
    return `${person.doorNo || ''}, ${person.street || ''}, ${person.area || ''}, ${person.city || ''}, ${person.state || ''} - ${person.pincode || ''}`.replace(/, ,/g, ',').replace(/^,|,$/g, '');
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      await axios.post(`${API_URL}/categories`, { categoryName: newCategoryName.trim() });
      
      // Refresh categories
      const catRes = await axios.get(`${API_URL}/categories`);
      setCategories(catRes.data);
      
      setNewCategoryName('');
      setShowAddCategoryForm(false);
      alert('Category added successfully!');
    } catch (err) {
      if (err.response?.status === 409) {
        alert('Category already exists!');
      } else {
        alert('Failed to add category: ' + (err.response?.data?.error || err.message));
      }
    }
  };

const handleDeleteCategory = async (categoryName) => {
  const confirmDelete = window.confirm(
    `Are you sure you want to delete the category "${categoryName}"?\n\nThis action cannot be undone.`
  );

  if (!confirmDelete) return;

  try {
    // URL encode the category name to handle spaces and special characters
    const encodedCategoryName = encodeURIComponent(categoryName);
    await axios.delete(`${API_URL}/categories/${encodedCategoryName}`);
    
    const catRes = await axios.get(`${API_URL}/categories`);
    setCategories(catRes.data);
    
    if (selectedCategory === categoryName) {
      setSelectedCategory('');
    }
    
    alert('Category deleted successfully!');
  } catch (err) {
    console.error('Delete category error:', err);
    if (err.response?.status === 409) {
      alert(err.response.data.error);
    } else if (err.response?.status === 404) {
      alert('Category not found. It may have already been deleted.');
    } else {
      alert('Failed to delete category: ' + (err.response?.data?.error || err.message));
    }
  }
};

  const handleCategoryToggle = (categoryName) => {
    const isSelected = formData.selectedCategories.includes(categoryName);
    
    if (isSelected) {
      const newSelectedCategories = formData.selectedCategories.filter(c => c !== categoryName);
      const newCategoryDetails = { ...formData.categoryDetails };
      delete newCategoryDetails[categoryName];
      
      setFormData({
        ...formData,
        selectedCategories: newSelectedCategories,
        categoryDetails: newCategoryDetails
      });
    } else {
      const newSelectedCategories = [...formData.selectedCategories, categoryName];
      const newCategoryDetails = {
        ...formData.categoryDetails,
        [categoryName]: {
          institution: '',
          email: '',
          phone: '',
          designation: '',
          company: '',
          doorNo: '',
          street: '',
          area: '',
          city: '',
          pincode: '',
          state: '',
          sameAsFirst: false
        }
      };
      
      setFormData({
        ...formData,
        selectedCategories: newSelectedCategories,
        categoryDetails: newCategoryDetails
      });
    }
  };

  const handleSameAsFirst = (categoryName) => {
    if (formData.selectedCategories.length === 0) return;
    
    const firstCategory = formData.selectedCategories[0];
    if (categoryName === firstCategory) return;
    
    const firstCategoryDetails = formData.categoryDetails[firstCategory];
    const currentDetails = formData.categoryDetails[categoryName];
    
    if (currentDetails.sameAsFirst) {
      setFormData({
        ...formData,
        categoryDetails: {
          ...formData.categoryDetails,
          [categoryName]: {
            institution: '',
            email: '',
            phone: '',
            designation: '',
            company: '',
            doorNo: '',
            street: '',
            area: '',
            city: '',
            pincode: '',
            state: '',
            sameAsFirst: false
          }
        }
      });
    } else {
      setFormData({
        ...formData,
        categoryDetails: {
          ...formData.categoryDetails,
          [categoryName]: {
            ...firstCategoryDetails,
            sameAsFirst: true
          }
        }
      });
    }
  };

  const handleCategoryFieldChange = (categoryName, field, value) => {
    setFormData({
      ...formData,
      categoryDetails: {
        ...formData.categoryDetails,
        [categoryName]: {
          ...formData.categoryDetails[categoryName],
          [field]: value
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.selectedCategories.length === 0) {
      alert('Please select at least one category');
      return;
    }

    try {
      const cleanedCategoryDetails = {};
      formData.selectedCategories.forEach(category => {
        if (formData.categoryDetails[category]) {
          const { sameAsFirst, ...details } = formData.categoryDetails[category];
          cleanedCategoryDetails[category] = details;
        }
      });

      const personPayload = {
        title: formData.title,
        name: formData.name,
        categoryDetails: cleanedCategoryDetails
      };

      if (editingPerson) {
        await axios.put(`${API_URL}/people/${editingPerson.id}`, personPayload);
      } else {
        await axios.post(`${API_URL}/people`, personPayload);
      }
      
      const peopleRes = await axios.get(`${API_URL}/people`);
      setPeople(peopleRes.data);
      
      resetForm();
    } catch (err) {
      console.error('Failed to save person', err);
      alert('Failed to save person: ' + (err.response?.data?.error || err.message));
    }
  };

  const resetForm = () => {
    setFormData({
      title: 'Mr',
      name: '',
      selectedCategories: [],
      categoryDetails: {}
    });
    setShowAddForm(false);
    setEditingPerson(null);
  };

  const handleEdit = async (person) => {
    try {
      const res = await axios.get(`${API_URL}/people/${person.id}`);
      const fullPerson = res.data;
      
      const categoryDetails = {};
      fullPerson.categoryDetails.forEach(detail => {
        categoryDetails[detail.category] = {
          institution: detail.institution || '',
          email: detail.email || '',
          phone: detail.phone || '',
          designation: detail.designation || '',
          company: detail.company || '',
          doorNo: detail.doorNo || '',
          street: detail.street || '',
          area: detail.area || '',
          city: detail.city || '',
          state: detail.state || '',
          pincode: detail.pincode || '',
          sameAsFirst: false
        };
      });
      
      const selectedCategories = fullPerson.categoryDetails.map(d => d.category);
      
      setFormData({
        title: fullPerson.title,
        name: fullPerson.name,
        selectedCategories: selectedCategories,
        categoryDetails: categoryDetails
      });
      
      setEditingPerson(person);
      setShowAddForm(true);
    } catch (err) {
      console.error('Failed to fetch person details:', err);
      alert('Failed to load person details for editing');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      try {
        await axios.delete(`${API_URL}/people/${id}`);
        const updatedPeople = people.filter(person => person.id !== id);
        setPeople(updatedPeople);
        setFilteredPeople(updatedPeople);
      } catch (err) {
        console.error('Failed to delete person', err);
      }
    }
  };

  const clearFilters = () => {
    setSelectedInstitution('');
    setSelectedCategory('');
    setSearchTerm('');
  };
  
  const getPrintData = () => {
    if (printCategory) {
      return people.filter(person => person.category && person.category.includes(printCategory));
    }
    return filteredPeople;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printData = getPrintData();
    const pages = [];
    
    for (let i = 0; i < printData.length; i += 6) {
      pages.push(printData.slice(i, i + 6));
    }

    let printContent = `
      <html>
        <head>
          <title>PSG Invitation List${printCategory ? ' - ' + printCategory : ''}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            .page { page-break-after: always; min-height: 100vh; padding: 20px; }
            .page:last-child { page-break-after: auto; }
            .header { text-align: center; color: #1e40af; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .category-header { text-align: center; color: #059669; font-size: 14px; margin-bottom: 15px; }
            .page-number { text-align: right; font-size: 12px; margin-bottom: 20px; }
            .person-container { margin-bottom: 20px; padding: 15px; border: 2px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9; }
            .person-name { font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #1e40af; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
            .person-detail { font-size: 12px; margin-bottom: 4px; color: #333; line-height: 1.4; }
            .person-detail strong { color: #555; font-weight: 600; }
            .address-section { background-color: #f0f0f0; padding: 8px; border-radius: 4px; margin-top: 8px; }
          </style>
        </head>
        <body>
    `;

    pages.forEach((pagePeople, pageIndex) => {
      printContent += `
        <div class="page">
          <h1 class="header">PSG Invitation Portal</h1>
          ${printCategory ? `<div class="category-header">Category: ${printCategory}</div>` : ''}
          <p class="page-number">Page ${pageIndex + 1} of ${pages.length}</p>
          
          ${pagePeople.map(person => `
            <div class="person-container">
              <div class="person-name">${person.title} ${person.name}</div>
              <div class="person-detail"><strong>Category:</strong> ${Array.isArray(person.category) ? person.category.join(', ') : person.category}</div>
              <div class="person-detail"><strong>Institution:</strong> ${person.institution || 'N/A'}</div>
              <div class="person-detail"><strong>Designation:</strong> ${person.designation || 'N/A'}</div>
              <div class="person-detail"><strong>Email:</strong> ${person.email || 'N/A'}</div>
              <div class="person-detail"><strong>Phone:</strong> ${person.phone || 'N/A'}</div>
              <div class="address-section">
                <div class="person-detail"><strong>Address:</strong></div>
                <div class="person-detail">Door No: ${person.doorNo || 'N/A'}</div>
                <div class="person-detail">Street: ${person.street || 'N/A'}</div>
                <div class="person-detail">Area: ${person.area || 'N/A'}</div>
                <div class="person-detail">City: ${person.city || 'N/A'}</div>
                <div class="person-detail">State: ${person.state || 'N/A'}</div>
                <div class="person-detail">Pincode: ${person.pincode || 'N/A'}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    });

    printContent += '</body></html>';

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const ViewDetailsModal = ({ person, onClose }) => {
    const [fullDetails, setFullDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchDetails = async () => {
        try {
          const res = await axios.get(`${API_URL}/people/${person.id}`);
          setFullDetails(res.data);
          setLoading(false);
        } catch (err) {
          console.error('Failed to fetch details:', err);
          setLoading(false);
        }
      };
      fetchDetails();
    }, [person.id]);

    if (loading) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8">
            <p>Loading...</p>
          </div>
        </div>
      );
    }

    if (!fullDetails) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {fullDetails.title} {fullDetails.name} - All Details
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {fullDetails.categoryDetails.map((detail, index) => (
              <div key={index} className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                <h3 className="text-lg font-bold text-blue-700 mb-4">
                  {detail.category}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-gray-700">Institution:</p>
                    <p className="text-gray-900">{detail.institution || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Designation:</p>
                    <p className="text-gray-900">{detail.designation || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Email:</p>
                    <p className="text-gray-900">{detail.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Phone:</p>
                    <p className="text-gray-900">{detail.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Company:</p>
                    <p className="text-gray-900">{detail.company || 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-white rounded border border-gray-200">
                  <p className="font-semibold text-gray-700 mb-2">Address:</p>
                  <p className="text-gray-900">
                    {detail.doorNo && `${detail.doorNo}, `}
                    {detail.street && `${detail.street}, `}
                    {detail.area && `${detail.area}, `}
                    {detail.city && `${detail.city}, `}
                    {detail.state && `${detail.state} - `}
                    {detail.pincode}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PrintPreview = () => {
    const printData = getPrintData();
    const pages = [];
    
    for (let i = 0; i < printData.length; i += 6) {
      pages.push(printData.slice(i, i + 6));
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full h-5/6 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Print Preview</h2>
              <p className="text-sm text-gray-600">
                {printData.length} people • {pages.length} page{pages.length !== 1 ? 's' : ''} • 6 persons per page
                {printCategory && ` • Category: ${printCategory}`}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2 text-white transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
              <button
                onClick={() => setShowPrintPreview(false)}
                className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-lg text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
            <div className="space-y-6">
              {pages.map((pagePeople, pageIndex) => (
                <div key={pageIndex} className="bg-white shadow-lg rounded-lg p-6 mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
                  <h1 className="text-center text-blue-900 text-lg font-bold mb-2">
                    PSG Invitation Portal
                  </h1>
                  {printCategory && (
                    <div className="text-center text-green-600 text-sm mb-3">
                      Category: {printCategory}
                    </div>
                  )}
                  <p className="text-right text-xs text-gray-500 mb-6">
                    Page {pageIndex + 1} of {pages.length}
                  </p>
                  
                  <div className="space-y-4">
                    {pagePeople.map(person => (
                      <div key={person.id} className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                        <div className="font-bold text-blue-900 mb-2 text-sm border-b border-gray-300 pb-1">
                          {person.title} {person.name}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 text-xs">
                          <div className="space-y-1">
                            <div><strong>Category:</strong> {Array.isArray(person.category) ? person.category.join(', ') : person.category}</div>
                            <div><strong>Designation:</strong> {person.designation}</div>
                            <div><strong>Email:</strong> {person.email}</div>
                            <div><strong>Phone:</strong> {person.phone}</div>
                          </div>
                          <div className="space-y-1">
                            <div><strong>Institution:</strong></div>
                            <div className="text-xs pl-2">{person.institution}</div>
                            <div className="mt-2">
                              <div><strong>Address:</strong></div>
                              <div className="bg-white p-2 rounded border text-xs space-y-1">
                                <div>Door No: {person.doorNo}</div>
                                <div>Street: {person.street}</div>
                                <div>Area: {person.area}</div>
                                <div>City: {person.city}</div>
                                <div>State: {person.state}</div>
                                <div>Pincode: {person.pincode}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">PSG Invitation Portal</h1>
                <p className="text-blue-200 mt-1">Manage college community invitations</p>
              </div>
            </div>
            <div className="flex space-x-2 flex-wrap">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Add Person</span>
              </button>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                value={printCategory}
                onChange={(e) => setPrintCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <button
                onClick={() => setShowPrintPreview(true)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Eye className="h-5 w-5" />
                <span>Preview & Print</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Total People</h3>
                <p className="text-3xl font-bold text-blue-600">{people.length}</p>
              </div>
              <UserCheck className="h-12 w-12 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Categories</h3>
            <p className="text-3xl font-bold text-green-600">{categories.length}</p>
          </div>
          <Users className="h-12 w-12 text-green-500" />
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Institutions</h3>
            <p className="text-3xl font-bold text-purple-600">{institutions.length}</p>
          </div>
          <Building className="h-12 w-12 text-purple-500" />
        </div>
      </div>
    </div>

    {/* UPDATED FILTER BAR - NO CATEGORY DROPDOWN */}
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-48"
          value={selectedInstitution}
          onChange={(e) => setSelectedInstitution(e.target.value)}
        >
          <option value="">All Institutions</option>
          {institutions.map(institution => (
            <option key={institution} value={institution}>
              {institution.split('(')[0].trim()} ({getInstitutionCount(institution)})
            </option>
          ))}
        </select>

        {(selectedInstitution || selectedCategory || searchTerm) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    </div>

    {/* CATEGORY OVERVIEW WITH ADD AND DELETE BUTTONS */}
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Category Overview</h2>
        <button
          onClick={() => setShowAddCategoryForm(true)}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center space-x-2 text-white transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>
      
      {selectedCategory && (
        <div className="mb-4 flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-lg">
          <span className="text-sm font-medium text-blue-800">
            Filtered by: {selectedCategory}
          </span>
          <button
            onClick={() => setSelectedCategory('')}
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map(category => (
          <div
            key={category}
            className={`p-4 border-2 rounded-lg transition-all relative group ${
              selectedCategory === category
                ? 'bg-blue-100 border-blue-500 shadow-md'
                : 'border-gray-200 hover:bg-blue-50 hover:border-blue-300'
            }`}
          >
            {/* Delete button - shows on hover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCategory(category);
              }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white p-1 rounded"
              title="Delete Category"
            >
              <Trash2 className="h-3 w-3" />
            </button>

            {/* Category card content - clickable */}
            <div 
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category)}
            >
              <h3 className="font-semibold text-gray-800 text-sm mb-2 pr-6">{category}</h3>
              <p className="text-2xl font-bold text-blue-600">{getCategoryCount(category)}</p>
              <p className="text-xs text-gray-500 mt-1">Click to filter</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* TABLE - SHOWS ONLY WHEN FILTERS APPLIED */}
    {(selectedCategory || selectedInstitution || searchTerm) && (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            Filtered Results ({filteredPeople.length})
          </h2>
          {selectedCategory && (
            <p className="text-sm text-gray-600 mt-1">Category: {selectedCategory}</p>
          )}
          {selectedInstitution && (
            <p className="text-sm text-gray-600 mt-1">Institution: {selectedInstitution}</p>
          )}
          {searchTerm && (
            <p className="text-sm text-gray-600 mt-1">Search: {searchTerm}</p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPeople.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No people found</p>
                    <p className="text-sm">Try adjusting your search criteria</p>
                  </td>
                </tr>
              ) : (
                filteredPeople.map(person => (
                  <tr key={person.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{person.title} {person.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {selectedCategory ? selectedCategory : (Array.isArray(person.category) ? person.category.join(', ') : person.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={person.institution}>
                        {person.institution || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{person.designation || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{person.email || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{person.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={getFullAddress(person)}>
                        {getFullAddress(person)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setViewingPerson(person);
                            setShowViewDetails(true);
                          }}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="View All Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(person)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(person.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>

  {/* ADD CATEGORY MODAL */}
  {showAddCategoryForm && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Add New Category</h2>
        </div>

        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category Name *
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="e.g., Research Scholars"
          />
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
          <button
            onClick={() => {
              setShowAddCategoryForm(false);
              setNewCategoryName('');
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddCategory}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Add Category
          </button>
        </div>
      </div>
    </div>
  )}

  {/* ADD/EDIT PERSON FORM */}
  {showAddForm && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full my-8">
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {editingPerson ? 'Edit Person' : 'Add New Person'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                >
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Miss">Miss</option>
                  <option value="Dr">Dr</option>
                  <option value="Prof">Prof</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Select Categories * (Select one or more)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map(category => (
                <label key={category} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.selectedCategories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {formData.selectedCategories.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Category-Specific Details
              </h3>
              
              {formData.selectedCategories.map((category, index) => (
                <div key={category} className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-bold text-blue-700">
                      {index + 1}. {category}
                    </h4>
                    
                    {index > 0 && (
                      <label className="flex items-center space-x-2 cursor-pointer bg-blue-100 px-3 py-1 rounded-lg">
                        <input
                          type="checkbox"
                          checked={formData.categoryDetails[category]?.sameAsFirst || false}
                          onChange={() => handleSameAsFirst(category)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <Copy className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                          Same as {formData.selectedCategories[0]}
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Institution
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        value={formData.categoryDetails[category]?.institution || ''}
                        onChange={(e) => handleCategoryFieldChange(category, 'institution', e.target.value)}
                        disabled={formData.categoryDetails[category]?.sameAsFirst && index > 0}
                      >
                        <option value="">Select Institution</option>
                        {institutions.map(inst => (
                          <option key={inst} value={inst}>{inst}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.categoryDetails[category]?.email || ''}
                        onChange={(e) => handleCategoryFieldChange(category, 'email', e.target.value)}
                        disabled={formData.categoryDetails[category]?.sameAsFirst && index > 0}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.categoryDetails[category]?.phone || ''}
                        onChange={(e) => handleCategoryFieldChange(category, 'phone', e.target.value)}
                        disabled={formData.categoryDetails[category]?.sameAsFirst && index > 0}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Designation *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.categoryDetails[category]?.designation || ''}
                        onChange={(e) => handleCategoryFieldChange(category, 'designation', e.target.value)}
                        disabled={formData.categoryDetails[category]?.sameAsFirst && index > 0}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.categoryDetails[category]?.company || ''}
                        onChange={(e) => handleCategoryFieldChange(category, 'company', e.target.value)}
                        disabled={formData.categoryDetails[category]?.sameAsFirst && index > 0}
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                    <h5 className="font-medium text-gray-700 mb-3">Address Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Door No. *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.categoryDetails[category]?.doorNo || ''}
                          onChange={(e) => handleCategoryFieldChange(category, 'doorNo', e.target.value)}
                          placeholder="e.g., 123"
                          disabled={formData.categoryDetails[category]?.sameAsFirst && index > 0}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.categoryDetails[category]?.street || ''}
                          onChange={(e) => handleCategoryFieldChange(category, 'street', e.target.value)}
                          placeholder="e.g., Main Street"
                          disabled={formData.categoryDetails[category]?.sameAsFirst && index > 0}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Area *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.categoryDetails[category]?.area || ''}
                          onChange={(e) => handleCategoryFieldChange(category, 'area', e.target.value)}
                          placeholder="e.g., Peelamedu"
                          disabled={formData.categoryDetails[category]?.sameAsFirst && index > 0}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          required
                          pattern="[0-9]{6}"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.categoryDetails[category]?.pincode || ''}
                          onChange={(e) => handleCategoryFieldChange(category, 'pincode', e.target.value)}
                          placeholder="e.g., 641004"
                          disabled={formData.categoryDetails[category]?.sameAsFirst && index > 0}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.categoryDetails[category]?.city || ''}
                          onChange={(e) => handleCategoryFieldChange(category, 'city', e.target.value)}
                          placeholder="e.g., Coimbatore"
                          disabled={formData.categoryDetails[category]?.sameAsFirst && index > 0}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={formData.categoryDetails[category]?.state || ''}
                          onChange={(e) => handleCategoryFieldChange(category, 'state', e.target.value)}
                          placeholder="e.g., Tamil Nadu"
                          disabled={formData.categoryDetails[category]?.sameAsFirst && index > 0}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={formData.selectedCategories.length === 0}
            >
              {editingPerson ? 'Update Person' : 'Add Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {showPrintPreview && <PrintPreview />}
  {showViewDetails && viewingPerson && (
    <ViewDetailsModal 
      person={viewingPerson} 
      onClose={() => {
        setShowViewDetails(false);
        setViewingPerson(null);
      }} 
    />
  )}
</div>
  );
};
export default InvitPortal;