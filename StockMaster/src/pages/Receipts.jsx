import React, { useState, useEffect } from 'react';
import { receiptService, warehouseService } from '../services/api';
import { Button } from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import ReceiptForm from '../components/receipts/ReceiptForm';

const Receipts = () => {
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [viewMode, setViewMode] = useState('table');

    useEffect(() => {
        loadReceipts();
    }, [statusFilter, searchTerm]);

    const loadReceipts = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (searchTerm) params.search = searchTerm;
            const data = await receiptService.getAll(params);
            setReceipts(data);
        } catch (error) {
            console.error('Error loading receipts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedReceipt(null);
        setIsModalOpen(true);
    };

    const handleView = (receipt) => {
        setSelectedReceipt(receipt);
        setIsModalOpen(true);
    };

    const handleValidate = async (receipt) => {
        try {
            await receiptService.validate(receipt.id);
            loadReceipts();
        } catch (error) {
            console.error('Error validating receipt:', error);
            alert(error.response?.data?.message || 'Error validating receipt');
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedReceipt(null);
        loadReceipts();
    };

    const columns = [
        { 
            key: 'reference', 
            label: 'Reference',
            render: (row) => <span className="font-black">{row.reference}</span>
        },
        { 
            key: 'supplier', 
            label: 'From',
            render: (row) => row.supplier || 'Vendor'
        },
        { 
            key: 'warehouse', 
            label: 'To',
            render: (row) => row.warehouse?.name || '-'
        },
        { 
            key: 'supplier', 
            label: 'Contact',
            render: (row) => row.supplier || '-'
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
                    <h1 className="text-5xl font-black">RECEIPTS</h1>
                    <Button onClick={handleCreate} variant="primary">
                        + New Receipt
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
                    data={receipts}
                    columns={columns}
                    searchable
                    onSearch={setSearchTerm}
                    kanbanView
                    onKanbanToggle={setViewMode}
                    statusColumn="status"
                    onRowClick={handleView}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={selectedReceipt ? `Receipt: ${selectedReceipt.reference}` : 'New Receipt'}
            >
                <ReceiptForm
                    receipt={selectedReceipt}
                    onSuccess={handleModalClose}
                    onCancel={handleModalClose}
                />
            </Modal>
        </div>
    );
};

export default Receipts;
