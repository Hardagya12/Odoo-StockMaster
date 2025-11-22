import React, { useState, useEffect } from 'react';
import { deliveryService, warehouseService } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import Select from '../ui/Select';
import DeliveryItems from './DeliveryItems';
import Badge from '../ui/Badge';

const DeliveryForm = ({ delivery, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        warehouseId: '',
        customer: '',
        sourceDoc: '',
        scheduledDate: '',
        deliveryAddress: ''
    });
    const [items, setItems] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadWarehouses();
        if (delivery) {
            setFormData({
                warehouseId: delivery.warehouseId || '',
                customer: delivery.customer || '',
                sourceDoc: delivery.sourceDoc || '',
                scheduledDate: delivery.scheduledDate ? new Date(delivery.scheduledDate).toISOString().split('T')[0] : '',
                deliveryAddress: ''
            });
            setItems(delivery.stockMoves?.map(move => ({
                productId: move.productId,
                product: move.product,
                locationId: move.sourceLocationId,
                location: move.sourceLocation,
                quantity: move.quantity
            })) || []);
        }
    }, [delivery]);

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
        if (!delivery) return;
        try {
            setLoading(true);
            await deliveryService.validate(delivery.id);
            onSuccess();
        } catch (error) {
            setError(error.response?.data?.message || 'Error validating delivery');
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
                scheduledDate: formData.scheduledDate || null,
                items: items.map(item => ({
                    productId: item.productId,
                    locationId: item.locationId || null,
                    quantity: parseInt(item.quantity)
                }))
            };

            if (delivery) {
                await deliveryService.update(delivery.id, submitData);
            } else {
                await deliveryService.create(submitData);
            }
            onSuccess();
        } catch (error) {
            setError(error.response?.data?.message || 'Error saving delivery');
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

            {delivery && (
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <Label>Reference</Label>
                        <div className="font-black text-xl">{delivery.reference}</div>
                    </div>
                    <Badge status={delivery.status} />
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
                        disabled={!!delivery}
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
                    <Label htmlFor="scheduledDate">Schedule Date</Label>
                    <Input
                        id="scheduledDate"
                        name="scheduledDate"
                        type="date"
                        value={formData.scheduledDate}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="customer">Customer / Contact</Label>
                <Input
                    id="customer"
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                />
            </div>

            <div>
                <Label htmlFor="deliveryAddress">Delivery Address</Label>
                <textarea
                    id="deliveryAddress"
                    name="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-3 border-black rounded-neo shadow-neo font-bold min-h-[80px]"
                />
            </div>

            <div>
                <Label htmlFor="sourceDoc">Source Document</Label>
                <Input
                    id="sourceDoc"
                    name="sourceDoc"
                    value={formData.sourceDoc}
                    onChange={handleChange}
                />
            </div>

            <div>
                <Label>Products</Label>
                <DeliveryItems
                    items={items}
                    setItems={setItems}
                    warehouseId={formData.warehouseId}
                />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t-3 border-black">
                <Button type="button" variant="outline" onClick={onCancel}>
                    {delivery ? 'Close' : 'Cancel'}
                </Button>
                {delivery && (delivery.status === 'DRAFT' || delivery.status === 'WAITING') && (
                    <Button type="button" variant="primary" onClick={handleValidate} disabled={loading}>
                        {delivery.status === 'DRAFT' ? 'TODO' : 'Check Stock'}
                    </Button>
                )}
                {delivery && delivery.status === 'READY' && (
                    <Button type="button" variant="primary" onClick={handleValidate} disabled={loading}>
                        Validate
                    </Button>
                )}
                {!delivery && (
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Create'}
                    </Button>
                )}
            </div>
        </form>
    );
};

export default DeliveryForm;
