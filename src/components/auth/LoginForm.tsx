
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
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  // Simulate API call for authentication
  const mockApiLogin = (emailInput: string, passwordInput: string): Promise<{ success: boolean; userName?: string; error?: string }> => {
    return new Promise(resolve => {
      setTimeout(() => {
        if (emailInput === 'admin@alwaseet.com' && passwordInput === 'password') {
          resolve({ success: true, userName: 'مستخدم مسؤول' });
        } else if (emailInput === 'user@alwaseet.com' && passwordInput === 'password123') {
          resolve({ success: true, userName: 'مستخدم عادي' });
        }
        else {
          resolve({ success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صالحة.' });
        }
      }, 1000); // Simulate network delay
    });
  };

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
    setIsLoading(true);
    try {
      const response = await mockApiLogin(email, password);
      if (response.success && response.userName) {
        login(email, response.userName); // AuthContext handles redirection
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً بعودتك، ${response.userName}!`,
        });
      } else {
        toast({
          title: "فشل تسجيل الدخول",
          description: response.error || "حدث خطأ غير متوقع.",
          variant: "destructive",
        });
      }
    } catch (error) {
       toast({
        title: "خطأ في النظام",
        description: "حدث خطأ أثناء محاولة تسجيل الدخول. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
                disabled={isLoading}
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
                disabled={isLoading}
                className="bg-input/50 focus:bg-input"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <LogIn className="ml-2 h-5 w-5" />
              )}
              {isLoading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        للتجربة: <code className="font-code bg-muted px-1 py-0.5 rounded">admin@alwaseet.com</code> / <code className="font-code bg-muted px-1 py-0.5 rounded">password</code>
      </p>
       <p className="mt-2 text-center text-sm text-muted-foreground">
        أو: <code className="font-code bg-muted px-1 py-0.5 rounded">user@alwaseet.com</code> / <code className="font-code bg-muted px-1 py-0.5 rounded">password123</code>
      </p>
    </div>
  );
};

    