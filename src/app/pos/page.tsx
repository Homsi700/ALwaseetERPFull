
// src/app/pos/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { QrCode, Search, Plus, Minus, Trash2, CreditCard, Percent, Landmark, Edit3, PackageSearch, TicketX, MinusCircle } from 'lucide-react';
import type { Product as BaseProduct } from '@/components/products/ProductTable'; 
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

interface Product extends BaseProduct {
  pricePerUnit: number; 
}

interface CartItem extends Product {
  itemQuantityInCart: number; 
  totalItemPrice: number; 
  isWeighed: boolean;
}

const PosPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [productToWeigh, setProductToWeigh] = useState<Product | null>(null);
  const [weightInputValue, setWeightInputValue] = useState('');
  
  const [selectedDirectWeighProduct, setSelectedDirectWeighProduct] = useState<Product | null>(null);
  const [directWeightInput, setDirectWeightInput] = useState('');
  const directWeightInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountInput, setDiscountInput] = useState<string>('');


  const mapFromSupabaseProduct = useCallback((supabaseProduct: any): Product => {
    return {
      id: supabaseProduct.id,
      name: supabaseProduct.name,
      description: supabaseProduct.description || '',
      unit: supabaseProduct.unit as Product['unit'],
      productType: supabaseProduct.product_type as Product['productType'],
      barcodeNumber: supabaseProduct.barcode_number || '',
      purchasePrice: supabaseProduct.purchase_price || 0,
      salePrice: supabaseProduct.sale_price || 0,
      pricePerUnit: supabaseProduct.sale_price || 0, 
      stock: supabaseProduct.stock || 0,
      minStockLevel: supabaseProduct.min_stock_level || 0,
      category: supabaseProduct.category || 'غير محدد',
      image: supabaseProduct.image_url,
      dataAiHint: supabaseProduct.data_ai_hint,
    };
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setIsLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      if (data) {
        setAvailableProducts(data.map(mapFromSupabaseProduct));
      }
    } catch (error: any) {
      toast({
        title: 'خطأ في جلب المنتجات',
        description: error.message || 'فشل الاتصال بالخادم.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProducts(false);
    }
  }, [toast, user, mapFromSupabaseProduct]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const isProductWeighable = (product: Product): boolean => {
    const unit = product.unit?.toLowerCase();
    return unit === 'كيلو' || unit === 'غرام';
  };

  const weighableProductsForSelect = useMemo(() => 
    availableProducts.filter(p => isProductWeighable(p) && p.stock > 0),
    [availableProducts]
  );

  const filteredProductsForQuickAdd = useMemo(() => 
    availableProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!isProductWeighable(p) || !cart.find(item => item.id === p.id && item.isWeighed)) &&
      p.stock > 0 // Only show products with stock for quick add
    ),
    [searchTerm, cart, availableProducts] 
  );

  const addProductToCart = useCallback((product: Product, quantity: number, isWeighedItem: boolean) => {
    if (product.stock === 0 && !isWeighedItem) {
        toast({ title: "نفذ المخزون", description: `عفواً، ${product.name} غير متوفر حالياً.`, variant: "destructive" });
        return;
    }
    if (isWeighedItem && product.stock < quantity) {
         toast({ title: "تنبيه المخزون", description: `الكمية المتوفرة من ${product.name} هي ${product.stock} ${product.unit}. سيتم إضافة الكمية المتوفرة فقط.`, variant: "destructive"});
         quantity = product.stock;
    }


    const existingItemIndex = cart.findIndex(item => item.id === product.id && item.isWeighed === isWeighedItem);
    
    if (existingItemIndex > -1) {
      const updatedCart = [...cart];
      const currentItem = updatedCart[existingItemIndex];
      const newQuantity = isWeighedItem ? quantity : currentItem.itemQuantityInCart + quantity;

      if (!isWeighedItem && newQuantity > product.stock) {
        toast({ title: "تنبيه المخزون", description: `لا يوجد ما يكفي من ${product.name} في المخزون. المتوفر: ${product.stock}`, variant: "destructive" });
        updatedCart[existingItemIndex] = {
          ...currentItem,
          itemQuantityInCart: product.stock,
          totalItemPrice: product.pricePerUnit * product.stock,
        };
      } else {
        updatedCart[existingItemIndex] = {
          ...currentItem,
          itemQuantityInCart: newQuantity,
          totalItemPrice: product.pricePerUnit * newQuantity,
        };
      }
      setCart(updatedCart);
       if (isWeighedItem) toast({ title: "تم تحديث وزن المنتج", description: `تم تحديث وزن ${product.name} في السلة إلى ${quantity.toFixed(3)} ${product.unit}.` });

    } else {
      if (!isWeighedItem && product.stock < quantity) {
         toast({ title: "نفذ المخزون", description: `${product.name} غير متوفر حالياً بالكمية المطلوبة. المتوفر: ${product.stock}`, variant: "destructive" });
         return;
      }
      setCart(prevCart => [...prevCart, {
        ...product,
        itemQuantityInCart: quantity,
        totalItemPrice: product.pricePerUnit * quantity,
        isWeighed: isWeighedItem,
      }]);
      if (!isWeighedItem) toast({ title: "تمت إضافة المنتج", description: `${product.name} أضيف إلى السلة.` });
    }
  }, [cart, toast]);

  const handleProductSelection = useCallback((product: Product) => {
    if (product.stock <= 0 && !isProductWeighable(product)) { 
        toast({ title: "نفذ المخزون", description: `عفواً، ${product.name} غير متوفر حالياً.`, variant: "destructive" });
        return;
    }

    if (isProductWeighable(product)) {
      if (product.stock <= 0) {
         toast({ title: "نفذ المخزون", description: `عفواً، ${product.name} غير متوفر حالياً للوزن.`, variant: "destructive" });
         return;
      }
      setProductToWeigh(product);
      const existingCartItem = cart.find(item => item.id === product.id && item.isWeighed);
      setWeightInputValue(existingCartItem ? String(existingCartItem.itemQuantityInCart) : '');
      setIsWeightModalOpen(true);
    } else {
      addProductToCart(product, 1, false);
    }
  }, [cart, toast, addProductToCart]);


  const handleAddOrUpdateWeighedProduct = useCallback(() => {
    if (!productToWeigh || !weightInputValue) return;
    let weight = parseFloat(weightInputValue);

    if (isNaN(weight) || weight <= 0) {
      toast({ title: "خطأ في الإدخال", description: "يرجى إدخال وزن صحيح للمنتج.", variant: "destructive" });
      return;
    }
    addProductToCart(productToWeigh, weight, true);
    
    setIsWeightModalOpen(false);
    setProductToWeigh(null);
    setWeightInputValue('');
  }, [productToWeigh, weightInputValue, toast, addProductToCart]);


  const handleDirectAddWeighedProduct = useCallback(() => {
    if (!selectedDirectWeighProduct || !directWeightInput) return;
    let weight = parseFloat(directWeightInput);
  
    if (isNaN(weight) || weight <= 0) {
      toast({ title: "خطأ في الإدخال", description: "يرجى إدخال وزن صحيح للمنتج.", variant: "destructive" });
      return;
    }
    addProductToCart(selectedDirectWeighProduct, weight, true);
  
    setSelectedDirectWeighProduct(null);
    setDirectWeightInput('');
    toast({ title: "تمت إضافة المنتج الموزون", description: `${selectedDirectWeighProduct.name} (${weight.toFixed(3)} ${selectedDirectWeighProduct.unit}) أضيف إلى السلة.` });

  }, [selectedDirectWeighProduct, directWeightInput, toast, addProductToCart]);
  
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

  const subTotal = useMemo(() => 
    cart.reduce((sum, item) => sum + item.totalItemPrice, 0),
    [cart]
  );

  const cartTotal = useMemo(() => {
    const calculatedTotal = subTotal - discountAmount;
    return calculatedTotal > 0 ? calculatedTotal : 0;
  }, [subTotal, discountAmount]);


  const handleBarcodeScan = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    const product = availableProducts.find(p => p.barcodeNumber === barcode.trim());

    if (product) {
      if (product.stock <=0 && !isProductWeighable(product)) {
        toast({ title: "نفذ المخزون", description: `منتج الباركود ${product.name} غير متوفر.`, variant: "destructive" });
      } else if (isProductWeighable(product)) {
        if (product.stock <= 0) {
           toast({ title: "نفذ المخزون", description: `منتج الباركود ${product.name} غير متوفر للوزن.`, variant: "destructive" });
        } else {
            setProductToWeigh(product);
            setIsWeightModalOpen(true);
        }
      } else {
        addProductToCart(product, 1, false);
      }
    } else {
      toast({ title: "لم يتم العثور على المنتج", description: `لم يتم العثور على منتج برمز الباركود: ${barcode}`, variant: "destructive" });
    }
    setSearchTerm(''); 
    barcodeInputRef.current?.focus();
  }, [availableProducts, toast, addProductToCart]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && searchTerm.trim() && document.activeElement === barcodeInputRef.current) {
        event.preventDefault();
        handleBarcodeScan(searchTerm);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchTerm, handleBarcodeScan]);


  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ title: "سلة فارغة", description: "يرجى إضافة منتجات إلى السلة قبل الدفع.", variant: "destructive"});
      return;
    }
    if (!user) {
        toast({ title: "خطأ", description: "يجب تسجيل الدخول لإتمام العملية.", variant: "destructive"});
        return;
    }

    setIsLoadingProducts(true); 

    try {
      // TODO: Add a column 'discount_amount' (NUMERIC) to your 'sales' table in Supabase.
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          total_amount: cartTotal, // This is the final amount after discount
          // discount_amount: discountAmount, // Uncomment this after adding the column
          payment_method: 'Cash', 
          sale_date: new Date().toISOString(),
          user_id: user.id,
        })
        .select()
        .single();

      if (saleError) throw saleError;
      if (!saleData) throw new Error("فشل في إنشاء سجل البيع.");

      const saleId = saleData.id;

      const saleItemsToInsert = cart.map(item => ({
        sale_id: saleId,
        product_id: item.id,
        quantity: item.itemQuantityInCart,
        unit_price: item.pricePerUnit,
        total_price: item.totalItemPrice,
      }));

      const { error: saleItemsError } = await supabase.from('sale_items').insert(saleItemsToInsert);
      if (saleItemsError) throw saleItemsError;

      for (const item of cart) {
        const { data: currentProductData, error: fetchError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.id)
          .single();

        if (fetchError || !currentProductData) {
          console.error(`Error fetching stock for product ${item.name}:`, fetchError);
          toast({ title: "خطأ جزئي في تحديث المخزون", description: `فشل في جلب المخزون الحالي لـ ${item.name}. البيع سُجل ولكن قد يكون المخزون غير دقيق.`, variant: "destructive" });
          continue;
        }
        
        const quantityToDeduct = item.itemQuantityInCart;
        const newStock = currentProductData.stock - quantityToDeduct;

        if (newStock < 0) {
            toast({ title: "خطأ حرج في المخزون", description: `نفذ مخزون ${item.name} أثناء محاولة إتمام البيع. تم بيع ${currentProductData.stock} فقط. يرجى مراجعة المخزون.`, variant: "destructive" });
            const { error: stockUpdateErrorNegative } = await supabase
                .from('products')
                .update({ stock: 0 }) 
                .eq('id', item.id);
            if (stockUpdateErrorNegative) {
                console.error(`Error setting stock to 0 for ${item.name}:`, stockUpdateErrorNegative);
            }
        } else {
            const { error: stockUpdateError } = await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', item.id);
            if (stockUpdateError) {
                console.error(`Error updating stock for ${item.name}:`, stockUpdateError);
            }
        }
      }
      
      toast({ title: "تم الدفع بنجاح", description: `الإجمالي: ${cartTotal.toFixed(2)} ل.س. تم تحديث المخزون وتسجيل البيع.` });
      setCart([]); 
      setSelectedDirectWeighProduct(null);
      setDirectWeightInput('');
      setDiscountAmount(0);
      setDiscountInput('');
      await fetchProducts(); 
      barcodeInputRef.current?.focus(); // Refocus barcode input
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({ title: "خطأ أثناء الدفع", description: error.message || "فشلت عملية الدفع أو تحديث المخزون.", variant: "destructive"});
    } finally {
        setIsLoadingProducts(false);
    }
  };
  
  const handleApplyDiscount = () => {
    const amount = parseFloat(discountInput);
    if (isNaN(amount) || amount < 0) {
      toast({ title: "مبلغ خصم غير صالح", description: "يرجى إدخال مبلغ خصم صحيح.", variant: "destructive" });
      setDiscountAmount(0);
      return;
    }
    if (amount > subTotal) {
      toast({ title: "مبلغ الخصم كبير جداً", description: "مبلغ الخصم لا يمكن أن يتجاوز المجموع الفرعي.", variant: "destructive" });
      setDiscountAmount(subTotal); // Cap discount at subTotal
      setDiscountInput(subTotal.toString());
      return;
    }
    setDiscountAmount(amount);
    toast({ title: "تم تطبيق الخصم", description: `تم خصم مبلغ ${amount.toFixed(2)} ل.س.` });
    setIsDiscountModalOpen(false);
  };


  if (isLoadingProducts && !user && cart.length === 0) { 
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }
  
  if (!user && !isLoadingProducts) { 
     return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-lg text-muted-foreground mb-4">يرجى تسجيل الدخول للوصول إلى نقطة البيع.</p>
        </div>
      </AppLayout>
    );
  }


  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-7rem)] max-h-[calc(100vh-7rem)]">
        <div className="lg:w-2/5 flex flex-col gap-3">
          <Card className="shadow-lg">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="font-headline text-lg text-foreground">بحث وإضافة منتجات</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-4 pb-4">
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    ref={barcodeInputRef}
                    type="text" 
                    id="quick-search-barcode"
                    placeholder="امسح الباركود أو ابحث بالاسم..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 bg-input/50 focus:bg-input text-sm"
                  />
                </div>
                <Button variant="outline" size="icon" className="shrink-0 h-9 w-9" onClick={() => barcodeInputRef.current?.focus()}>
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
              <Separator /> 
              <div>
                <h3 className="text-sm font-semibold mb-1 text-muted-foreground">إضافة سريعة لمنتج بالوزن:</h3>
                 <form onSubmit={(e) => { e.preventDefault(); handleDirectAddWeighedProduct(); }} className="space-y-2">
                  <div>
                    <Label htmlFor="direct-weigh-product-select" className="text-xs">اختر منتجًا</Label>
                    <Select
                      value={selectedDirectWeighProduct?.id || ""}
                      onValueChange={(productId) => {
                        const product = availableProducts.find(p => p.id === productId);
                        setSelectedDirectWeighProduct(product || null);
                        setDirectWeightInput(''); 
                        if (product) directWeightInputRef.current?.focus();
                      }}
                      dir="rtl"
                    >
                      <SelectTrigger id="direct-weigh-product-select" className="mt-0.5 bg-input/50 focus:bg-input h-9 text-xs">
                        <SelectValue placeholder={isLoadingProducts ? "جاري التحميل..." : weighableProductsForSelect.length > 0 ? "اختر منتجًا للوزن..." : "لا توجد منتجات موزونة"} />
                      </SelectTrigger>
                      <SelectContent>
                        {weighableProductsForSelect.length > 0 ? weighableProductsForSelect.map(p => (
                          <SelectItem key={p.id} value={p.id} className="text-xs">{p.name} ({p.pricePerUnit.toFixed(2)} ل.س/{p.unit}) (المخزون: {p.stock} {p.unit})</SelectItem>
                        )) : <SelectItem value="no-weighable-products" disabled className="text-xs">لا توجد منتجات موزونة متاحة</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="direct-weight-input" className="text-xs">الوزن ({selectedDirectWeighProduct?.unit || 'الوحدة'})</Label>
                    <Input
                      ref={directWeightInputRef}
                      id="direct-weight-input"
                      type="number"
                      value={directWeightInput}
                      onChange={(e) => setDirectWeightInput(e.target.value)}
                      placeholder="مثال: 0.250"
                      className="mt-0.5 bg-input/50 focus:bg-input h-9 text-xs"
                      step="0.001"
                      min="0.001"
                      disabled={!selectedDirectWeighProduct || selectedDirectWeighProduct.stock <= 0}
                    />
                     {selectedDirectWeighProduct && selectedDirectWeighProduct.stock <=0 && <p className="text-xs text-destructive mt-0.5">هذا المنتج نفذ من المخزون.</p>}
                  </div>
                  <Button
                    type="submit"
                    disabled={!selectedDirectWeighProduct || !directWeightInput || parseFloat(directWeightInput) <= 0 || selectedDirectWeighProduct.stock <=0 || isLoadingProducts}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-9 text-xs"
                  >
                    <Plus className="ml-1.5 h-3.5 w-3.5" /> إضافة المنتج الموزون
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="font-headline text-md text-foreground">قائمة المنتجات (إضافة سريعة)</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-2 overflow-hidden">
              <ScrollArea className="h-full pr-2">
                {isLoadingProducts && availableProducts.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <PackageSearch className="h-12 w-12 text-muted-foreground/30 animate-pulse" />
                    </div>
                ) : filteredProductsForQuickAdd.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {filteredProductsForQuickAdd.slice(0, 12).map(product => (
                      <Button 
                        key={product.id} 
                        variant="outline" 
                        className="h-auto p-1.5 flex flex-col items-center justify-center text-center whitespace-normal break-words min-h-[75px] relative text-xs leading-tight"
                        onClick={() => handleProductSelection(product)}
                        disabled={product.stock <= 0 && !isProductWeighable(product)}
                      >
                        {product.stock <= 0 && !isProductWeighable(product) && (
                            <Badge variant="destructive" className="absolute top-0.5 right-0.5 text-[0.6rem] px-1 py-0 leading-none">نفذ</Badge>
                        )}
                         {isProductWeighable(product) && product.stock <= 0 && (
                            <Badge variant="destructive" className="absolute top-0.5 right-0.5 text-[0.6rem] px-1 py-0 leading-none">نفذ</Badge>
                        )}
                        <Image src={product.image || `https://placehold.co/30x30.png?text=${encodeURIComponent(product.name.charAt(0))}`} alt={product.name} width={24} height={24} className="mb-0.5 rounded" data-ai-hint={product.dataAiHint || "item product"} />
                        <span className="text-[0.7rem]">{product.name}</span>
                        <span className="text-[0.7rem] font-semibold text-primary">{product.pricePerUnit.toFixed(2)} ل.س/{product.unit}</span>
                        <span className="text-[0.65rem] text-muted-foreground">(مخزون: {product.stock})</span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs text-center py-3">
                    {availableProducts.length === 0 && !isLoadingProducts ? "لا توجد منتجات متاحة." : "لا توجد منتجات تطابق البحث أو كلها في السلة." }
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:w-3/5 shadow-lg flex flex-col h-full">
          <CardHeader className="flex-shrink-0 pb-3 pt-4 px-4">
            <CardTitle className="font-headline text-xl text-foreground">البيع الحالي</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {cart.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground text-md p-4">السلة فارغة. ابدأ بإضافة المنتجات.</p>
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%] py-2 px-3 text-xs">المنتج</TableHead>
                    <TableHead className="text-center w-[30%] py-2 px-3 text-xs">الكمية/الوزن (المخزون)</TableHead>
                    <TableHead className="text-left w-[25%] py-2 px-3 text-xs">السعر الإجمالي</TableHead>
                    <TableHead className="w-[5%] py-2 px-1 text-xs"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {cart.map(item => (
                      <TableRow key={`${item.id}-${item.isWeighed}`}>
                        <TableCell className="py-2 px-3">
                          <div className="flex items-center">
                            <Image src={item.image || `https://placehold.co/28x28.png?text=${encodeURIComponent(item.name.charAt(0))}`} alt={item.name} width={28} height={28} className="ml-2 rounded object-cover" data-ai-hint={item.dataAiHint || "item product"}/>
                            <div>
                              <p className="font-medium text-foreground text-sm leading-tight">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.pricePerUnit.toFixed(2)} ل.س/{item.unit}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2 px-3">
                          {item.isWeighed ? (
                            <div className="flex items-center justify-center gap-1">
                                <span className="font-medium text-sm">{item.itemQuantityInCart.toFixed(3)} {item.unit}</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleProductSelection(item)}>
                                    <Edit3 className="h-3 w-3 text-primary" />
                                </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-0.5">
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => updateCartItemQuantity(item.id, item.itemQuantityInCart - 1)}>
                                <Minus className="h-2.5 w-2.5" />
                              </Button>
                              <Input type="number" value={item.itemQuantityInCart} 
                                onChange={(e) => updateCartItemQuantity(item.id, e.target.value)} 
                                onBlur={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (isNaN(val) || val < 1) updateCartItemQuantity(item.id, 1);
                                    else if (val > item.stock) updateCartItemQuantity(item.id, item.stock);
                                    else updateCartItemQuantity(item.id, val);
                                }}
                                className="w-10 h-7 text-center text-xs p-0.5 bg-input/30 focus:bg-input"
                                min="1"
                                max={item.stock}
                              />
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => updateCartItemQuantity(item.id, item.itemQuantityInCart + 1)}>
                                <Plus className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          )}
                           <span className="text-[0.7rem] text-muted-foreground block mt-0.5">(مخزون: {item.stock} {item.unit})</span>
                        </TableCell>
                        <TableCell className="text-left font-semibold text-foreground text-sm py-2 px-3">
                          {item.totalItemPrice.toFixed(2)} ل.س
                        </TableCell>
                        <TableCell className="py-2 px-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={() => removeFromCart(item.id, item.isWeighed)}>
                            <Trash2 className="h-3.5 w-3.5" />
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
          <CardFooter className="flex-shrink-0 p-3 md:p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">المجموع الفرعي:</span>
              <span className="font-semibold text-foreground">{subTotal.toFixed(2)} ل.س</span>
            </div>

            {discountAmount > 0 && (
               <div className="flex justify-between items-center text-sm text-destructive">
                <span className="flex items-center"><MinusCircle className="ml-1 h-3.5 w-3.5"/>الخصم المطبق:</span>
                <span className="font-semibold">-{discountAmount.toFixed(2)} ل.س</span>
              </div>
            )}
            
            <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
              <span className="text-muted-foreground">الإجمالي النهائي:</span>
              <span className="font-headline text-primary">{cartTotal.toFixed(2)} ل.س</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                    variant="outline" 
                    className="flex-1 text-xs h-9" 
                    onClick={() => { setDiscountInput(discountAmount > 0 ? discountAmount.toString() : ''); setIsDiscountModalOpen(true);}}
                >
                    <Percent className="ml-1.5 h-3.5 w-3.5"/> {discountAmount > 0 ? 'تعديل الخصم' : 'إضافة خصم على الإجمالي'}
                </Button>
                 {/* زر الكوبون تم إلغاؤه بناءً على الطلب 
                 <Button variant="outline" className="flex-1 text-xs h-9" disabled>
                    <TicketX className="ml-1.5 h-3.5 w-3.5"/> تطبيق كوبون (معطل)
                </Button>
                */}
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="text-xs py-2.5 h-auto" disabled><Landmark className="ml-1.5 h-3.5 w-3.5"/> دفع آجل (معطل)</Button>
                <Button className="w-full text-md py-2.5 h-auto bg-primary hover:bg-primary/90 text-primary-foreground col-span-2 sm:col-span-1" onClick={handleCheckout} disabled={cart.length === 0 || isLoadingProducts}>
                  {isLoadingProducts && cart.length > 0 ? (
                     <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-1.5"></div>
                  ) : (
                    <CreditCard className="ml-1.5 h-4 w-4" />
                  )}
                  {isLoadingProducts && cart.length > 0 ? 'جاري المعالجة...' : 'الدفع الآن'}
                </Button>
            </div>
             <p className="text-[0.7rem] text-muted-foreground text-center">
                الضغط على "الدفع الآن" سيقوم بحفظ الفاتورة وتحديث المخزون. 
                {/* وظيفة الطباعة تتطلب تكاملاً إضافياً. */}
             </p>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isWeightModalOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
            setProductToWeigh(null);
            setWeightInputValue('');
        }
        setIsWeightModalOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-xs bg-card">
            <DialogHeader>
                <DialogTitle className="font-headline text-xl text-foreground">إدخال وزن المنتج</DialogTitle>
            </DialogHeader>
            {productToWeigh && (
              <form onSubmit={(e) => {e.preventDefault(); handleAddOrUpdateWeighedProduct();}}>
                <div className="space-y-3 py-2.5">
                    <div className="flex items-center gap-2.5 p-2.5 bg-muted/50 rounded-md">
                        <Image src={productToWeigh.image || `https://placehold.co/36x36.png?text=${encodeURIComponent(productToWeigh.name.charAt(0))}`} alt={productToWeigh.name} width={36} height={36} className="rounded" data-ai-hint={productToWeigh.dataAiHint || "item product"}/>
                        <div>
                            <p className="font-medium text-md">{productToWeigh.name}</p>
                            <p className="text-xs text-muted-foreground">{productToWeigh.pricePerUnit.toFixed(2)} ل.س / {productToWeigh.unit}</p>
                            <p className="text-[0.7rem] text-muted-foreground">المخزون: {productToWeigh.stock} {productToWeigh.unit}</p>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="weight-input-modal" className="text-xs text-muted-foreground">الوزن المطلوب ({productToWeigh.unit})</Label>
                        <Input 
                            id="weight-input-modal"
                            type="number"
                            value={weightInputValue}
                            onChange={(e) => setWeightInputValue(e.target.value)}
                            placeholder={`مثال: 0.250`}
                            className="mt-0.5 bg-input/50 focus:bg-input text-md h-9"
                            step="0.001"
                            min="0.001"
                            max={productToWeigh.stock}
                            autoFocus
                        />
                    </div>
                    {parseFloat(weightInputValue) > 0 && productToWeigh && (
                         <div className="p-2 bg-primary/10 rounded-md text-center">
                            <p className="text-xs text-muted-foreground">السعر المحسوب</p>
                            <p className="text-xl font-semibold text-primary">
                                { (productToWeigh.pricePerUnit * Math.min(parseFloat(weightInputValue), productToWeigh.stock)).toFixed(2) } ل.س
                            </p>
                        </div>
                    )}
                </div>
                <DialogFooter className="mt-2 pt-3 border-t">
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm" disabled={!productToWeigh || !weightInputValue || parseFloat(weightInputValue) <= 0 || isLoadingProducts}>
                        {cart.find(item => item.id === productToWeigh?.id && item.isWeighed) ? 'تحديث الوزن' : 'إضافة للسلة'}
                    </Button>
                    <DialogClose asChild>
                        <Button type="button" variant="outline" className="h-9 text-sm">إلغاء</Button>
                    </DialogClose>
                </DialogFooter>
              </form>
            )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDiscountModalOpen} onOpenChange={setIsDiscountModalOpen}>
        <DialogContent className="sm:max-w-xs bg-card">
            <DialogHeader>
                <DialogTitle className="font-headline text-xl text-foreground">تطبيق خصم على الإجمالي</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {e.preventDefault(); handleApplyDiscount();}}>
            <div className="space-y-3 py-2.5">
                <div>
                    <Label htmlFor="discount-input-modal" className="text-xs text-muted-foreground">مبلغ الخصم (ل.س)</Label>
                    <Input 
                        id="discount-input-modal"
                        type="number"
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value)}
                        placeholder="أدخل مبلغ الخصم"
                        className="mt-0.5 bg-input/50 focus:bg-input text-md h-9"
                        step="0.01"
                        min="0"
                        autoFocus
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    سيتم خصم هذا المبلغ من الإجمالي الفرعي للفاتورة: {subTotal.toFixed(2)} ل.س
                </p>
            </div>
            <DialogFooter className="mt-2 pt-3 border-t">
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground h-9 text-sm">تطبيق الخصم</Button>
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="h-9 text-sm">إلغاء</Button>
                </DialogClose>
            </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

    </AppLayout>
  );
};

export default PosPage;
    

    