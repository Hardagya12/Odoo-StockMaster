import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import AuthLayout from '../layouts/AuthLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';

const VerifyOTP = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [email] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authService.verifyOTP(email, otp);
            navigate('/reset-password', { state: { resetToken: response.resetToken } });
        } catch (error) {
            setError(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout subtitle="Verify OTP">
            <Card>
                <CardHeader>
                    <CardTitle>Enter OTP</CardTitle>
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
                                disabled
                            />
                        </div>

                        <div>
                            <Label htmlFor="otp">OTP</Label>
                            <Input
                                id="otp"
                                name="otp"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                                maxLength="6"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </Button>
                    </form>

                    <div className="mt-4 text-center">
                        <Link to="/forgot-password" className="text-neo-pink font-bold hover:underline">
                            Resend OTP
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </AuthLayout>
    );
};

export default VerifyOTP;

