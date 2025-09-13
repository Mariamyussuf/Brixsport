// src/components/CreateCompetitionForm.tsx

import React, { useState } from 'react';
import CompetitionService from '@/services/competitionService';

interface FormData {
  name: string;
  type: string;
  category: string;
  start_date: string;
  end_date: string;
}

const CreateCompetitionForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'football',
    category: '',
    start_date: '',
    end_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await CompetitionService.createCompetition(formData);
      alert('Competition created successfully!');
      // Reset form
      setFormData({
        name: '',
        type: 'football',
        category: '',
        start_date: '',
        end_date: '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Competition Name:</label>
        <input 
          type="text" 
          id="name"
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          placeholder="Competition Name" 
          required 
        />
      </div>
      
      <div>
        <label htmlFor="type">Type:</label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
        >
          <option value="football">Football</option>
          <option value="basketball">Basketball</option>
          <option value="track">Track</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="category">Category:</label>
        <input 
          type="text" 
          id="category"
          name="category" 
          value={formData.category} 
          onChange={handleChange} 
          placeholder="Category" 
          required 
        />
      </div>
      
      <div>
        <label htmlFor="start_date">Start Date:</label>
        <input 
          type="date" 
          id="start_date"
          name="start_date" 
          value={formData.start_date} 
          onChange={handleChange} 
          required 
        />
      </div>
      
      <div>
        <label htmlFor="end_date">End Date:</label>
        <input 
          type="date" 
          id="end_date"
          name="end_date" 
          value={formData.end_date} 
          onChange={handleChange} 
          required 
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Competition'}
      </button>
      
      {error && <div className="error">{error}</div>}
    </form>
  );
};

export default CreateCompetitionForm;