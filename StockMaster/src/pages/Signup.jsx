import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../layouts/AuthLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';

const Signup = () => {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const [formData, setFormData] = useState({
        loginId: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.loginId.length < 6 || formData.loginId.length > 12) {
            setError('Login ID must be between 6-12 characters');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        const result = await signup({
            email: formData.email,
            name: formData.loginId,
            loginId: formData.loginId,
            password: formData.password,
        });

        setLoading(false);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }
    };

    return (
        <AuthLayout subtitle="Join the Squad">
            <Card className="bg-neo-white">
                <CardHeader className="text-center border-b-3 border-black bg-neo-blue text-white rounded-t-[9px]">
                    <CardTitle className="text-3xl uppercase tracking-widest">Sign Up</CardTitle>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4 pt-8">
                        {error && (
                            <div className="bg-red-100 border-3 border-black text-red-700 px-4 py-3 rounded-neo font-bold">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="loginId">Login ID</Label>
                            <Input
                                id="loginId"
                                name="loginId"
                                placeholder="Choose a unique ID (6-12 chars)"
                                value={formData.loginId}
                                onChange={handleChange}
                                required
                                minLength={6}
                                maxLength={12}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email ID</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                value={formData.email}
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
                                placeholder="Strong password (>8 chars)"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Re-Enter Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="secondary"
                            className="w-full text-lg mt-4"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
                        </Button>
                    </CardContent>
                </form>
                <CardFooter className="flex justify-center border-t-3 border-black bg-gray-50 rounded-b-[9px] py-4">
                    <span className="text-sm font-bold mr-2">Already have an account?</span>
                    <Link to="/login" className="text-sm font-bold text-neo-pink hover:underline">
                        Login here
                    </Link>
                </CardFooter>
            </Card>
        </AuthLayout>
    );
};

export default Signup;
