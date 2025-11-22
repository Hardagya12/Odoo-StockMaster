import React, { useState, useEffect } from 'react';
import { receiptService, warehouseService, productService, locationService } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import Select from '../ui/Select';
import ReceiptItems from './ReceiptItems';
import Badge from '../ui/Badge';

const ReceiptForm = ({ receipt, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        warehouseId: '',
        supplier: '',
        sourceDoc: '',
        scheduledDate: ''
    });
    const [items, setItems] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadWarehouses();
        if (receipt) {
            setFormData({
                warehouseId: receipt.warehouseId || '',
                supplier: receipt.supplier || '',
                sourceDoc: receipt.sourceDoc || '',
                scheduledDate: receipt.scheduledDate ? new Date(receipt.scheduledDate).toISOString().split('T')[0] : ''
            });
            setItems(receipt.stockMoves?.map(move => ({
                productId: move.productId,
                product: move.product,
                locationId: move.destinationLocationId,
                location: move.destinationLocation,
                quantity: move.quantity
            })) || []);
        }
    }, [receipt]);

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
        if (!receipt) return;
        try {
            setLoading(true);
            await receiptService.validate(receipt.id);
            onSuccess();
        } catch (error) {
            setError(error.response?.data?.message || 'Error validating receipt');
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

            if (receipt) {
                await receiptService.update(receipt.id, submitData);
            } else {
                await receiptService.create(submitData);
            }
            onSuccess();
        } catch (error) {
            setError(error.response?.data?.message || 'Error saving receipt');
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

            {receipt && (
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <Label>Reference</Label>
                        <div className="font-black text-xl">{receipt.reference}</div>
                    </div>
                    <Badge status={receipt.status} />
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
                        disabled={!!receipt}
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

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="supplier">Supplier / Contact</Label>
                    <Input
                        id="supplier"
                        name="supplier"
                        value={formData.supplier}
                        onChange={handleChange}
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
            </div>

            <div>
                <Label>Products</Label>
                <ReceiptItems
                    items={items}
                    setItems={setItems}
                    warehouseId={formData.warehouseId}
                />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t-3 border-black">
                <Button type="button" variant="outline" onClick={onCancel}>
                    {receipt ? 'Close' : 'Cancel'}
                </Button>
                {receipt && receipt.status === 'DRAFT' && (
                    <Button type="button" variant="primary" onClick={handleValidate} disabled={loading}>
                        TODO
                    </Button>
                )}
                {receipt && receipt.status === 'READY' && (
                    <Button type="button" variant="primary" onClick={handleValidate} disabled={loading}>
                        Validate
                    </Button>
                )}
                {!receipt && (
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Create'}
                    </Button>
                )}
            </div>
        </form>
    );
};

export default ReceiptForm;
