import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/psg-logo.png';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const HomePage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, instRes] = await Promise.all([
          axios.get(`${API_URL}/categories`),
          axios.get(`${API_URL}/institutions`)
        ]);
        setCategories(catRes.data);
        setInstitutions(instRes.data);
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={styles.container}>
      {/* Logo */}
      <img src={logo} alt="Platinum Jubilee Logo" style={styles.logo} />

      {/* Button to Invitation Portal */}
      <button
        style={styles.button}
        onClick={() => navigate('/invit-portal')}
      >
        Invitation-Portal
      </button>

      <div style={styles.listsContainer}>
        {/* Categories */}
        <div style={styles.listBox}>
          <h2 style={styles.listTitle}>Categories</h2>
          <ul>
            {categories.map((cat, index) => (
              <li key={index} style={styles.listItem}>{cat}</li>
            ))}
          </ul>
        </div>

        {/* Institutions */}
        <div style={styles.listBox}>
          <h2 style={styles.listTitle}>Institutions</h2>
          <ul>
            {institutions.map((inst, index) => (
              <li key={index} style={styles.listItem}>{inst}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center',
    padding: '50px 20px',
    fontFamily: 'Arial, sans-serif',
  },
  logo: {
    width: '400px',        // bigger logo
    maxWidth: '80%',       // responsive
    margin: '0 auto 30px', // centers horizontally and adds spacing below
    display: 'block',
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#0072E5',
    color: 'white',
    cursor: 'pointer',
    marginBottom: '50px',
  },
  listsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    maxWidth: '900px',
    margin: '0 auto',
    gap: '50px',
    flexWrap: 'wrap',
  },
  listBox: {
    textAlign: 'left',
    flex: 1,
    minWidth: '250px',
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  listTitle: {
    fontSize: '20px',
    marginBottom: '15px',
    color: '#1e40af',
  },
  listItem: {
    fontSize: '16px',
    marginBottom: '8px',
  }
};

export default HomePage;