
// src/app/pos/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QrCode, Search, Plus, Minus, Trash2, Scale, CreditCard, Tag, Percent, Landmark } from 'lucide-react';
import type { Product } from '@/components/products/ProductTable'; 
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

const availableProducts: Product[] = [
  { id: '1', name: 'تفاح عضوي', category: 'فواكه', price: 2.99, stock: 150, unit: 'كيلو', image: 'https://placehold.co/40x40.png?text=ت', dataAiHint: 'apple fruit' },
  { id: '2', name: 'خبز قمح كامل', category: 'مخبوزات', price: 3.49, stock: 80, unit: 'قطعة', image: 'https://placehold.co/40x40.png?text=خ', dataAiHint: 'bread pastry' },
  { id: '3', name: 'بيض بلدي', category: 'ألبان وبيض', price: 4.99, stock: 60, unit: 'علبة', image: 'https://placehold.co/40x40.png?text=ب', dataAiHint: 'eggs dairy' },
  { id: '4', name: 'موز', category: 'فواكه', price: 0.50, stock: 200, unit: 'قطعة', image: 'https://placehold.co/40x40.png?text=م', dataAiHint: 'banana fruit' },
  { id: '5', name: 'صدر دجاج (للكيلو)', category: 'لحوم', price: 9.99, stock: 50, unit: 'كيلو', image: 'https://placehold.co/40x40.png?text=د', dataAiHint: 'chicken meat' },
  { id: '6', name: 'خيار (للكيلو)', category: 'خضروات', price: 1.50, stock: 0, unit: 'كيلو', image: 'https://placehold.co/40x40.png?text=خ', dataAiHint: 'cucumber vegetable' },
];

interface CartItem extends Product {
  quantity: number;
  isWeighed?: boolean;
  calculatedWeight?: number; 
  originalPrice: number; // Store original price per unit for non-weighed items
}

const PosPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedWeighedProduct, setSelectedWeighedProduct] = useState<Product | null>(null);
  const [totalPriceForWeighed, setTotalPriceForWeighed] = useState('');
  const [calculatedWeightDisplay, setCalculatedWeightDisplay] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredProducts = useMemo(() => 
    availableProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
      !cart.find(item => item.id === p.id) 
    ),
    [searchTerm, cart]
  );

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if(existingItem.isWeighed) {
        toast({ title: "معلومة", description: `${product.name} موجود بالفعل في السلة كمنتج موزون. قم بإزالته لإعادة إضافته.`, variant: "default" });
        return;
      }
      const newQuantity = Math.min(item.quantity + quantity, product.stock);
       if (newQuantity > item.quantity || quantity < 0) { // only check stock if increasing quantity
        setCart(cart.map(item => item.id === product.id ? { ...item, quantity: newQuantity } : item));
      } else {
         setCart(cart.map(item => item.id === product.id ? { ...item, quantity: newQuantity } : item));
      }
    } else {
      if (product.stock < quantity && !product.name.toLowerCase().includes('(للكيلو)')) {
         toast({ title: "تنبيه المخزون", description: `لا يوجد ما يكفي من ${product.name} في المخزون. المتوفر: ${product.stock}`, variant: "destructive" });
         return;
      }
      setCart([...cart, { ...product, quantity: Math.min(quantity, product.stock), originalPrice: product.price }]);
    }
  }, [cart, toast]);


  const updateQuantity = useCallback((productId: string, newQuantityInput: number | string) => {
    const newQuantity = Number(newQuantityInput);
    const productInCart = cart.find(item => item.id === productId);
    if (productInCart) {
      if (newQuantity > productInCart.stock && !productInCart.isWeighed) {
        toast({ title: "تنبيه المخزون", description: `لا يمكن تجاوز المخزون المتوفر لـ ${productInCart.name}. المتوفر: ${productInCart.stock}`, variant: "destructive" });
        setCart(cart.map(item => item.id === productId ? { ...item, quantity: productInCart.stock } : item)); // Reset to max stock
        return;
      }
      if (newQuantity <= 0) {
        removeFromCart(productId);
      } else {
        setCart(cart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
      }
    }
  }, [cart, toast]);

  const removeFromCart = useCallback((productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  }, [cart]);

  useEffect(() => {
    if (selectedWeighedProduct && totalPriceForWeighed) {
      const priceNum = parseFloat(totalPriceForWeighed);
      if (!isNaN(priceNum) && priceNum > 0 && selectedWeighedProduct.price > 0) {
        const weight = priceNum / selectedWeighedProduct.price;
        setCalculatedWeightDisplay(`${weight.toFixed(3)} كجم`);
      } else {
        setCalculatedWeightDisplay(null);
      }
    } else {
      setCalculatedWeightDisplay(null);
    }
  }, [selectedWeighedProduct, totalPriceForWeighed]);

  const handleAddWeighedItem = () => {
    if (!selectedWeighedProduct || !totalPriceForWeighed) {
      toast({ title: "خطأ", description: "يرجى تحديد منتج قابل للوزن وإدخال السعر الإجمالي.", variant: "destructive"});
      return;
    }
    const price = parseFloat(totalPriceForWeighed);
    if (isNaN(price) || price <= 0) {
      toast({ title: "خطأ", description: "يرجى إدخال سعر إجمالي صالح.", variant: "destructive"});
      return;
    }
    const calculatedWeight = price / selectedWeighedProduct.price;
    
    if (cart.find(item => item.id === selectedWeighedProduct.id)) {
      toast({ title: "معلومة", description: `${selectedWeighedProduct.name} موجود بالفعل في السلة. قم بإزالته لإعادة إضافته.`, variant: "default" });
      return;
    }

    setCart([...cart, { 
      ...selectedWeighedProduct, 
      quantity: 1, 
      price: price, // This price is the total price for the weighed item
      originalPrice: selectedWeighedProduct.price, // Price per kg
      isWeighed: true, 
      calculatedWeight 
    }]);
    setSelectedWeighedProduct(null);
    setTotalPriceForWeighed('');
    setCalculatedWeightDisplay(null);
    toast({ title: "تمت إضافة المنتج", description: `${selectedWeighedProduct.name} أضيف إلى السلة.` });
  };

  const cartTotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.isWeighed ? item.price : item.originalPrice * item.quantity), 0),
    [cart]
  );

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "سلة فارغة", description: "يرجى إضافة منتجات إلى السلة قبل الدفع.", variant: "destructive"});
      return;
    }
    // Placeholder for payment processing
    toast({ title: "تم الدفع بنجاح", description: `الإجمالي: ${cartTotal.toFixed(2)} ر.س. شكراً لك!` });
    setCart([]); 
  };

  const weighableProducts = useMemo(() => availableProducts.filter(p => p.unit.toLowerCase() === 'كيلو' || p.unit.toLowerCase() === 'غرام' || p.name.toLowerCase().includes('(للكيلو)')), []);


  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)]">
        {/* Left Panel: Product Search & Quick Add */}
        <div className="lg:w-2/5 flex flex-col gap-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground">بحث عن منتج</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <div className="relative flex-grow">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="ابحث عن منتجات أو امسح الباركود..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 bg-input/50 focus:bg-input"
                />
              </div>
              <Button variant="outline" size="icon" className="shrink-0">
                <QrCode className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg flex-1 flex flex-col min-h-0">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground">إضافة سريعة</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-3 overflow-hidden">
              <ScrollArea className="h-full pr-3">
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredProducts.slice(0, 12).map(product => (
                      <Button 
                        key={product.id} 
                        variant="outline" 
                        className="h-auto p-2 flex flex-col items-center justify-center text-center whitespace-normal break-words min-h-[90px] relative"
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0 && !weighableProducts.find(wp => wp.id === product.id)}
                      >
                        {product.stock === 0 && !weighableProducts.find(wp => wp.id === product.id) && (
                            <Badge variant="destructive" className="absolute top-1 right-1 text-xs px-1 py-0.5">نفذ</Badge>
                        )}
                        <Image src={product.image!} alt={product.name} width={30} height={30} className="mb-1 rounded" data-ai-hint="item product" />
                        <span className="text-xs leading-tight">{product.name}</span>
                        <span className="text-xs font-semibold text-primary">{product.price.toFixed(2)} ر.س/{product.unit}</span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">لا توجد منتجات تطابق البحث أو كلها في السلة.</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground">منتجات موزونة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select 
                value={selectedWeighedProduct?.id || ''} 
                onChange={(e) => {
                  setSelectedWeighedProduct(weighableProducts.find(p => p.id === e.target.value) || null);
                  setTotalPriceForWeighed('');
                  setCalculatedWeightDisplay(null);
                }}
                className="w-full p-2 border rounded-md bg-input/50 focus:bg-input text-sm"
              >
                <option value="">اختر منتج قابل للوزن</option>
                {weighableProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.price.toFixed(2)} ر.س/{p.unit})</option>
                ))}
              </select>
              <div className="relative">
                <Input 
                  type="number" 
                  placeholder="أدخل السعر الإجمالي للمنتج (ر.س)" 
                  value={totalPriceForWeighed}
                  onChange={(e) => setTotalPriceForWeighed(e.target.value)}
                  className="bg-input/50 focus:bg-input"
                  disabled={!selectedWeighedProduct}
                />
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ر.س</span>
              </div>
              {calculatedWeightDisplay && selectedWeighedProduct && (
                <div className="p-2 bg-muted/50 rounded-md text-sm text-center">
                  الوزن المحسوب: <span className="font-semibold text-primary">{calculatedWeightDisplay}</span> لـ <span className="font-medium">{selectedWeighedProduct.name}</span>
                </div>
              )}
              <Button onClick={handleAddWeighedItem} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!selectedWeighedProduct || !totalPriceForWeighed || (parseFloat(totalPriceForWeighed) <=0) }>
                <Scale className="ml-2 h-4 w-4" /> أضف منتج موزون للسلة
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Current Sale & Checkout */}
        <Card className="lg:w-3/5 shadow-lg flex flex-col h-full">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="font-headline text-2xl text-foreground">البيع الحالي</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {cart.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground text-lg p-6">السلة فارغة. ابدأ بإضافة المنتجات.</p>
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">المنتج</TableHead>
                    <TableHead className="text-center w-[25%]">الكمية/الوزن (المخزون)</TableHead>
                    <TableHead className="text-left w-[20%]">السعر الإجمالي</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {cart.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Image src={item.image!} alt={item.name} width={32} height={32} className="ml-3 rounded object-cover" data-ai-hint="item product"/>
                            <div>
                              <p className="font-medium text-foreground">{item.name}</p>
                              {!item.isWeighed && <p className="text-xs text-muted-foreground">{item.originalPrice.toFixed(2)} ر.س لل{item.unit}</p>}
                              {item.isWeighed && <p className="text-xs text-muted-foreground">{item.originalPrice.toFixed(2)} ر.س/{item.unit}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.isWeighed ? (
                            <div className="flex flex-col items-center">
                                <span className="font-medium">{item.calculatedWeight?.toFixed(3)} {item.unit}</span>
                                <span className="text-xs text-muted-foreground">(إجمالي السعر: {item.price.toFixed(2)} ر.س)</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input type="number" value={item.quantity} 
                                onChange={(e) => updateQuantity(item.id, e.target.value)} 
                                onBlur={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                className="w-12 h-8 text-center text-sm p-1 bg-input/30 focus:bg-input"
                                min="1"
                                max={item.stock}
                              />
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                           {!item.isWeighed && <span className="text-xs text-muted-foreground block mt-1">(المخزون: {item.stock})</span>}
                        </TableCell>
                        <TableCell className="text-left font-semibold text-foreground">
                          {(item.isWeighed ? item.price : (item.originalPrice * item.quantity)).toFixed(2)} ر.س
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              )}
            </ScrollArea>
          </CardContent>
          <Separator className="my-0" />
          <CardFooter className="flex-shrink-0 p-4 md:p-6 space-y-4">
            <div className="flex justify-between items-center text-xl font-semibold">
              <span className="text-muted-foreground">الإجمالي:</span>
              <span className="font-headline text-primary">{cartTotal.toFixed(2)} ر.س</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex-1 text-sm">
                    <Tag className="ml-2 h-4 w-4"/> تطبيق كوبون
                </Button>
                <Button variant="outline" className="flex-1 text-sm">
                    <Percent className="ml-2 h-4 w-4"/> إضافة خصم
                </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="text-sm py-3"><Landmark className="ml-2 h-4 w-4"/> دفع آجل</Button>
                <Button className="w-full text-lg py-3 bg-primary hover:bg-primary/90 text-primary-foreground col-span-2 sm:col-span-1" onClick={handleCheckout}>
                  <CreditCard className="ml-2 h-5 w-5" /> الدفع الآن
                </Button>
            </div>
             <p className="text-xs text-muted-foreground text-center">طرق دفع أخرى (بطاقة، تحويل) يمكن تفعيلها من الإعدادات.</p>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PosPage;

    