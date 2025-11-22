import React, { useState, useEffect } from 'react';
import { adjustmentService } from '../services/api';
import { Button } from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import AdjustmentForm from '../components/adjustments/AdjustmentForm';

const Adjustments = () => {
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAdjustment, setSelectedAdjustment] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        loadAdjustments();
    }, [statusFilter, searchTerm]);

    const loadAdjustments = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (searchTerm) params.search = searchTerm;
            const data = await adjustmentService.getAll(params);
            setAdjustments(data);
        } catch (error) {
            console.error('Error loading adjustments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedAdjustment(null);
        setIsModalOpen(true);
    };

    const handleView = (adjustment) => {
        setSelectedAdjustment(adjustment);
        setIsModalOpen(true);
    };

    const handleValidate = async (adjustment) => {
        try {
            await adjustmentService.validate(adjustment.id);
            loadAdjustments();
        } catch (error) {
            console.error('Error validating adjustment:', error);
            alert(error.response?.data?.message || 'Error validating adjustment');
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedAdjustment(null);
        loadAdjustments();
    };

    const columns = [
        { 
            key: 'reference', 
            label: 'Reference',
            render: (row) => <span className="font-black">{row.reference}</span>
        },
        { 
            key: 'warehouse', 
            label: 'Warehouse',
            render: (row) => row.warehouse?.name || '-'
        },
        { 
            key: 'reason', 
            label: 'Reason',
            render: (row) => row.reason || '-'
        },
        { 
            key: 'date', 
            label: 'Date',
            render: (row) => row.date ? new Date(row.date).toLocaleDateString() : '-'
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
                    {row.status === 'DRAFT' && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleValidate(row);
                            }}
                        >
                            TODO
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
                    <h1 className="text-5xl font-black">INVENTORY ADJUSTMENTS</h1>
                    <Button onClick={handleCreate} variant="primary">
                        + New Adjustment
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
                        <option value="READY">Ready</option>
                        <option value="DONE">Done</option>
                    </select>
                </div>

                <DataTable
                    data={adjustments}
                    columns={columns}
                    searchable
                    onSearch={setSearchTerm}
                    onRowClick={handleView}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={selectedAdjustment ? `Adjustment: ${selectedAdjustment.reference}` : 'New Adjustment'}
            >
                <AdjustmentForm
                    adjustment={selectedAdjustment}
                    onSuccess={handleModalClose}
                    onCancel={handleModalClose}
                />
            </Modal>
        </div>
    );
};

export default Adjustments;

