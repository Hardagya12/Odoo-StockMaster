import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { authService } from '../services/api';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await authService.updateProfile({ name: formData.name });
            updateUser(response.user);
            setMessage('Profile updated successfully!');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-neo-white border-3 border-black rounded-neo shadow-neo-lg p-8">
                <div className="mb-8 border-b-3 border-black pb-4">
                    <h1 className="text-5xl font-black">MY PROFILE</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
                    {message && (
                        <div className={`p-3 rounded-neo font-bold ${
                            message.includes('Error') 
                                ? 'bg-red-100 border-3 border-red-500 text-red-800'
                                : 'bg-green-100 border-3 border-green-500 text-green-800'
                        }`}>
                            {message}
                        </div>
                    )}

                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled
                        />
                        <div className="text-sm text-gray-600 mt-1">
                            Email cannot be changed
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t-3 border-black">
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Update Profile'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;

