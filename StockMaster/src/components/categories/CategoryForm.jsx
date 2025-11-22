import React, { useState, useEffect } from 'react';
import { categoryService } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import Select from '../ui/Select';

const CategoryForm = ({ category, categories, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parentId: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                description: category.description || '',
                parentId: category.parentId || ''
            });
        }
    }, [category]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const submitData = {
                ...formData,
                parentId: formData.parentId ? parseInt(formData.parentId) : null
            };

            if (category) {
                await categoryService.update(category.id, submitData);
            } else {
                await categoryService.create(submitData);
            }
            onSuccess();
        } catch (error) {
            setError(error.response?.data?.message || 'Error saving category');
        } finally {
            setLoading(false);
        }
    };

    // Filter out current category and its children from parent options
    const availableParents = categories.filter(cat => 
        !category || (cat.id !== category.id && cat.parentId !== category.id)
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-100 border-3 border-red-500 rounded-neo p-3 text-red-800 font-bold">
                    {error}
                </div>
            )}

            <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-3 border-black rounded-neo shadow-neo font-bold min-h-[100px]"
                />
            </div>

            <div>
                <Label htmlFor="parentId">Parent Category</Label>
                <Select
                    id="parentId"
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleChange}
                >
                    <option value="">None (Top Level)</option>
                    {availableParents.map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </Select>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t-3 border-black">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Saving...' : category ? 'Update' : 'Create'}
                </Button>
            </div>
        </form>
    );
};

export default CategoryForm;

