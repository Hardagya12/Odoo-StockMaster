import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import { Button } from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ProductForm from '../components/products/ProductForm';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await productService.getAll({ search: searchTerm });
            setProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, [searchTerm]);

    const handleCreate = () => {
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (product) => {
        if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
            try {
                await productService.delete(product.id);
                loadProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Error deleting product');
            }
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
        loadProducts();
    };

    const columns = [
        { key: 'sku', label: 'SKU' },
        { key: 'name', label: 'Name' },
        { 
            key: 'category', 
            label: 'Category',
            render: (row) => row.category?.name || '-'
        },
        { key: 'unitOfMeasure', label: 'Unit' },
        { 
            key: 'totalStock', 
            label: 'Stock',
            render: (row) => row.totalStock || 0
        },
        { 
            key: 'minStock', 
            label: 'Min Stock',
            render: (row) => row.minStock || 0
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
                    <h1 className="text-5xl font-black">PRODUCTS</h1>
                    <Button onClick={handleCreate} variant="primary">
                        + Create Product
                    </Button>
                </div>

                <DataTable
                    data={products}
                    columns={columns}
                    searchable
                    onSearch={setSearchTerm}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={selectedProduct ? 'Edit Product' : 'Create Product'}
            >
                <ProductForm
                    product={selectedProduct}
                    onSuccess={handleModalClose}
                    onCancel={handleModalClose}
                />
            </Modal>
        </div>
    );
};

export default Products;

