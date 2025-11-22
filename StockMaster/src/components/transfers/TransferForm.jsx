import React, { useState, useEffect } from 'react';
import { transferService, locationService, productService } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import Select from '../ui/Select';
import TransferItems from './TransferItems';
import Badge from '../ui/Badge';

const TransferForm = ({ transfer, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        sourceLocationId: '',
        destinationLocationId: '',
        scheduledDate: ''
    });
    const [items, setItems] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadLocations();
        if (transfer) {
            setFormData({
                sourceLocationId: transfer.sourceLocationId || '',
                destinationLocationId: transfer.destinationLocationId || '',
                scheduledDate: transfer.scheduledDate ? new Date(transfer.scheduledDate).toISOString().split('T')[0] : ''
            });
            setItems(transfer.stockMoves?.map(move => ({
                productId: move.productId,
                product: move.product,
                quantity: move.quantity
            })) || []);
        }
    }, [transfer]);

    const loadLocations = async () => {
        try {
            const data = await locationService.getAll();
            setLocations(data);
        } catch (error) {
            console.error('Error loading locations:', error);
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
        if (!transfer) return;
        try {
            setLoading(true);
            await transferService.validate(transfer.id);
            onSuccess();
        } catch (error) {
            setError(error.response?.data?.message || 'Error validating transfer');
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
                sourceLocationId: parseInt(formData.sourceLocationId),
                destinationLocationId: parseInt(formData.destinationLocationId),
                scheduledDate: formData.scheduledDate || null,
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: parseInt(item.quantity)
                }))
            };

            if (transfer) {
                await transferService.update(transfer.id, submitData);
            } else {
                await transferService.create(submitData);
            }
            onSuccess();
        } catch (error) {
            setError(error.response?.data?.message || 'Error saving transfer');
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

            {transfer && (
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <Label>Reference</Label>
                        <div className="font-black text-xl">{transfer.reference}</div>
                    </div>
                    <Badge status={transfer.status} />
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="sourceLocationId">Source Location *</Label>
                    <Select
                        id="sourceLocationId"
                        name="sourceLocationId"
                        value={formData.sourceLocationId}
                        onChange={handleChange}
                        required
                        disabled={!!transfer}
                    >
                        <option value="">Select Source Location</option>
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>
                                {loc.name} ({loc.warehouse?.code})
                            </option>
                        ))}
                    </Select>
                </div>

                <div>
                    <Label htmlFor="destinationLocationId">Destination Location *</Label>
                    <Select
                        id="destinationLocationId"
                        name="destinationLocationId"
                        value={formData.destinationLocationId}
                        onChange={handleChange}
                        required
                        disabled={!!transfer}
                    >
                        <option value="">Select Destination Location</option>
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>
                                {loc.name} ({loc.warehouse?.code})
                            </option>
                        ))}
                    </Select>
                </div>
            </div>

            <div>
                <Label htmlFor="scheduledDate">Schedule Date</Label>
                <Input
                    id="scheduledDate"
                    name="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={handleChange}
                />
            </div>

            <div>
                <Label>Products</Label>
                <TransferItems
                    items={items}
                    setItems={setItems}
                    sourceLocationId={formData.sourceLocationId}
                />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t-3 border-black">
                <Button type="button" variant="outline" onClick={onCancel}>
                    {transfer ? 'Close' : 'Cancel'}
                </Button>
                {transfer && transfer.status === 'DRAFT' && (
                    <Button type="button" variant="primary" onClick={handleValidate} disabled={loading}>
                        TODO
                    </Button>
                )}
                {transfer && transfer.status === 'READY' && (
                    <Button type="button" variant="primary" onClick={handleValidate} disabled={loading}>
                        Validate
                    </Button>
                )}
                {!transfer && (
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Create'}
                    </Button>
                )}
            </div>
        </form>
    );
};

export default TransferForm;
