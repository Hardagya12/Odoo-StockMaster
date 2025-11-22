import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import AuthLayout from '../layouts/AuthLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const response = await authService.forgotPassword(email);
            setSuccess(true);
            // In development, show OTP
            if (response.otp) {
                console.log('OTP:', response.otp);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Error sending OTP');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <AuthLayout subtitle="OTP Sent">
                <Card>
                    <CardHeader>
                        <CardTitle>Check Your Email</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 font-bold">
                            An OTP has been sent to your email. Please check your inbox.
                        </p>
                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={() => navigate('/verify-otp', { state: { email } })}
                        >
                            Verify OTP
                        </Button>
                    </CardContent>
                </Card>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout subtitle="Reset Your Password">
            <Card>
                <CardHeader>
                    <CardTitle>Forgot Password</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-100 border-3 border-red-500 rounded-neo p-3 text-red-800 font-bold">
                                {error}
                            </div>
                        )}

                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send OTP'}
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

export default ForgotPassword;

