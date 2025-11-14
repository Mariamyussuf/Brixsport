'use client';

import React, { useState, useEffect } from 'react';
import featuredContentService from '@/services/featuredContentService';
import { FeaturedContent } from '@/types/featuredContent';

interface FeaturedContentDisplayProps {
  variant?: string; // For A/B testing support
}

const FeaturedContentDisplay: React.FC<FeaturedContentDisplayProps> = ({ variant }) => {
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        setLoading(true);
        const items = await featuredContentService.getActiveFeaturedContent();
        
        // Filter by variant if specified
        let filteredItems = items;
        if (variant) {
          filteredItems = items.filter(item => item.ab_test_variant === variant);
        }
        
        // Get the highest priority item
        const topItem = filteredItems.length > 0 ? filteredItems[0] : null;
        setFeaturedContent(topItem);
        
        // Increment view count if we have an item
        if (topItem) {
          await featuredContentService.incrementViewCount(topItem.id);
        }
      } catch (err) {
        setError('Failed to load featured content');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedContent();
  }, [variant]);

  const handleContentClick = async () => {
    if (featuredContent) {
      // Increment click count
      await featuredContentService.incrementClickCount(featuredContent.id);
      
      // Open the link in a new tab
      window.open(featuredContent.link, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-200 dark:bg-gray-700 rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-4"></div>
        <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl shadow-lg p-6">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  if (!featuredContent) {
    return null; // Don't show anything if there's no featured content
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Featured</h2>
      <div 
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white cursor-pointer hover:opacity-90 transition-opacity"
        onClick={handleContentClick}
      >
        {featuredContent.image_url && (
          <div className="mb-4">
            <img 
              src={featuredContent.image_url} 
              alt={featuredContent.title} 
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}
        <h3 className="text-2xl font-bold mb-2">{featuredContent.title}</h3>
        <p className="mb-4 opacity-90">{featuredContent.description}</p>
        <button className="bg-white text-blue-600 font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors">
          Learn More
        </button>
      </div>
    </section>
  );
};

export default FeaturedContentDisplay;