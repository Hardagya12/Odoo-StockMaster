import React, { useState, useEffect } from 'react';
import { locationService, warehouseService } from '../services/api';
import { Button } from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import LocationForm from '../components/locations/LocationForm';

const Locations = () => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [warehouses, setWarehouses] = useState([]);

    useEffect(() => {
        loadWarehouses();
        loadLocations();
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
            setLoading(true);
            const params = warehouseFilter ? { warehouseId: warehouseFilter } : {};
            const data = await locationService.getAll(params);
            setLocations(data);
        } catch (error) {
            console.error('Error loading locations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedLocation(null);
        setIsModalOpen(true);
    };

    const handleEdit = (location) => {
        setSelectedLocation(location);
        setIsModalOpen(true);
    };

    const handleDelete = async (location) => {
        if (window.confirm(`Are you sure you want to delete ${location.name}?`)) {
            try {
                await locationService.delete(location.id);
                loadLocations();
            } catch (error) {
                console.error('Error deleting location:', error);
                alert(error.response?.data?.message || 'Error deleting location');
            }
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedLocation(null);
        loadLocations();
    };

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Short Code' },
        { 
            key: 'warehouse', 
            label: 'Warehouse',
            render: (row) => `${row.warehouse?.name} (${row.warehouse?.code})`
        },
        { key: 'type', label: 'Type' },
        {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(row);
                        }}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(row);
                        }}
                    >
                        Delete
                    </Button>
                </div>
            )
        }
    ];

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
                <div className="flex justify-between items-center mb-8 border-b-3 border-black pb-4">
                    <h1 className="text-5xl font-black">LOCATIONS</h1>
                    <Button onClick={handleCreate} variant="primary">
                        + Create Location
                    </Button>
                </div>

                <div className="mb-4">
                    <select
                        value={warehouseFilter}
                        onChange={(e) => setWarehouseFilter(e.target.value)}
                        className="px-4 py-2 border-3 border-black rounded-neo shadow-neo font-bold"
                    >
                        <option value="">All Warehouses</option>
                        {warehouses.map(wh => (
                            <option key={wh.id} value={wh.id}>
                                {wh.name}
                            </option>
                        ))}
                    </select>
                </div>

                <DataTable
                    data={locations}
                    columns={columns}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={selectedLocation ? 'Edit Location' : 'Create Location'}
            >
                <LocationForm
                    location={selectedLocation}
                    warehouses={warehouses}
                    onSuccess={handleModalClose}
                    onCancel={handleModalClose}
                />
            </Modal>
        </div>
    );
};

export default Locations;

