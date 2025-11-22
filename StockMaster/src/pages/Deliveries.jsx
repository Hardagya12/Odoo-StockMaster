import React, { useState, useEffect } from 'react';
import { deliveryService } from '../services/api';
import { Button } from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import DeliveryForm from '../components/deliveries/DeliveryForm';

const Deliveries = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        loadDeliveries();
    }, [statusFilter, searchTerm]);

    const loadDeliveries = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (searchTerm) params.search = searchTerm;
            const data = await deliveryService.getAll(params);
            setDeliveries(data);
        } catch (error) {
            console.error('Error loading deliveries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedDelivery(null);
        setIsModalOpen(true);
    };

    const handleView = (delivery) => {
        setSelectedDelivery(delivery);
        setIsModalOpen(true);
    };

    const handleValidate = async (delivery) => {
        try {
            await deliveryService.validate(delivery.id);
            loadDeliveries();
        } catch (error) {
            console.error('Error validating delivery:', error);
            alert(error.response?.data?.message || 'Error validating delivery');
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedDelivery(null);
        loadDeliveries();
    };

    const columns = [
        { 
            key: 'reference', 
            label: 'Reference',
            render: (row) => <span className="font-black">{row.reference}</span>
        },
        { 
            key: 'warehouse', 
            label: 'From',
            render: (row) => row.warehouse?.name || '-'
        },
        { 
            key: 'customer', 
            label: 'To',
            render: (row) => row.customer || 'Customer'
        },
        { 
            key: 'customer', 
            label: 'Contact',
            render: (row) => row.customer || '-'
        },
        { 
            key: 'scheduledDate', 
            label: 'Schedule Date',
            render: (row) => row.scheduledDate ? new Date(row.scheduledDate).toLocaleDateString() : '-'
        },
        { 
            key: 'status', 
            label: 'Status',
            render: (row) => <Badge status={row.status} />
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
                            handleView(row);
                        }}
                    >
                        View
                    </Button>
                    {(row.status === 'DRAFT' || row.status === 'WAITING') && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleValidate(row);
                            }}
                        >
                            {row.status === 'DRAFT' ? 'TODO' : 'Check'}
                        </Button>
                    )}
                    {row.status === 'READY' && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleValidate(row);
                            }}
                        >
                            Validate
                        </Button>
                    )}
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
                    <h1 className="text-5xl font-black">DELIVERIES</h1>
                    <Button onClick={handleCreate} variant="primary">
                        + New Delivery
                    </Button>
                </div>

                <div className="flex gap-4 mb-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border-3 border-black rounded-neo shadow-neo font-bold"
                    >
                        <option value="">All Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="WAITING">Waiting</option>
                        <option value="READY">Ready</option>
                        <option value="DONE">Done</option>
                    </select>
                </div>

                <DataTable
                    data={deliveries}
                    columns={columns}
                    searchable
                    onSearch={setSearchTerm}
                    kanbanView
                    onKanbanToggle={() => {}}
                    statusColumn="status"
                    onRowClick={handleView}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={selectedDelivery ? `Delivery: ${selectedDelivery.reference}` : 'New Delivery'}
            >
                <DeliveryForm
                    delivery={selectedDelivery}
                    onSuccess={handleModalClose}
                    onCancel={handleModalClose}
                />
            </Modal>
        </div>
    );
};

export default Deliveries;
