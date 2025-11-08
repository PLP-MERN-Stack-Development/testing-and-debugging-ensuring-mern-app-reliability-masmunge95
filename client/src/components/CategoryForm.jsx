import React, { useState } from 'react';
import Button from '@/components/Button';

const CategoryForm = ({ onSubmit, isSubmitting = false }) => {
    const [formState, setFormState] = useState({ name: '', description: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formState.name.trim()) return;
        onSubmit(formState);
        setFormState({ name: '', description: '' });
    }; 

    return (
        <form onSubmit={handleSubmit} className="rounded-2xl p-6 shadow-xl flex flex-col gap-4 mb-6">
            <input
                type="text"
                name="name"
                value={formState.name}
                onChange={handleChange}
                placeholder="New category name"
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500"
                required
            />
            <textarea
                name="description"
                value={formState.description}
                onChange={handleChange}
                placeholder="Category description (optional)"
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 h-24 placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button
                type="submit"
                variant="success"
                className="w-full"
                disabled={isSubmitting || !formState.name.trim()}>
                {isSubmitting ? 'Adding...' : 'Add Category'}
            </Button>
        </form>
    );
};

export default React.memo(CategoryForm);