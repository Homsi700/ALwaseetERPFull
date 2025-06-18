
// src/components/auth/LoginForm.tsx
"use client";

import { useState, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "يرجى إدخال البريد الإلكتروني وكلمة المرور.",
        variant: "destructive",
      });
      return;
    }
    if (email === 'admin@alwaseet.com' && password === 'password') {
      login(email, 'مستخدم مسؤول');
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بعودتك!",
      });
    } else {
      toast({
        title: "فشل تسجيل الدخول",
        description: "بريد إلكتروني أو كلمة مرور غير صالحة.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Building className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">الوسيط UI</CardTitle>
          <CardDescription className="text-muted-foreground">قم بالوصول بأمان إلى لوحة تحكم المخزون والمبيعات الخاصة بك.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@alwaseet.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input/50 focus:bg-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-input/50 focus:bg-input"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <LogIn className="ml-2 h-5 w-5" /> تسجيل الدخول
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        بيانات الدخول التجريبية: <code className="font-code bg-muted px-1 py-0.5 rounded">admin@alwaseet.com</code> / <code className="font-code bg-muted px-1 py-0.5 rounded">password</code>
      </p>
    </div>
  );
};
