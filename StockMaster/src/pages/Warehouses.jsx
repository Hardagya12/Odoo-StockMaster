import React, { useState, useEffect } from 'react';
import { warehouseService } from '../services/api';
import { Button } from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import WarehouseForm from '../components/warehouses/WarehouseForm';

const Warehouses = () => {
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);

    useEffect(() => {
        loadWarehouses();
    }, []);

    const loadWarehouses = async () => {
        try {
            setLoading(true);
            const data = await warehouseService.getAll();
            setWarehouses(data);
        } catch (error) {
            console.error('Error loading warehouses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedWarehouse(null);
        setIsModalOpen(true);
    };

    const handleEdit = (warehouse) => {
        setSelectedWarehouse(warehouse);
        setIsModalOpen(true);
    };

    const handleDelete = async (warehouse) => {
        if (window.confirm(`Are you sure you want to delete ${warehouse.name}?`)) {
            try {
                await warehouseService.delete(warehouse.id);
                loadWarehouses();
            } catch (error) {
                console.error('Error deleting warehouse:', error);
                alert(error.response?.data?.message || 'Error deleting warehouse');
            }
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedWarehouse(null);
        loadWarehouses();
    };

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Short Code' },
        { key: 'address', label: 'Address' },
        { 
            key: '_count', 
            label: 'Locations',
            render: (row) => row._count?.locations || 0
        },
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
                    <h1 className="text-5xl font-black">WAREHOUSES</h1>
                    <Button onClick={handleCreate} variant="primary">
                        + Create Warehouse
                    </Button>
                </div>

                <DataTable
                    data={warehouses}
                    columns={columns}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={selectedWarehouse ? 'Edit Warehouse' : 'Create Warehouse'}
            >
                <WarehouseForm
                    warehouse={selectedWarehouse}
                    onSuccess={handleModalClose}
                    onCancel={handleModalClose}
                />
            </Modal>
        </div>
    );
};

export default Warehouses;

