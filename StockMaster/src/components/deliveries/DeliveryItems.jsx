import React, { useState, useEffect } from 'react';
import { productService, locationService, stockService } from '../../services/api';
import { Button } from '../ui/Button';
import Select from '../ui/Select';
import { Input } from '../ui/Input';

const DeliveryItems = ({ items, setItems, warehouseId }) => {
    const [products, setProducts] = useState([]);
    const [locations, setLocations] = useState([]);
    const [stockData, setStockData] = useState({});

    useEffect(() => {
        loadProducts();
        if (warehouseId) {
            loadLocations();
            loadStock();
        }
    }, [warehouseId]);

    useEffect(() => {
        checkStockAvailability();
    }, [items, stockData]);

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

    const loadStock = async () => {
        try {
            const data = await stockService.getAll({ warehouseId });
            const stockMap = {};
            data.forEach(stock => {
                const key = `${stock.productId}-${stock.locationId}`;
                stockMap[key] = stock.quantity - stock.reserved;
            });
            setStockData(stockMap);
        } catch (error) {
            console.error('Error loading stock:', error);
        }
    };

    const checkStockAvailability = () => {
        // This will be used to highlight items with insufficient stock
        items.forEach((item, index) => {
            if (item.productId && item.locationId) {
                const key = `${item.productId}-${item.locationId}`;
                const available = stockData[key] || 0;
                if (available < item.quantity) {
                    // Mark item as out of stock (will be styled in render)
                }
            }
        });
    };

    const getAvailableStock = (productId, locationId) => {
        if (!productId || !locationId) return 0;
        const key = `${productId}-${locationId}`;
        return stockData[key] || 0;
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
                    + Add new product
                </Button>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-8 text-gray-600 font-bold">
                    No products added. Click "Add new product" to add items.
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((item, index) => {
                        const available = getAvailableStock(item.productId, item.locationId);
                        const isOutOfStock = available < item.quantity;
                        
                        return (
                            <div 
                                key={index} 
                                className={`grid grid-cols-12 gap-2 items-end p-3 border-2 border-black rounded-neo ${
                                    isOutOfStock ? 'bg-red-100' : 'bg-neo-offwhite'
                                }`}
                            >
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
                                    {item.productId && item.locationId && (
                                        <div className="text-xs mt-1">
                                            Available: {available}
                                            {isOutOfStock && (
                                                <span className="text-red-600 font-bold ml-2">OUT OF STOCK</span>
                                            )}
                                        </div>
                                    )}
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
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DeliveryItems;
