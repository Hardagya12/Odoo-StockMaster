import React, { useState } from 'react';
import { Button } from './Button';
import Badge from './Badge';

const DataTable = ({ 
    data = [], 
    columns = [], 
    onRowClick,
    searchable = false,
    onSearch,
    filterable = false,
    kanbanView = false,
    onKanbanToggle,
    statusColumn
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table');

    const handleSearch = (value) => {
        setSearchTerm(value);
        if (onSearch) {
            onSearch(value);
        }
    };

    const handleKanbanToggle = () => {
        const newMode = viewMode === 'table' ? 'kanban' : 'table';
        setViewMode(newMode);
        if (onKanbanToggle) {
            onKanbanToggle(newMode);
        }
    };

    if (viewMode === 'kanban' && kanbanView) {
        // Group by status
        const groupedByStatus = {};
        data.forEach(item => {
            const status = item[statusColumn] || 'DRAFT';
            if (!groupedByStatus[status]) {
                groupedByStatus[status] = [];
            }
            groupedByStatus[status].push(item);
        });

        const statuses = ['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELLED'];

        return (
            <div>
                <div className="flex items-center justify-between mb-4">
                    {searchable && (
                        <div className="flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full px-4 py-2 border-3 border-black rounded-neo shadow-neo font-bold"
                            />
                        </div>
                    )}
                    <Button onClick={handleKanbanToggle} variant="outline">
                        Switch to {viewMode === 'table' ? 'Kanban' : 'Table'} View
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {statuses.map(status => (
                        <div key={status} className="bg-neo-white border-3 border-black rounded-neo shadow-neo p-4">
                            <h3 className="font-black text-lg mb-4">
                                <Badge status={status} />
                                <span className="ml-2">({groupedByStatus[status]?.length || 0})</span>
                            </h3>
                            <div className="space-y-2">
                                {(groupedByStatus[status] || []).map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => onRowClick && onRowClick(item)}
                                        className="p-3 bg-neo-offwhite border-2 border-black rounded-neo shadow-neo-sm cursor-pointer hover:shadow-neo"
                                    >
                                        {columns.map(col => (
                                            <div key={col.key} className="mb-1">
                                                <span className="font-bold text-sm">{col.label}:</span>{' '}
                                                <span className="text-sm">{item[col.key]}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                {searchable && (
                    <div className="flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full px-4 py-2 border-3 border-black rounded-neo shadow-neo font-bold"
                        />
                    </div>
                )}
                {kanbanView && (
                    <Button onClick={handleKanbanToggle} variant="outline">
                        Switch to Kanban View
                    </Button>
                )}
            </div>
            <div className="bg-neo-white border-3 border-black rounded-neo shadow-neo overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-neo-pink text-white border-b-3 border-black">
                                {columns.map(col => (
                                    <th key={col.key} className="px-4 py-3 text-left font-black">
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-8 text-center font-bold text-gray-600">
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, idx) => (
                                    <tr
                                        key={idx}
                                        onClick={() => onRowClick && onRowClick(row)}
                                        className={`
                                            border-b-2 border-black hover:bg-gray-100
                                            ${onRowClick ? 'cursor-pointer' : ''}
                                        `}
                                    >
                                        {columns.map(col => (
                                            <td key={col.key} className="px-4 py-3 font-bold">
                                                {col.render ? col.render(row) : row[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DataTable;

