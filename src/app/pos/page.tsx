
// src/app/pos/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { QrCode, Search, Plus, Minus, Trash2, Scale, CreditCard, Tag, Percent, Landmark, Edit3 } from 'lucide-react';
import type { Product as BaseProduct } from '@/components/products/ProductTable'; 
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define Product type specifically for POS, clarifying price is per unit
interface Product extends Omit<BaseProduct, 'price'> {
  pricePerUnit: number; // Price per piece, or price per KG/Gram for weighable
}

interface CartItem extends Product {
  itemQuantityInCart: number; // For regular items: count. For weighed items: the weight (e.g., 0.250 for 250g)
  totalItemPrice: number; // Calculated price for this line item (product.pricePerUnit * itemQuantityInCart)
  isWeighed: boolean;
}

const initialAvailableProducts: Product[] = [
  { id: '1', name: 'تفاح عضوي', category: 'فواكه', pricePerUnit: 12.50, stock: 150, unit: 'كيلو', image: 'https://placehold.co/40x40.png?text=ت', dataAiHint: 'apple fruit' },
  { id: '2', name: 'خبز قمح كامل', category: 'مخبوزات', pricePerUnit: 3.49, stock: 80, unit: 'قطعة', image: 'https://placehold.co/40x40.png?text=خ', dataAiHint: 'bread pastry' },
  { id: '3', name: 'بيض بلدي (العلبة)', category: 'ألبان وبيض', pricePerUnit: 15.00, stock: 60, unit: 'علبة', image: 'https://placehold.co/40x40.png?text=ب', dataAiHint: 'eggs dairy' },
  { id: '4', name: 'موز', category: 'فواكه', pricePerUnit: 5.75, stock: 200, unit: 'كيلو', image: 'https://placehold.co/40x40.png?text=م', dataAiHint: 'banana fruit' },
  { id: '5', name: 'صدر دجاج', category: 'لحوم', pricePerUnit: 28.00, stock: 50, unit: 'كيلو', image: 'https://placehold.co/40x40.png?text=د', dataAiHint: 'chicken meat' },
  { id: '6', name: 'خيار', category: 'خضروات', pricePerUnit: 7.00, stock: 0, unit: 'كيلو', image: 'https://placehold.co/40x40.png?text=خ', dataAiHint: 'cucumber vegetable' },
  { id: '7', name: 'طماطم', category: 'خضروات', pricePerUnit: 6.50, stock: 120, unit: 'كيلو', image: 'https://placehold.co/40x40.png?text=ط', dataAiHint: 'tomato vegetable' },
  { id: '8', name: 'مياه معدنية (قارورة)', category: 'مشروبات', pricePerUnit: 1.50, stock: 300, unit: 'قطعة', image: 'https://placehold.co/40x40.png?text=م', dataAiHint: 'water bottle' },
];


const PosPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [productToWeigh, setProductToWeigh] = useState<Product | null>(null);
  const [weightInputValue, setWeightInputValue] = useState(''); // For modal
  const [calculatedPriceForWeight, setCalculatedPriceForWeight] = useState(0);

  // New state for direct weighable product entry
  const [selectedDirectWeighProduct, setSelectedDirectWeighProduct] = useState<Product | null>(null);
  const [directWeightInput, setDirectWeightInput] = useState('');


  const isProductWeighable = (product: Product): boolean => {
    return product.unit.toLowerCase() === 'كيلو' || product.unit.toLowerCase() === 'غرام';
  };

  const weighableProductsForSelect = useMemo(() => 
    initialAvailableProducts.filter(p => isProductWeighable(p)),
    []
  );

  const filteredProducts = useMemo(() => 
    initialAvailableProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!isProductWeighable(p) || !cart.find(item => item.id === p.id && item.isWeighed)) 
    ),
    [searchTerm, cart] 
  );

  const handleProductSelection = useCallback((product: Product) => {
    if (product.stock === 0 && !isProductWeighable(product)) { 
        toast({ title: "نفذ المخزون", description: `عفواً، ${product.name} غير متوفر حالياً.`, variant: "destructive" });
        return;
    }

    if (isProductWeighable(product)) {
      setProductToWeigh(product);
      const existingCartItem = cart.find(item => item.id === product.id && item.isWeighed);
      setWeightInputValue(existingCartItem ? String(existingCartItem.itemQuantityInCart) : '');
      setCalculatedPriceForWeight(existingCartItem ? existingCartItem.totalItemPrice : 0);
      setIsWeightModalOpen(true);
    } else {
      const existingItemIndex = cart.findIndex(item => item.id === product.id && !item.isWeighed);
      if (existingItemIndex > -1) {
        const updatedCart = [...cart];
        const currentItem = updatedCart[existingItemIndex];
        if (currentItem.itemQuantityInCart < product.stock) {
          updatedCart[existingItemIndex] = {
            ...currentItem,
            itemQuantityInCart: currentItem.itemQuantityInCart + 1,
            totalItemPrice: product.pricePerUnit * (currentItem.itemQuantityInCart + 1),
          };
          setCart(updatedCart);
        } else {
          toast({ title: "تنبيه المخزون", description: `لا يوجد ما يكفي من ${product.name} في المخزون. المتوفر: ${product.stock}`, variant: "destructive" });
        }
      } else {
        if (product.stock < 1) {
           toast({ title: "نفذ المخزون", description: `${product.name} غير متوفر حالياً.`, variant: "destructive" });
           return;
        }
        setCart([...cart, {
          ...product,
          itemQuantityInCart: 1,
          totalItemPrice: product.pricePerUnit * 1,
          isWeighed: false,
        }]);
      }
    }
  }, [cart, toast]);

  useEffect(() => {
    if (productToWeigh && weightInputValue) {
      const weight = parseFloat(weightInputValue);
      if (!isNaN(weight) && weight > 0) {
        setCalculatedPriceForWeight(productToWeigh.pricePerUnit * weight);
      } else {
        setCalculatedPriceForWeight(0);
      }
    } else {
      setCalculatedPriceForWeight(0);
    }
  }, [productToWeigh, weightInputValue]);

  const handleAddOrUpdateWeighedProduct = () => { // This is for the MODAL flow
    if (!productToWeigh || !weightInputValue) return;
    const weight = parseFloat(weightInputValue);

    if (isNaN(weight) || weight <= 0) {
      toast({ title: "خطأ في الإدخال", description: "يرجى إدخال وزن صحيح للمنتج.", variant: "destructive" });
      return;
    }
    
    const existingItemIndex = cart.findIndex(item => item.id === productToWeigh.id && item.isWeighed);
    if (existingItemIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        itemQuantityInCart: weight,
        totalItemPrice: productToWeigh.pricePerUnit * weight,
      };
      setCart(updatedCart);
      toast({ title: "تم تحديث المنتج", description: `تم تحديث وزن ${productToWeigh.name} إلى ${weight} ${productToWeigh.unit}.` });
    } else {
      setCart([...cart, {
        ...productToWeigh,
        itemQuantityInCart: weight,
        totalItemPrice: productToWeigh.pricePerUnit * weight,
        isWeighed: true,
      }]);
      toast({ title: "تمت إضافة المنتج", description: `${productToWeigh.name} (${weight} ${productToWeigh.unit}) أضيف إلى السلة.` });
    }
    setIsWeightModalOpen(false);
    setProductToWeigh(null);
    setWeightInputValue('');
  };

  const handleDirectAddWeighedProduct = () => {
    if (!selectedDirectWeighProduct || !directWeightInput) return;
    const weight = parseFloat(directWeightInput);
  
    if (isNaN(weight) || weight <= 0) {
      toast({ title: "خطأ في الإدخال", description: "يرجى إدخال وزن صحيح للمنتج.", variant: "destructive" });
      return;
    }
  
    const existingItemIndex = cart.findIndex(item => item.id === selectedDirectWeighProduct.id && item.isWeighed);
    if (existingItemIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        itemQuantityInCart: weight, 
        totalItemPrice: selectedDirectWeighProduct.pricePerUnit * weight,
      };
      setCart(updatedCart);
      toast({ title: "تم تحديث وزن المنتج", description: `تم تحديث وزن ${selectedDirectWeighProduct.name} في السلة إلى ${weight} ${selectedDirectWeighProduct.unit}.` });
    } else {
      setCart([...cart, {
        ...selectedDirectWeighProduct,
        itemQuantityInCart: weight,
        totalItemPrice: selectedDirectWeighProduct.pricePerUnit * weight,
        isWeighed: true,
      }]);
      toast({ title: "تمت إضافة المنتج", description: `${selectedDirectWeighProduct.name} (${weight} ${selectedDirectWeighProduct.unit}) أضيف إلى السلة.` });
    }
  
    setSelectedDirectWeighProduct(null);
    setDirectWeightInput('');
  };
  
  const updateCartItemQuantity = useCallback((productId: string, newQuantityValue: number | string) => {
    const newQuantity = Number(newQuantityValue);
    const itemIndex = cart.findIndex(item => item.id === productId && !item.isWeighed);

    if (itemIndex === -1) return;

    const updatedCart = [...cart];
    const item = updatedCart[itemIndex];

    if (newQuantity <= 0) {
      updatedCart.splice(itemIndex, 1); 
    } else if (newQuantity > item.stock) {
      updatedCart[itemIndex] = { ...item, itemQuantityInCart: item.stock, totalItemPrice: item.pricePerUnit * item.stock };
      toast({ title: "تنبيه المخزون", description: `الكمية القصوى المتوفرة لـ ${item.name} هي ${item.stock}.`, variant: "destructive" });
    } else {
      updatedCart[itemIndex] = { ...item, itemQuantityInCart: newQuantity, totalItemPrice: item.pricePerUnit * newQuantity };
    }
    setCart(updatedCart);
  }, [cart, toast]);

  const removeFromCart = useCallback((productId: string, isWeighedItem: boolean) => {
    setCart(prevCart => prevCart.filter(item => !(item.id === productId && item.isWeighed === isWeighedItem) ));
    toast({ title: "تمت إزالة المنتج", description: "تمت إزالة المنتج من السلة." });
  }, [toast]);


  const cartTotal = useMemo(() => 
    cart.reduce((sum, item) => sum + item.totalItemPrice, 0),
    [cart]
  );

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "سلة فارغة", description: "يرجى إضافة منتجات إلى السلة قبل الدفع.", variant: "destructive"});
      return;
    }
    toast({ title: "تم الدفع بنجاح", description: `الإجمالي: ${cartTotal.toFixed(2)} ر.س. شكراً لك!` });
    setCart([]); 
    setSelectedDirectWeighProduct(null);
    setDirectWeightInput('');
  };

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)]">
        {/* Left Panel: Product Search & Quick Add */}
        <div className="lg:w-2/5 flex flex-col gap-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground">بحث وإضافة منتجات</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Existing Search Row */}
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    type="text" 
                    placeholder="ابحث بالاسم أو امسح الباركود..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 bg-input/50 focus:bg-input"
                  />
                </div>
                <Button variant="outline" size="icon" className="shrink-0">
                  <QrCode className="h-5 w-5" />
                </Button>
              </div>

              <Separator /> 
              
              {/* New Direct Weighable Product Section */}
              <div>
                <h3 className="text-md font-semibold mb-2 text-muted-foreground">إضافة سريعة لمنتج بالوزن:</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="direct-weigh-product-select">اختر منتجًا</Label>
                    <Select
                      value={selectedDirectWeighProduct?.id || ""}
                      onValueChange={(productId) => {
                        const product = initialAvailableProducts.find(p => p.id === productId);
                        setSelectedDirectWeighProduct(product || null);
                      }}
                      dir="rtl"
                    >
                      <SelectTrigger id="direct-weigh-product-select" className="mt-1 bg-input/50 focus:bg-input">
                        <SelectValue placeholder="اختر منتجًا للوزن..." />
                      </SelectTrigger>
                      <SelectContent>
                        {weighableProductsForSelect.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.pricePerUnit.toFixed(2)} ر.س/{p.unit})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="direct-weight-input">الوزن (بالكيلو)</Label>
                    <Input
                      id="direct-weight-input"
                      type="number"
                      value={directWeightInput}
                      onChange={(e) => setDirectWeightInput(e.target.value)}
                      placeholder="مثال: 0.250"
                      className="mt-1 bg-input/50 focus:bg-input"
                      step="0.001"
                      disabled={!selectedDirectWeighProduct}
                    />
                     <p className="text-xs text-muted-foreground mt-1">ادخل الوزن بالكيلو، مثال: 0.2 لـ 200 غرام, 1.4 لـ 1400 غرام.</p>
                  </div>
                  <Button
                    onClick={handleDirectAddWeighedProduct}
                    disabled={!selectedDirectWeighProduct || !directWeightInput || parseFloat(directWeightInput) <= 0}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Plus className="ml-2 h-4 w-4" /> إضافة المنتج الموزون للسلة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg flex-1 flex flex-col min-h-0">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground">قائمة المنتجات (إضافة سريعة)</CardTitle>
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
                        onClick={() => handleProductSelection(product)}
                        disabled={product.stock === 0 && !isProductWeighable(product)}
                      >
                        {product.stock === 0 && !isProductWeighable(product) && (
                            <Badge variant="destructive" className="absolute top-1 right-1 text-xs px-1 py-0.5">نفذ</Badge>
                        )}
                        <Image src={product.image!} alt={product.name} width={30} height={30} className="mb-1 rounded" data-ai-hint={product.dataAiHint || "item product"} />
                        <span className="text-xs leading-tight">{product.name}</span>
                        <span className="text-xs font-semibold text-primary">{product.pricePerUnit.toFixed(2)} ر.س/{product.unit}</span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">لا توجد منتجات تطابق البحث أو كلها في السلة.</p>
                )}
              </ScrollArea>
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
                    <TableHead className="w-[40%]">المنتج</TableHead>
                    <TableHead className="text-center w-[30%]">الكمية/الوزن (المخزون)</TableHead>
                    <TableHead className="text-left w-[25%]">السعر الإجمالي</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {cart.map(item => (
                      <TableRow key={`${item.id}-${item.isWeighed}`}>
                        <TableCell>
                          <div className="flex items-center">
                            <Image src={item.image!} alt={item.name} width={32} height={32} className="ml-3 rounded object-cover" data-ai-hint={item.dataAiHint || "item product"}/>
                            <div>
                              <p className="font-medium text-foreground">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.pricePerUnit.toFixed(2)} ر.س لل{item.unit}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.isWeighed ? (
                            <div className="flex items-center justify-center gap-2">
                                <span className="font-medium">{item.itemQuantityInCart.toFixed(3)} {item.unit}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleProductSelection(item)}>
                                    <Edit3 className="h-3 w-3 text-primary" />
                                </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCartItemQuantity(item.id, item.itemQuantityInCart - 1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input type="number" value={item.itemQuantityInCart} 
                                onChange={(e) => updateCartItemQuantity(item.id, e.target.value)} 
                                onBlur={(e) => updateCartItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                className="w-12 h-8 text-center text-sm p-1 bg-input/30 focus:bg-input"
                                min="1"
                                max={item.stock}
                              />
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateCartItemQuantity(item.id, item.itemQuantityInCart + 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                           <span className="text-xs text-muted-foreground block mt-1">(المخزون: {item.stock} {item.unit})</span>
                        </TableCell>
                        <TableCell className="text-left font-semibold text-foreground">
                          {item.totalItemPrice.toFixed(2)} ر.س
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => removeFromCart(item.id, item.isWeighed)}>
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

      {/* Weight Input Modal (for quick add selection) */}
      <Dialog open={isWeightModalOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
            setProductToWeigh(null);
            setWeightInputValue('');
        }
        setIsWeightModalOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-md bg-card">
            <DialogHeader>
                <DialogTitle className="font-headline text-2xl text-foreground">إدخال وزن المنتج</DialogTitle>
            </DialogHeader>
            {productToWeigh && (
                <div className="space-y-4 py-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                        <Image src={productToWeigh.image!} alt={productToWeigh.name} width={40} height={40} className="rounded" data-ai-hint={productToWeigh.dataAiHint || "item product"}/>
                        <div>
                            <p className="font-medium text-lg">{productToWeigh.name}</p>
                            <p className="text-sm text-muted-foreground">{productToWeigh.pricePerUnit.toFixed(2)} ر.س / {productToWeigh.unit}</p>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="weight-input-modal" className="text-muted-foreground">الوزن المطلوب ({productToWeigh.unit})</Label>
                        <Input 
                            id="weight-input-modal"
                            type="number"
                            value={weightInputValue}
                            onChange={(e) => setWeightInputValue(e.target.value)}
                            placeholder={`مثال: 0.250 لـ ربع ${productToWeigh.unit}`}
                            className="mt-1 bg-input/50 focus:bg-input text-lg"
                            step="0.001"
                        />
                    </div>
                    {parseFloat(weightInputValue) > 0 && (
                         <div className="p-3 bg-primary/10 rounded-md text-center">
                            <p className="text-sm text-muted-foreground">السعر المحسوب</p>
                            <p className="text-2xl font-semibold text-primary">{calculatedPriceForWeight.toFixed(2)} ر.س</p>
                        </div>
                    )}
                </div>
            )}
            <DialogFooter>
                <Button onClick={handleAddOrUpdateWeighedProduct} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!productToWeigh || !weightInputValue || parseFloat(weightInputValue) <= 0}>
                    {cart.find(item => item.id === productToWeigh?.id && item.isWeighed) ? 'تحديث الوزن في السلة' : 'إضافة إلى السلة'}
                </Button>
                <DialogClose asChild>
                    <Button type="button" variant="outline">إلغاء</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </AppLayout>
  );
};

export default PosPage;

    
