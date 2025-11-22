import React, { useState, useEffect } from 'react';
import { productService, locationService } from '../../services/api';
import { Button } from '../ui/Button';
import Select from '../ui/Select';
import { Input } from '../ui/Input';

const ReceiptItems = ({ items, setItems, warehouseId }) => {
    const [products, setProducts] = useState([]);
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        loadProducts();
        if (warehouseId) {
            loadLocations();
        }
    }, [warehouseId]);

    const loadProducts = async () => {
        try {
            const data = await productService.getAll();
            setProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const loadLocations = async () => {
        try {
            const data = await locationService.getAll({ warehouseId });
            setLocations(data);
        } catch (error) {
            console.error('Error loading locations:', error);
        }
    };

    const handleAddItem = () => {
        setItems([...items, {
            productId: '',
            product: null,
            locationId: '',
            location: null,
            quantity: 1
        }]);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        if (field === 'productId') {
            const product = products.find(p => p.id === parseInt(value));
            newItems[index] = {
                ...newItems[index],
                productId: value,
                product: product || null
            };
        } else if (field === 'locationId') {
            const location = locations.find(l => l.id === parseInt(value));
            newItems[index] = {
                ...newItems[index],
                locationId: value,
                location: location || null
            };
        } else {
            newItems[index] = {
                ...newItems[index],
                [field]: value
            };
        }
        setItems(newItems);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-black text-lg">Products</h3>
                <Button type="button" variant="outline" onClick={handleAddItem}>
                    + Add Product
                </Button>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-8 text-gray-600 font-bold">
                    No products added. Click "Add Product" to add items.
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-neo-offwhite border-2 border-black rounded-neo">
                            <div className="col-span-5">
                                <label className="text-sm font-bold">Product</label>
                                <Select
                                    value={item.productId}
                                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                >
                                    <option value="">Select Product</option>
                                    {products.map(product => (
                                        <option key={product.id} value={product.id}>
                                            [{product.sku}] {product.name}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div className="col-span-3">
                                <label className="text-sm font-bold">Location</label>
                                <Select
                                    value={item.locationId}
                                    onChange={(e) => handleItemChange(index, 'locationId', e.target.value)}
                                    disabled={!warehouseId}
                                >
                                    <option value="">Select Location</option>
                                    {locations.map(location => (
                                        <option key={location.id} value={location.id}>
                                            {location.name}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-sm font-bold">Quantity</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                />
                            </div>
                            <div className="col-span-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleRemoveItem(index)}
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReceiptItems;
