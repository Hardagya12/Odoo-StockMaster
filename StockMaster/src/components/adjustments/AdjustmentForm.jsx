import React, { useState, useEffect } from 'react';
import { adjustmentService, warehouseService } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import Select from '../ui/Select';
import AdjustmentItems from './AdjustmentItems';
import Badge from '../ui/Badge';

const AdjustmentForm = ({ adjustment, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        warehouseId: '',
        reason: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [items, setItems] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadWarehouses();
        if (adjustment) {
            setFormData({
                warehouseId: adjustment.warehouseId || '',
                reason: adjustment.reason || '',
                date: adjustment.date ? new Date(adjustment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            });
            setItems(adjustment.stockMoves?.map(move => ({
                productId: move.productId,
                product: move.product,
                locationId: move.destinationLocationId,
                location: move.destinationLocation,
                quantity: move.quantity
            })) || []);
        }
    }, [adjustment]);

    const loadWarehouses = async () => {
        try {
            const data = await warehouseService.getAll();
            setWarehouses(data);
        } catch (error) {
            console.error('Error loading warehouses:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleValidate = async () => {
        if (!adjustment) return;
        try {
            setLoading(true);
            await adjustmentService.validate(adjustment.id);
            onSuccess();
        } catch (error) {
            setError(error.response?.data?.message || 'Error validating adjustment');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (items.length === 0) {
            setError('Please add at least one product');
            setLoading(false);
            return;
        }

        try {
            const submitData = {
                ...formData,
                warehouseId: parseInt(formData.warehouseId),
                date: formData.date || new Date(),
                items: items.map(item => ({
                    productId: item.productId,
                    locationId: item.locationId || null,
                    quantity: parseInt(item.quantity)
                }))
            };

            if (adjustment) {
                await adjustmentService.update(adjustment.id, submitData);
            } else {
                await adjustmentService.create(submitData);
            }
            onSuccess();
        } catch (error) {
            setError(error.response?.data?.message || 'Error saving adjustment');
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

            {adjustment && (
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <Label>Reference</Label>
                        <div className="font-black text-xl">{adjustment.reference}</div>
                    </div>
                    <Badge status={adjustment.status} />
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="warehouseId">Warehouse *</Label>
                    <Select
                        id="warehouseId"
                        name="warehouseId"
                        value={formData.warehouseId}
                        onChange={handleChange}
                        required
                        disabled={!!adjustment}
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
                    <Label htmlFor="date">Date</Label>
                    <Input
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="reason">Reason</Label>
                <Input
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    placeholder="e.g., Physical count, Damage, etc."
                />
            </div>

            <div>
                <Label>Products</Label>
                <AdjustmentItems
                    items={items}
                    setItems={setItems}
                    warehouseId={formData.warehouseId}
                />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t-3 border-black">
                <Button type="button" variant="outline" onClick={onCancel}>
                    {adjustment ? 'Close' : 'Cancel'}
                </Button>
                {adjustment && adjustment.status === 'DRAFT' && (
                    <Button type="button" variant="primary" onClick={handleValidate} disabled={loading}>
                        TODO
                    </Button>
                )}
                {adjustment && adjustment.status === 'READY' && (
                    <Button type="button" variant="primary" onClick={handleValidate} disabled={loading}>
                        Validate
                    </Button>
                )}
                {!adjustment && (
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Create'}
                    </Button>
                )}
            </div>
        </form>
    );
};

export default AdjustmentForm;

