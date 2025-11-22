import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import AuthLayout from '../layouts/AuthLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [resetToken] = useState(location.state?.resetToken || '');
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

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
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        try {
            await authService.resetPassword(resetToken, formData.newPassword);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            setError(error.response?.data?.message || 'Error resetting password');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <AuthLayout subtitle="Password Reset">
                <Card>
                    <CardHeader>
                        <CardTitle>Success!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 font-bold text-green-600">
                            Password reset successfully! Redirecting to login...
                        </p>
                    </CardContent>
                </Card>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout subtitle="Reset Your Password">
            <Card>
                <CardHeader>
                    <CardTitle>New Password</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-100 border-3 border-red-500 rounded-neo p-3 text-red-800 font-bold">
                                {error}
                            </div>
                        )}

                        <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                minLength={6}
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </form>

                    <div className="mt-4 text-center">
                        <Link to="/login" className="text-neo-pink font-bold hover:underline">
                            Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </AuthLayout>
    );
};

export default ResetPassword;

