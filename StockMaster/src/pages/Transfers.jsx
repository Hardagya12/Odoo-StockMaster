import React, { useState, useEffect } from 'react';
import { transferService } from '../services/api';
import { Button } from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import TransferForm from '../components/transfers/TransferForm';
import Badge from '../components/ui/Badge';

const Transfers = () => {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        loadTransfers();
    }, [searchTerm, statusFilter]);

    const loadTransfers = async () => {
        try {
            setLoading(true);
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (statusFilter) params.status = statusFilter;
            const data = await transferService.getAll(params);
            setTransfers(data);
        } catch (error) {
            console.error('Error loading transfers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedTransfer(null);
        setIsModalOpen(true);
    };

    const handleValidate = async (transfer) => {
        try {
            await transferService.validate(transfer.id);
            loadTransfers();
        } catch (error) {
            console.error('Error validating transfer:', error);
            alert(error.response?.data?.message || 'Error validating transfer');
        }
    };

    const handleDelete = async (transfer) => {
        if (window.confirm(`Are you sure you want to delete ${transfer.reference}?`)) {
            try {
                await transferService.delete(transfer.id);
                loadTransfers();
            } catch (error) {
                console.error('Error deleting transfer:', error);
                alert(error.response?.data?.message || 'Error deleting transfer');
            }
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedTransfer(null);
        loadTransfers();
    };

    const columns = [
        { key: 'reference', label: 'Reference' },
        { 
            key: 'sourceLocation', 
            label: 'From',
            render: (row) => `${row.sourceLocation?.name} (${row.sourceLocation?.warehouse?.code})`
        },
        { 
            key: 'destinationLocation', 
            label: 'To',
            render: (row) => `${row.destinationLocation?.name} (${row.destinationLocation?.warehouse?.code})`
        },
        { 
            key: 'scheduledDate', 
            label: 'Schedule Date',
            render: (row) => row.scheduledDate 
                ? new Date(row.scheduledDate).toLocaleDateString() 
                : '-'
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
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleValidate(row);
                            }}
                        >
                            Validate
                        </Button>
                    )}
                    {row.status !== 'DONE' && (
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
                    <h1 className="text-5xl font-black">INTERNAL TRANSFERS</h1>
                    <Button onClick={handleCreate} variant="primary">
                        + New Transfer
                    </Button>
                </div>

                <div className="mb-4 flex gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border-3 border-black rounded-neo shadow-neo font-bold"
                    >
                        <option value="">All Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="READY">Ready</option>
                        <option value="DONE">Done</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                <DataTable
                    data={transfers}
                    columns={columns}
                    searchable
                    onSearch={setSearchTerm}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title="New Transfer"
            >
                <TransferForm
                    transfer={selectedTransfer}
                    onSuccess={handleModalClose}
                    onCancel={handleModalClose}
                />
            </Modal>
        </div>
    );
};

export default Transfers;

