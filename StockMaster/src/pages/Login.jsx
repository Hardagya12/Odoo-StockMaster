import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../layouts/AuthLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        loginId: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(formData);

        setLoading(false);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }
    };

    return (
        <AuthLayout subtitle="Access Your Inventory">
            <Card className="bg-neo-white">
                <CardHeader className="text-center border-b-3 border-black bg-neo-pink text-white rounded-t-[9px]">
                    <CardTitle className="text-3xl uppercase tracking-widest">Login</CardTitle>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6 pt-8">
                        {error && (
                            <div className="bg-red-100 border-3 border-black text-red-700 px-4 py-3 rounded-neo font-bold">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="loginId">Login ID (Email)</Label>
                            <Input
                                id="loginId"
                                name="loginId"
                                type="email"
                                placeholder="Enter your email"
                                value={formData.loginId}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Enter your Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full text-lg"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? 'SIGNING IN...' : 'SIGN IN'}
                        </Button>
                    </CardContent>
                </form>
                <CardFooter className="flex justify-between border-t-3 border-black bg-gray-50 rounded-b-[9px] py-4">
                    <Link to="/forgot-password" className="text-sm font-bold text-neo-pink hover:underline">
                        Forgot Password?
                    </Link>
                    <Link to="/signup" className="text-sm font-bold hover:text-neo-blue hover:underline">
                        Sign Up
                    </Link>
                </CardFooter>
            </Card>
        </AuthLayout>
    );
};

export default Login;
