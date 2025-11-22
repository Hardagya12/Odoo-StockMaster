import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';

const Signup = () => {
    return (
        <AuthLayout subtitle="Join the Squad">
            <Card className="bg-neo-white">
                <CardHeader className="text-center border-b-3 border-black bg-neo-blue text-white rounded-t-[9px]">
                    <CardTitle className="text-3xl uppercase tracking-widest">Sign Up</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-8">
                    <div className="space-y-2">
                        <Label htmlFor="loginId">Login ID</Label>
                        <Input id="loginId" placeholder="Choose a unique ID (6-12 chars)" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email ID</Label>
                        <Input id="email" type="email" placeholder="Enter your email" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" placeholder="Strong password (>8 chars)" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Re-Enter Password</Label>
                        <Input id="confirmPassword" type="password" placeholder="Confirm your password" />
                    </div>

                    <Button variant="secondary" className="w-full text-lg mt-4" size="lg">
                        CREATE ACCOUNT
                    </Button>
                </CardContent>
                <CardFooter className="flex justify-center border-t-3 border-black bg-gray-50 rounded-b-[9px] py-4">
                    <span className="text-sm font-bold mr-2">Already have an account?</span>
                    <Link to="/login" class="text-sm font-bold text-neo-pink hover:underline">
                        Login here
                    </Link>
                </CardFooter>
            </Card>
        </AuthLayout>
    );
};

export default Signup;
