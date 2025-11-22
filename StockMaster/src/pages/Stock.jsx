import React, { useState, useEffect } from 'react';
import { stockService, productService, warehouseService, locationService } from '../services/api';
import DataTable from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Select from '../components/ui/Select';

const Stock = () => {
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [warehouses, setWarehouses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);
    const [newQuantity, setNewQuantity] = useState(0);

    useEffect(() => {
        loadWarehouses();
        loadStock();
    }, [warehouseFilter, locationFilter]);

    useEffect(() => {
        if (warehouseFilter) {
            loadLocations();
        }
    }, [warehouseFilter]);

    const loadWarehouses = async () => {
        try {
            const data = await warehouseService.getAll();
            setWarehouses(data);
        } catch (error) {
            console.error('Error loading warehouses:', error);
        }
    };

    const loadLocations = async () => {
        try {
            const params = warehouseFilter ? { warehouseId: warehouseFilter } : {};
            const data = await locationService.getAll(params);
            setLocations(data);
        } catch (error) {
            console.error('Error loading locations:', error);
        }
    };

    const loadStock = async () => {
        try {
            setLoading(true);
            const params = {};
            if (warehouseFilter) params.warehouseId = warehouseFilter;
            const data = await stockService.getAll(params);
            
            // Filter by location if selected
            let filteredData = data;
            if (locationFilter) {
                filteredData = data.filter(s => s.locationId === parseInt(locationFilter));
            }
            
            setStock(filteredData);
        } catch (error) {
            console.error('Error loading stock:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (stockItem) => {
        setSelectedStock(stockItem);
        setNewQuantity(stockItem.quantity);
        setIsEditModalOpen(true);
    };

    const handleUpdateStock = async () => {
        if (!selectedStock) return;
        
        try {
            const quantityChange = newQuantity - selectedStock.quantity;
            await stockService.adjust({
                productId: selectedStock.productId,
                locationId: selectedStock.locationId,
                warehouseId: selectedStock.warehouseId,
                quantityChange
            });
            setIsEditModalOpen(false);
            setSelectedStock(null);
            loadStock();
        } catch (error) {
            console.error('Error updating stock:', error);
            alert(error.response?.data?.message || 'Error updating stock');
        }
    };

    const columns = [
        { 
            key: 'product', 
            label: 'Product',
            render: (row) => `[${row.product?.sku}] ${row.product?.name}`
        },
        { 
            key: 'unitPrice', 
            label: 'Per Unit Cost',
            render: (row) => `Rs ${row.product?.unitPrice || 0}`
        },
        { 
            key: 'quantity', 
            label: 'On Hand',
            render: (row) => row.quantity
        },
        { 
            key: 'free', 
            label: 'Free to Use',
            render: (row) => row.quantity - row.reserved
        },
        { 
            key: 'location', 
            label: 'Location',
            render: (row) => row.location?.name || '-'
        },
        { 
            key: 'warehouse', 
            label: 'Warehouse',
            render: (row) => row.warehouse?.name || '-'
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(row)}
                >
                    Update
                </Button>
            )
        }
    ];

    const filteredStock = stock.filter(item => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            item.product?.name?.toLowerCase().includes(search) ||
            item.product?.sku?.toLowerCase().includes(search)
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-2xl font-black">LOADING...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-neo-white border-3 border-black rounded-neo shadow-neo-lg p-8">
                <div className="mb-8 border-b-3 border-black pb-4">
                    <h1 className="text-5xl font-black">STOCK</h1>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                    <select
                        value={warehouseFilter}
                        onChange={(e) => {
                            setWarehouseFilter(e.target.value);
                            setLocationFilter('');
                        }}
                        className="px-4 py-2 border-3 border-black rounded-neo shadow-neo font-bold"
                    >
                        <option value="">All Warehouses</option>
                        {warehouses.map(wh => (
                            <option key={wh.id} value={wh.id}>
                                {wh.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="px-4 py-2 border-3 border-black rounded-neo shadow-neo font-bold"
                        disabled={!warehouseFilter}
                    >
                        <option value="">All Locations</option>
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>
                                {loc.name}
                            </option>
                        ))}
                    </select>
                </div>

                <DataTable
                    data={filteredStock}
                    columns={columns}
                    searchable
                    onSearch={setSearchTerm}
                />
            </div>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedStock(null);
                }}
                title="Update Stock"
            >
                {selectedStock && (
                    <div className="space-y-4">
                        <div>
                            <Label>Product</Label>
                            <div className="font-bold">
                                [{selectedStock.product?.sku}] {selectedStock.product?.name}
                            </div>
                        </div>
                        <div>
                            <Label>Location</Label>
                            <div className="font-bold">
                                {selectedStock.location?.name} - {selectedStock.warehouse?.name}
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="quantity">New Quantity *</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min="0"
                                value={newQuantity}
                                onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                                required
                            />
                            <div className="text-sm mt-1 text-gray-600">
                                Current: {selectedStock.quantity}
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 pt-4 border-t-3 border-black">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setSelectedStock(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleUpdateStock}>
                                Update Stock
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Stock;

