import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';

const Login = () => {
    return (
        <AuthLayout subtitle="Access Your Inventory">
            <Card className="bg-neo-white">
                <CardHeader className="text-center border-b-3 border-black bg-neo-pink text-white rounded-t-[9px]">
                    <CardTitle className="text-3xl uppercase tracking-widest">Login</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-8">
                    <div className="space-y-2">
                        <Label htmlFor="loginId">Login ID</Label>
                        <Input id="loginId" placeholder="Enter your Login ID" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" placeholder="Enter your Password" />
                    </div>

                    <Button className="w-full text-lg" size="lg">
                        SIGN IN
                    </Button>
                </CardContent>
                <CardFooter className="flex justify-between border-t-3 border-black bg-gray-50 rounded-b-[9px] py-4">
                    <Link to="/forgot-password" class="text-sm font-bold hover:text-neo-pink hover:underline">
                        Forgot Password?
                    </Link>
                    <Link to="/signup" class="text-sm font-bold hover:text-neo-blue hover:underline">
                        Sign Up
                    </Link>
                </CardFooter>
            </Card>
        </AuthLayout>
    );
};

export default Login;
