import React, { useState, useEffect } from 'react';
import { warehouseService } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

const WarehouseForm = ({ warehouse, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        capacity: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (warehouse) {
            setFormData({
                name: warehouse.name || '',
                code: warehouse.code || '',
                address: warehouse.address || '',
                capacity: warehouse.capacity || ''
            });
        }
    }, [warehouse]);

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
                capacity: formData.capacity ? parseInt(formData.capacity) : null
            };

            if (warehouse) {
                await warehouseService.update(warehouse.id, submitData);
            } else {
                await warehouseService.create(submitData);
            }
            onSuccess();
        } catch (error) {
            setError(error.response?.data?.message || 'Error saving warehouse');
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
                <Label htmlFor="code">Short Code *</Label>
                <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    placeholder="e.g., WW"
                />
            </div>

            <div>
                <Label htmlFor="address">Address</Label>
                <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-3 border-black rounded-neo shadow-neo font-bold min-h-[100px]"
                />
            </div>

            <div>
                <Label htmlFor="capacity">Capacity (Optional)</Label>
                <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={handleChange}
                />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t-3 border-black">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Saving...' : warehouse ? 'Update' : 'Create'}
                </Button>
            </div>
        </form>
    );
};

export default WarehouseForm;

