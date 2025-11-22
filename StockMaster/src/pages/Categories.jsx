import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import { Button } from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import CategoryForm from '../components/categories/CategoryForm';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await categoryService.getAll();
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedCategory(null);
        setIsModalOpen(true);
    };

    const handleEdit = (category) => {
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    const handleDelete = async (category) => {
        if (window.confirm(`Are you sure you want to delete ${category.name}?`)) {
            try {
                await categoryService.delete(category.id);
                loadCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
                alert(error.response?.data?.message || 'Error deleting category');
            }
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedCategory(null);
        loadCategories();
    };

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { 
            key: 'parent', 
            label: 'Parent Category',
            render: (row) => row.parent?.name || '-'
        },
        { 
            key: '_count', 
            label: 'Products',
            render: (row) => row._count?.products || 0
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
                    <h1 className="text-5xl font-black">CATEGORIES</h1>
                    <Button onClick={handleCreate} variant="primary">
                        + Create Category
                    </Button>
                </div>

                <DataTable
                    data={categories}
                    columns={columns}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={selectedCategory ? 'Edit Category' : 'Create Category'}
            >
                <CategoryForm
                    category={selectedCategory}
                    categories={categories}
                    onSuccess={handleModalClose}
                    onCancel={handleModalClose}
                />
            </Modal>
        </div>
    );
};

export default Categories;

