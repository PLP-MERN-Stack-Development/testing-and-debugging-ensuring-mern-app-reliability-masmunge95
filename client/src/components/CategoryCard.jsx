import React, { useState } from 'react';
import Button from '@/components/Button';

const CategoryCard = ({ category, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formState, setFormState] = useState({
        name: category.name,
        description: category.description || '',
    });

    const handleSave = (e) => {
        e.preventDefault();
        onUpdate(category._id, formState);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormState({ name: category.name, description: category.description || '' });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    if (isEditing) {
        return (
            <form onSubmit={handleSave} className="flex flex-col gap-4 p-4 rounded-lg shadow-md" data-cy="category-row">
                <input
                    type="text"
                    name="name"
                    value={formState.name}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg p-2 flex-grow bg-transparent placeholder:text-gray-400 dark:border-gray-600"
                    required
                />
                <textarea
                    name="description"
                    value={formState.description}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg p-2 flex-grow bg-transparent placeholder:text-gray-400 dark:border-gray-600 h-30"
                />
                <div className="flex justify-end gap-2">
                    <Button type="submit" variant="success" size="sm">Save</Button>
                    <Button type="button" onClick={handleCancel} variant="secondary" size="sm">Cancel</Button>
                </div>
            </form>
        );
    }

    return (
        <div className="p-4 rounded-lg shadow-md" data-cy="category-row">
            <div className="flex items-center justify-between">
                <span className="font-medium ">{category.name}</span>
                <div className="flex gap-2">
                    <Button onClick={() => setIsEditing(true)} variant="secondary" size="sm">Edit</Button>
                    <Button onClick={() => onDelete(category._id)} variant="danger" size="sm">Delete</Button>
                </div>
            </div>
            {category.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{category.description}</p>}
        </div>
    );
};

export default React.memo(CategoryCard);