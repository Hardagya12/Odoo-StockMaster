import React, { useState, useEffect } from 'react';
import { productService, categoryService } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import Select from '../ui/Select';

const ProductForm = ({ product, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        description: '',
        categoryId: '',
        unitOfMeasure: '',
        unitPrice: 0,
        minStock: 0,
        isActive: true
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadCategories();
        if (product) {
            setFormData({
                sku: product.sku || '',
                name: product.name || '',
                description: product.description || '',
                categoryId: product.categoryId || '',
                unitOfMeasure: product.unitOfMeasure || '',
                unitPrice: product.unitPrice || 0,
                minStock: product.minStock || 0,
                isActive: product.isActive !== undefined ? product.isActive : true
            });
        }
    }, [product]);

    const loadCategories = async () => {
        try {
            const data = await categoryService.getAll();
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const submitData = {
                ...formData,
                categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
                unitPrice: parseFloat(formData.unitPrice) || 0,
                minStock: parseInt(formData.minStock) || 0
            };

            if (product) {
                await productService.update(product.id, submitData);
            } else {
                await productService.create(submitData);
            }
            onSuccess();
        } catch (error) {
            setError(error.response?.data?.message || 'Error saving product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-100 border-3 border-red-500 rounded-neo p-3 text-red-800 font-bold">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="sku">SKU / Code *</Label>
                    <Input
                        id="sku"
                        name="sku"
                        value={formData.sku}
                        onChange={handleChange}
                        required
                    />
                </div>

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

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="categoryId">Category</Label>
                    <Select
                        id="categoryId"
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                    >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </Select>
                </div>

                <div>
                    <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
                    <Input
                        id="unitOfMeasure"
                        name="unitOfMeasure"
                        value={formData.unitOfMeasure}
                        onChange={handleChange}
                        placeholder="kg, pcs, liter, etc."
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="unitPrice">Unit Price</Label>
                    <Input
                        id="unitPrice"
                        name="unitPrice"
                        type="number"
                        step="0.01"
                        value={formData.unitPrice}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <Label htmlFor="minStock">Min Stock (Reordering Level)</Label>
                    <Input
                        id="minStock"
                        name="minStock"
                        type="number"
                        value={formData.minStock}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-5 h-5 border-3 border-black"
                />
                <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t-3 border-black">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Saving...' : product ? 'Update' : 'Create'}
                </Button>
            </div>
        </form>
    );
};

export default ProductForm;

