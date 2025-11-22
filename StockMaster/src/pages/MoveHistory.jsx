import React, { useState, useEffect } from 'react';
import { stockMoveService } from '../services/api';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';

const MoveHistory = () => {
    const [moves, setMoves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: '',
        status: '',
        warehouseId: '',
        reference: '',
        contact: '',
        fromDate: '',
        toDate: ''
    });

    useEffect(() => {
        loadMoves();
    }, [filters]);

    const loadMoves = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.type) params.type = filters.type;
            if (filters.status) params.status = filters.status;
            if (filters.warehouseId) params.warehouseId = filters.warehouseId;
            if (filters.reference) params.reference = filters.reference;
            if (filters.contact) params.contact = filters.contact;
            if (filters.fromDate) params.fromDate = filters.fromDate;
            if (filters.toDate) params.toDate = filters.toDate;
            
            const data = await stockMoveService.getAll(params);
            setMoves(data);
        } catch (error) {
            console.error('Error loading moves:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getContact = (move) => {
        if (move.receipt?.supplier) return move.receipt.supplier;
        if (move.delivery?.customer) return move.delivery.customer;
        return '-';
    };

    const getFrom = (move) => {
        if (move.type === 'INCOMING') return 'Vendor';
        if (move.sourceLocation) return `${move.sourceLocation.name} (${move.sourceLocation.warehouse?.code})`;
        return '-';
    };

    const getTo = (move) => {
        if (move.type === 'OUTGOING') return 'Customer';
        if (move.destinationLocation) return `${move.destinationLocation.name} (${move.destinationLocation.warehouse?.code})`;
        return '-';
    };

    const columns = [
        { 
            key: 'reference', 
            label: 'Reference',
            render: (row) => {
                const ref = row.receipt?.reference || row.delivery?.reference || row.transfer?.reference || row.adjustment?.reference || '-';
                return <span className="font-black">{ref}</span>;
            }
        },
        { 
            key: 'product', 
            label: 'Product',
            render: (row) => <span className="font-bold">{row.product?.name || '-'}</span>
        },
        { 
            key: 'createdAt', 
            label: 'Date',
            render: (row) => new Date(row.createdAt).toLocaleDateString()
        },
        { 
            key: 'contact', 
            label: 'Contact',
            render: (row) => getContact(row)
        },
        { 
            key: 'from', 
            label: 'From',
            render: (row) => getFrom(row)
        },
        { 
            key: 'to', 
            label: 'To',
            render: (row) => getTo(row)
        },
        { 
            key: 'quantity', 
            label: 'Quantity',
            render: (row) => (
                <span className={row.type === 'INCOMING' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {row.type === 'INCOMING' ? '+' : '-'}{row.quantity}
                </span>
            )
        },
        { 
            key: 'status', 
            label: 'Status',
            render: (row) => <Badge status={row.status} />
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
                <div className="mb-8 border-b-3 border-black pb-4">
                    <h1 className="text-5xl font-black">MOVE HISTORY</h1>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                    <select
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="px-4 py-2 border-3 border-black rounded-neo shadow-neo font-bold"
                    >
                        <option value="">All Types</option>
                        <option value="INCOMING">Incoming</option>
                        <option value="OUTGOING">Outgoing</option>
                        <option value="INTERNAL">Internal</option>
                        <option value="ADJUSTMENT">Adjustment</option>
                    </select>

                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="px-4 py-2 border-3 border-black rounded-neo shadow-neo font-bold"
                    >
                        <option value="">All Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="WAITING">Waiting</option>
                        <option value="READY">Ready</option>
                        <option value="DONE">Done</option>
                    </select>

                    <input
                        type="date"
                        value={filters.fromDate}
                        onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                        placeholder="From Date"
                        className="px-4 py-2 border-3 border-black rounded-neo shadow-neo font-bold"
                    />

                    <input
                        type="date"
                        value={filters.toDate}
                        onChange={(e) => handleFilterChange('toDate', e.target.value)}
                        placeholder="To Date"
                        className="px-4 py-2 border-3 border-black rounded-neo shadow-neo font-bold"
                    />
                </div>

                <DataTable
                    data={moves}
                    columns={columns}
                    searchable
                    onSearch={(term) => handleFilterChange('reference', term)}
                />
            </div>
        </div>
    );
};

export default MoveHistory;

