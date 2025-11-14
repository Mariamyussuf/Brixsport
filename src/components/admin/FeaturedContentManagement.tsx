'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Calendar, 
  ArrowUp, 
  ArrowDown,
  Eye,
  MousePointerClick
} from 'lucide-react';
import featuredContentService from '@/services/featuredContentService';
import featuredContentStorageService from '@/services/featuredContentStorageService';
import { FeaturedContent, CreateFeaturedContentInput } from '@/types/featuredContent';

const FeaturedContentManagement: React.FC = () => {
  const [featuredContentItems, setFeaturedContentItems] = useState<FeaturedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<FeaturedContent | CreateFeaturedContentInput | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all featured content items
  const fetchFeaturedContent = async () => {
    try {
      setLoading(true);
      const items = await featuredContentService.getAllFeaturedContent();
      setFeaturedContentItems(items);
    } catch (err) {
      setError('Failed to fetch featured content items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize component
  useEffect(() => {
    fetchFeaturedContent();
  }, []);

  // Handle create new item
  const handleCreate = () => {
    setIsEditing(true);
    setCurrentItem({
      title: '',
      description: '',
      link: '',
      priority: 0,
      active: true,
      start_date: null,
      end_date: null,
      ab_test_variant: null
    });
    setImagePreview(null);
  };

  // Handle edit item
  const handleEdit = (item: FeaturedContent) => {
    setIsEditing(true);
    setCurrentItem(item);
    setImagePreview(item.image_url || null);
  };

  // Handle delete item
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this featured content item?')) {
      return;
    }

    try {
      await featuredContentService.deleteFeaturedContent(id);
      await fetchFeaturedContent(); // Refresh the list
    } catch (err) {
      setError('Failed to delete featured content item');
      console.error(err);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    if (currentItem) {
      setCurrentItem({
        ...currentItem,
        [field]: value
      });
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await featuredContentStorageService.uploadImage(file);
      setImagePreview(imageUrl);
      handleInputChange('image_url', imageUrl);
    } catch (err) {
      setError('Failed to upload image');
      console.error(err);
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentItem) return;

    try {
      if ('id' in currentItem) {
        // Update existing item
        await featuredContentService.updateFeaturedContent(currentItem.id, currentItem);
      } else {
        // Create new item
        await featuredContentService.createFeaturedContent(currentItem);
      }
      
      setIsEditing(false);
      setCurrentItem(null);
      setImagePreview(null);
      await fetchFeaturedContent(); // Refresh the list
    } catch (err) {
      setError('Failed to save featured content item');
      console.error(err);
    }
  };

  // Move item up in priority
  const moveUp = async (id: string, currentIndex: number) => {
    if (currentIndex === 0) return;
    
    try {
      const item = featuredContentItems[currentIndex];
      const previousItem = featuredContentItems[currentIndex - 1];
      
      // Swap priorities
      await featuredContentService.updateFeaturedContent(item.id, { priority: previousItem.priority });
      await featuredContentService.updateFeaturedContent(previousItem.id, { priority: item.priority });
      
      await fetchFeaturedContent(); // Refresh the list
    } catch (err) {
      setError('Failed to update priority');
      console.error(err);
    }
  };

  // Move item down in priority
  const moveDown = async (id: string, currentIndex: number) => {
    if (currentIndex === featuredContentItems.length - 1) return;
    
    try {
      const item = featuredContentItems[currentIndex];
      const nextItem = featuredContentItems[currentIndex + 1];
      
      // Swap priorities
      await featuredContentService.updateFeaturedContent(item.id, { priority: nextItem.priority });
      await featuredContentService.updateFeaturedContent(nextItem.id, { priority: item.priority });
      
      await fetchFeaturedContent(); // Refresh the list
    } catch (err) {
      setError('Failed to update priority');
      console.error(err);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <div className="text-red-800">{error}</div>
          <Button 
            onClick={fetchFeaturedContent} 
            className="mt-4 bg-red-600 hover:bg-red-700"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Content Management</h2>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add New Featured Content
        </Button>
      </div>

      {/* Edit Form */}
      {isEditing && currentItem && (
        <Card>
          <CardHeader>
            <CardTitle>
              {currentItem && 'id' in currentItem ? 'Edit Featured Content' : 'Create Featured Content'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={currentItem.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="link">Link</Label>
                  <Input
                    id="link"
                    value={currentItem.link}
                    onChange={(e) => handleInputChange('link', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={currentItem.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={currentItem.priority}
                    onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <div className="relative">
                    <Input
                      id="start_date"
                      type="date"
                      value={currentItem.start_date ? new Date(currentItem.start_date).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleInputChange('start_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                    />
                    <Calendar className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <div className="relative">
                    <Input
                      id="end_date"
                      type="date"
                      value={currentItem.end_date ? new Date(currentItem.end_date).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleInputChange('end_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                    />
                    <Calendar className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ab_test_variant">A/B Test Variant</Label>
                  <Input
                    id="ab_test_variant"
                    value={currentItem.ab_test_variant || ''}
                    onChange={(e) => handleInputChange('ab_test_variant', e.target.value || null)}
                    placeholder="Optional variant identifier"
                  />
                </div>
                
                <div className="space-y-2 flex items-end">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={currentItem.active}
                      onCheckedChange={(checked: boolean) => handleInputChange('active', checked)}
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex items-start space-x-4">
                  {imagePreview && (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      onClick={triggerFileInput}
                      variant="outline"
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                    </Button>
                    {imagePreview && (
                      <Button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          handleInputChange('image_url', '');
                        }}
                        variant="ghost"
                        className="w-full mt-2 text-red-600 hover:text-red-700"
                      >
                        Remove Image
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <CardFooter className="px-0 pb-0 flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setCurrentItem(null);
                    setImagePreview(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Save
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Featured Content List */}
      {!isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Featured Content Items</CardTitle>
          </CardHeader>
          <CardContent>
            {featuredContentItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No featured content items found. Create your first item to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {featuredContentItems.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start space-x-4">
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.title} 
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{item.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Priority: {item.priority}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {item.active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Eye className="w-3 h-3 mr-1" />
                            {item.view_count}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <MousePointerClick className="w-3 h-3 mr-1" />
                            {item.click_count}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {item.start_date && (
                            <span>Start: {formatDate(item.start_date)}</span>
                          )}
                          {item.end_date && (
                            <span className="ml-2">End: {formatDate(item.end_date)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveUp(item.id, index)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveDown(item.id, index)}
                        disabled={index === featuredContentItems.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeaturedContentManagement;