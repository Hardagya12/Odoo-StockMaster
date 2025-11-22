import React, { useState, useEffect } from 'react';
import { locationService } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import Select from '../ui/Select';

const LocationForm = ({ location, warehouses, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        warehouseId: '',
        type: 'ZONE'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (location) {
            setFormData({
                name: location.name || '',
                code: location.code || '',
                warehouseId: location.warehouseId || '',
                type: location.type || 'ZONE'
            });
        }
    }, [location]);

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
                warehouseId: parseInt(formData.warehouseId)
            };

            if (location) {
                await locationService.update(location.id, submitData);
            } else {
                await locationService.create(submitData);
            }
            onSuccess();
        } catch (error) {
            setError(error.response?.data?.message || 'Error saving location');
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
                />
            </div>

            <div>
                <Label htmlFor="warehouseId">Warehouse *</Label>
                <Select
                    id="warehouseId"
                    name="warehouseId"
                    value={formData.warehouseId}
                    onChange={handleChange}
                    required
                    disabled={!!location}
                >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(wh => (
                        <option key={wh.id} value={wh.id}>
                            {wh.name} ({wh.code})
                        </option>
                    ))}
                </Select>
            </div>

            <div>
                <Label htmlFor="type">Type</Label>
                <Select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                >
                    <option value="ZONE">Zone</option>
                    <option value="RACK">Rack</option>
                    <option value="SHELF">Shelf</option>
                    <option value="BIN">Bin</option>
                </Select>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t-3 border-black">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Saving...' : location ? 'Update' : 'Create'}
                </Button>
            </div>
        </form>
    );
};

export default LocationForm;

