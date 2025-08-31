'use client';

import React, { useState, useEffect } from 'react';
import { Competition } from '@/lib/api';
import { getActiveCompetitions } from '@/lib/competitionsService';
import { groupCompetitionsByType, formatCompetitionDateRange } from '@/lib/apiUtils';

const CompetitionsDemo: React.FC = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [groupedCompetitions, setGroupedCompetitions] = useState<Record<string, Competition[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getActiveCompetitions();
        setCompetitions(data);
        
        const grouped = groupCompetitionsByType(data);
        setGroupedCompetitions(grouped);
        
        // Set default selected type if competitions exist
        if (data.length > 0 && Object.keys(grouped).length > 0) {
          setSelectedType(Object.keys(grouped)[0]);
        }
      } catch (err) {
        setError('Failed to load competitions. Please try again.');
        console.error('Error fetching competitions:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompetitions();
  }, []);
  
  // Get unique sport types
  const sportTypes = Object.keys(groupedCompetitions);
  
  // Get competitions for selected type
  const filteredCompetitions = selectedType ? groupedCompetitions[selectedType] || [] : [];
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Active Competitions</h2>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : competitions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No active competitions found.
        </div>
      ) : (
        <>
          {/* Sport Type Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {sportTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    selectedType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Competitions List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompetitions.map(competition => (
              <div 
                key={competition.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{competition.name}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {competition.category}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <span className="w-20 font-medium">Type:</span>
                      <span>{competition.type}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="w-20 font-medium">Status:</span>
                      <span className="capitalize">{competition.status}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="w-20 font-medium">Date:</span>
                      <span>{formatCompetitionDateRange(competition)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CompetitionsDemo;