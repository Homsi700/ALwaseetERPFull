
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
import { QrCode, Search, Plus, Minus, Trash2, CreditCard, Percent, Landmark, Edit3, PackageSearch, MinusCircle, ShoppingBasket } from 'lucide-react';
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
  const [isProcessingCartAction, setIsProcessingCartAction] = useState(false);


  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [productToWeigh, setProductToWeigh] = useState<Product | null>(null);
  const [weightInputValue, setWeightInputValue] = useState('');
  
  const [selectedDirectWeighProduct, setSelectedDirectWeighProduct] = useState<Product | null>(null);
  const [directWeightInput, setDirectWeightInput] = useState('');
  const directWeightInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const weightInputModalRef = useRef<HTMLInputElement>(null);


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
      (!isProductWeighable(p) || !cart.find(item => item.id === p.id && item.isWeighed)) && // Exclude weighable items already weighed in cart from quick add
      p.stock > 0 
    ).slice(0,12), // Limit to 12 for better performance and UI
    [searchTerm, cart, availableProducts] 
  );

  const updateProductStockInState = (productId: string, newStock: number) => {
    setAvailableProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
  };

  const addProductToCart = useCallback(async (product: Product, quantity: number, isWeighedItem: boolean) => {
    if (isProcessingCartAction) return;
    setIsProcessingCartAction(true);

    const productInState = availableProducts.find(p => p.id === product.id);
    if (!productInState) {
        toast({ title: "خطأ", description: "المنتج غير موجود في القائمة المحلية.", variant: "destructive" });
        setIsProcessingCartAction(false);
        return;
    }
    
    const currentStock = productInState.stock;

    if (currentStock < quantity && !isWeighedItem) { // For non-weighed items, requested quantity must be available
        toast({ title: "نفذ المخزون", description: `عفواً، ${product.name} غير متوفر بالكمية المطلوبة. المتوفر: ${currentStock}`, variant: "destructive" });
        setIsProcessingCartAction(false);
        return;
    }
    if (currentStock === 0 && (isWeighedItem || !isWeighedItem)) { // No stock for any item type
        toast({ title: "نفذ المخزون", description: `عفواً، ${product.name} غير متوفر حالياً.`, variant: "destructive" });
        setIsProcessingCartAction(false);
        return;
    }
    
    // For weighable items, if requested quantity is more than stock, cap it to stock.
    let effectiveQuantity = quantity;
    if (isWeighedItem && currentStock < quantity) {
        toast({ title: "تنبيه المخزون", description: `الكمية المتوفرة من ${product.name} هي ${currentStock} ${product.unit}. سيتم إضافة الكمية المتوفرة فقط.`, variant: "destructive"});
        effectiveQuantity = currentStock;
    }


    // Attempt to update stock in Supabase FIRST
    const newStockInDB = currentStock - effectiveQuantity;
    if (newStockInDB < 0 && !isWeighedItem) { // Double check to prevent negative stock for non-weighed
        toast({ title: "خطأ في المخزون", description: `محاولة لجعل مخزون ${product.name} سالباً.`, variant: "destructive" });
        setIsProcessingCartAction(false);
        return;
    }

    const { error: stockUpdateError } = await supabase
      .from('products')
      .update({ stock: newStockInDB < 0 ? 0 : newStockInDB }) // Ensure stock doesn't go below 0
      .eq('id', product.id);

    if (stockUpdateError) {
      toast({ title: "خطأ في تحديث المخزون", description: `فشل تحديث مخزون ${product.name} في قاعدة البيانات. ${stockUpdateError.message}`, variant: "destructive" });
      setIsProcessingCartAction(false);
      return;
    }

    // If Supabase stock update is successful, update local cart and product state
    updateProductStockInState(product.id, newStockInDB < 0 ? 0 : newStockInDB);

    const existingItemIndex = cart.findIndex(item => item.id === product.id && item.isWeighed === isWeighedItem);
    
    if (existingItemIndex > -1) {
      const updatedCart = [...cart];
      const currentItem = updatedCart[existingItemIndex];
      // For weighable items, the new quantity replaces the old. For others, it adds.
      const newCartQuantity = isWeighedItem ? effectiveQuantity : currentItem.itemQuantityInCart + effectiveQuantity; 

      updatedCart[existingItemIndex] = {
        ...currentItem,
        itemQuantityInCart: newCartQuantity,
        totalItemPrice: product.pricePerUnit * newCartQuantity,
        stock: newStockInDB < 0 ? 0 : newStockInDB, // Update stock in cart item too
      };
      setCart(updatedCart);
      toast({ title: `تم تحديث ${isWeighedItem ? "وزن" : "كمية"} المنتج`, description: `تم تحديث ${product.name} في السلة.` });
    } else {
      setCart(prevCart => [...prevCart, {
        ...product,
        itemQuantityInCart: effectiveQuantity,
        totalItemPrice: product.pricePerUnit * effectiveQuantity,
        isWeighed: isWeighedItem,
        stock: newStockInDB < 0 ? 0 : newStockInDB, // Set initial stock in cart item
      }]);
      toast({ title: "تمت إضافة المنتج", description: `${product.name} أضيف إلى السلة.` });
    }
    setIsProcessingCartAction(false);
  }, [cart, toast, availableProducts, isProcessingCartAction, updateProductStockInState]);

  const handleProductSelection = useCallback((product: Product) => {
    const productInState = availableProducts.find(p => p.id === product.id);
    if (!productInState || productInState.stock <= 0) { 
        toast({ title: "نفذ المخزون", description: `عفواً، ${product.name} غير متوفر حالياً.`, variant: "destructive" });
        return;
    }

    if (isProductWeighable(productInState)) {
      setProductToWeigh(productInState);
      const existingCartItem = cart.find(item => item.id === productInState.id && item.isWeighed);
      setWeightInputValue(existingCartItem ? String(existingCartItem.itemQuantityInCart) : '');
      setIsWeightModalOpen(true);
      setTimeout(() => weightInputModalRef.current?.focus(), 0);
    } else {
      addProductToCart(productInState, 1, false);
    }
  }, [cart, toast, addProductToCart, availableProducts]);


  const handleAddOrUpdateWeighedProduct = useCallback(async () => {
    if (!productToWeigh || !weightInputValue) return;
    let weight = parseFloat(weightInputValue);

    if (isNaN(weight) || weight <= 0) {
      toast({ title: "خطأ في الإدخال", description: "يرجى إدخال وزن صحيح للمنتج.", variant: "destructive" });
      return;
    }
    
    // For weighed items, stock update logic is handled within addProductToCart
    // If it's an update, we need to revert old stock and apply new.
    // This is complex. Simpler: remove old, add new.
    const existingCartItem = cart.find(item => item.id === productToWeigh.id && item.isWeighed);
    if (existingCartItem) {
        // Revert old stock before adding new
        setIsProcessingCartAction(true);
        const { error: stockRevertError } = await supabase
            .from('products')
            .update({ stock: supabase.sql`stock + ${existingCartItem.itemQuantityInCart}` })
            .eq('id', productToWeigh.id);
        if (stockRevertError) {
            toast({ title: "خطأ في استرجاع المخزون", description: stockRevertError.message, variant: "destructive"});
            setIsProcessingCartAction(false);
            return;
        }
        updateProductStockInState(productToWeigh.id, productToWeigh.stock + existingCartItem.itemQuantityInCart);
        // Now remove old from cart to avoid duplicate logic in addProductToCart's "existingItemIndex"
        setCart(prev => prev.filter(item => !(item.id === productToWeigh.id && item.isWeighed)));
    }
    
    await addProductToCart(productToWeigh, weight, true);
    
    setIsWeightModalOpen(false);
    setProductToWeigh(null);
    setWeightInputValue('');
    barcodeInputRef.current?.focus();
  }, [productToWeigh, weightInputValue, toast, addProductToCart, cart, updateProductStockInState]);


  const handleDirectAddWeighedProduct = useCallback(async () => {
    if (!selectedDirectWeighProduct || !directWeightInput) return;
    let weight = parseFloat(directWeightInput);
  
    if (isNaN(weight) || weight <= 0) {
      toast({ title: "خطأ في الإدخال", description: "يرجى إدخال وزن صحيح للمنتج.", variant: "destructive" });
      return;
    }
    
    await addProductToCart(selectedDirectWeighProduct, weight, true);
  
    setSelectedDirectWeighProduct(null);
    setDirectWeightInput('');
    // toast({ title: "تمت إضافة المنتج الموزون", description: `${selectedDirectWeighProduct.name} (${weight.toFixed(3)} ${selectedDirectWeighProduct.unit}) أضيف إلى السلة.` });
    barcodeInputRef.current?.focus();

  }, [selectedDirectWeighProduct, directWeightInput, toast, addProductToCart]);
  
  const updateCartItemQuantity = useCallback(async (productId: string, newQuantityValue: number | string) => {
    if (isProcessingCartAction) return;
    setIsProcessingCartAction(true);

    const newQuantity = Number(newQuantityValue);
    const itemIndex = cart.findIndex(item => item.id === productId && !item.isWeighed);

    if (itemIndex === -1) {
        setIsProcessingCartAction(false);
        return;
    }

    const updatedCart = [...cart];
    const item = updatedCart[itemIndex];
    const oldCartQuantity = item.itemQuantityInCart;
    const quantityChange = newQuantity - oldCartQuantity;

    const productInState = availableProducts.find(p => p.id === productId);
    if (!productInState) {
        toast({ title: "خطأ", description: "المنتج غير موجود.", variant: "destructive"});
        setIsProcessingCartAction(false);
        return;
    }
    const currentDBStock = productInState.stock; // This stock is after initial additions

    if (newQuantity <= 0) { // Removing item by setting quantity to 0 or less
        const { error: stockUpdateError } = await supabase
            .from('products')
            .update({ stock: supabase.sql`stock + ${oldCartQuantity}`})
            .eq('id', productId);
        if (stockUpdateError) {
            toast({ title: "خطأ في تحديث المخزون", description: stockUpdateError.message, variant: "destructive" });
            setIsProcessingCartAction(false);
            return;
        }
        updateProductStockInState(productId, currentDBStock + oldCartQuantity);
        updatedCart.splice(itemIndex, 1);
        toast({ title: "تمت إزالة المنتج"});
    } else {
        let stockChangeInDB = -quantityChange; // if newQ > oldQ, change is positive, stock decreases. If newQ < oldQ, change is negative, stock increases.
        
        if (quantityChange > 0 && currentDBStock < quantityChange) { // Trying to add more than available from remaining stock
            toast({ title: "تنبيه المخزون", description: `لا يوجد ما يكفي من ${item.name}. المتاح للإضافة: ${currentDBStock}`, variant: "destructive" });
            stockChangeInDB = -currentDBStock; // only decrement what's available
            item.itemQuantityInCart = oldCartQuantity + currentDBStock;
        } else {
            item.itemQuantityInCart = newQuantity;
        }
        item.totalItemPrice = item.pricePerUnit * item.itemQuantityInCart;

        if (stockChangeInDB !== 0) {
            const { error: stockUpdateError } = await supabase
                .from('products')
                .update({ stock: supabase.sql`stock + ${stockChangeInDB}`}) // stockChangeInDB is negative for increase in cart
                .eq('id', productId);
            if (stockUpdateError) {
                toast({ title: "خطأ في تحديث المخزون", description: stockUpdateError.message, variant: "destructive" });
                setIsProcessingCartAction(false);
                return;
            }
            updateProductStockInState(productId, currentDBStock + stockChangeInDB);
        }
        updatedCart[itemIndex] = {...item, stock: currentDBStock + stockChangeInDB };
    }
    setCart(updatedCart);
    setIsProcessingCartAction(false);
  }, [cart, toast, availableProducts, isProcessingCartAction, updateProductStockInState]);

  const removeFromCart = useCallback(async (productId: string, isWeighedItem: boolean) => {
    if (isProcessingCartAction) return;
    setIsProcessingCartAction(true);

    const itemInCart = cart.find(item => item.id === productId && item.isWeighed === isWeighedItem);
    if (!itemInCart) {
        setIsProcessingCartAction(false);
        return;
    }

    // Restore stock in Supabase
    const { error: stockUpdateError } = await supabase
      .from('products')
      .update({ stock: supabase.sql`stock + ${itemInCart.itemQuantityInCart}` })
      .eq('id', productId);

    if (stockUpdateError) {
      toast({ title: "خطأ في استرجاع المخزون", description: stockUpdateError.message, variant: "destructive" });
      setIsProcessingCartAction(false);
      return;
    }

    const productInState = availableProducts.find(p => p.id === productId);
    if (productInState) {
        updateProductStockInState(productId, productInState.stock + itemInCart.itemQuantityInCart);
    }
    
    setCart(prevCart => prevCart.filter(item => !(item.id === productId && item.isWeighed === isWeighedItem) ));
    toast({ title: "تمت إزالة المنتج", description: "تمت إزالة المنتج من السلة واسترجاع المخزون." });
    setIsProcessingCartAction(false);
  }, [toast, cart, availableProducts, isProcessingCartAction, updateProductStockInState]);

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
                setTimeout(() => weightInputModalRef.current?.focus(), 0);
            }
        } else { // Non-weighable item
            await addProductToCart(product, 1, false);
        }
    } else {
      toast({ title: "لم يتم العثور على المنتج", description: `لم يتم العثور على منتج برمز الباركود: ${barcode}`, variant: "destructive" });
    }
    setSearchTerm(''); 
    barcodeInputRef.current?.select(); // Select text for easy overwrite
    barcodeInputRef.current?.focus();
  }, [availableProducts, toast, addProductToCart]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement;

      if (event.key === 'Enter') {
        if (activeEl === barcodeInputRef.current && searchTerm.trim()) {
          event.preventDefault();
          handleBarcodeScan(searchTerm);
        } else if (isWeightModalOpen && activeEl === weightInputModalRef.current && productToWeigh && weightInputValue.trim()) {
            event.preventDefault();
            handleAddOrUpdateWeighedProduct();
        } else if (activeEl === directWeightInputRef.current && selectedDirectWeighProduct && directWeightInput.trim()){
            event.preventDefault();
            handleDirectAddWeighedProduct();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchTerm, handleBarcodeScan, productToWeigh, isWeightModalOpen, weightInputValue, handleAddOrUpdateWeighedProduct, selectedDirectWeighProduct, directWeightInput, handleDirectAddWeighedProduct]);


  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ title: "سلة فارغة", description: "يرجى إضافة منتجات إلى السلة قبل الدفع.", variant: "destructive"});
      return;
    }
    if (!user) {
        toast({ title: "خطأ", description: "يجب تسجيل الدخول لإتمام العملية.", variant: "destructive"});
        return;
    }

    setIsProcessingCartAction(true); 

    try {
      // IMPORTANT: Ensure you have a `discount_amount` (NUMERIC) column in your `sales` table in Supabase if you want to store the discount.
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          total_amount: cartTotal, 
          discount_amount: discountAmount, // Store the discount amount
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

      // Stock has already been updated when items were added/modified in the cart.
      // No further stock decrement needed here.
      
      toast({ title: "تم الدفع بنجاح", description: `الإجمالي: ${cartTotal.toFixed(2)} ل.س. تم تسجيل البيع.` });
      setCart([]); 
      setSelectedDirectWeighProduct(null);
      setDirectWeightInput('');
      setDiscountAmount(0);
      setDiscountInput('');
      // await fetchProducts(); // Products are already updated locally via updateProductStockInState
      barcodeInputRef.current?.focus();
      // TODO: Implement receipt printing functionality here
    } catch (error: any) {
      console.error("خطأ أثناء الدفع:", error);
      toast({ title: "خطأ أثناء الدفع", description: error.message || "فشلت عملية الدفع أو تحديث المخزون.", variant: "destructive"});
    } finally {
        setIsProcessingCartAction(false);
    }
  };
  
  const handleApplyDiscount = () => {
    const amount = parseFloat(discountInput);
    if (isNaN(amount) || amount < 0) {
      toast({ title: "مبلغ خصم غير صالح", description: "يرجى إدخال مبلغ خصم صحيح.", variant: "destructive" });
      setDiscountAmount(0);
      setDiscountInput('');
      return;
    }
    if (amount > subTotal) {
      toast({ title: "مبلغ الخصم كبير جداً", description: "مبلغ الخصم لا يمكن أن يتجاوز المجموع الفرعي.", variant: "destructive" });
      setDiscountAmount(subTotal); 
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
        {/* Left Panel: Product Search & Quick Add */}
        <div className="lg:w-2/5 xl:w-1/3 flex flex-col gap-3">
          <Card className="shadow-md">
            <CardHeader className="pb-3 pt-4 px-3">
              <CardTitle className="font-headline text-lg text-foreground">بحث وإضافة</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-3 pb-3">
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    ref={barcodeInputRef}
                    type="text" 
                    id="quick-search-barcode"
                    placeholder="امسح باركود أو ابحث..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 bg-input/50 focus:bg-input text-sm h-9"
                    disabled={isProcessingCartAction}
                  />
                </div>
                <Button variant="outline" size="icon" className="shrink-0 h-9 w-9" onClick={() => barcodeInputRef.current?.focus()} disabled={isProcessingCartAction}>
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
              <Separator /> 
              <div>
                <h3 className="text-xs font-semibold mb-1 text-muted-foreground">إضافة سريعة لمنتج بالوزن:</h3>
                 <form onSubmit={(e) => { e.preventDefault(); handleDirectAddWeighedProduct(); }} className="space-y-1.5">
                  <div>
                    <Label htmlFor="direct-weigh-product-select" className="text-xs sr-only">اختر منتجًا</Label>
                    <Select
                      value={selectedDirectWeighProduct?.id || ""}
                      onValueChange={(productId) => {
                        const product = availableProducts.find(p => p.id === productId);
                        setSelectedDirectWeighProduct(product || null);
                        setDirectWeightInput(''); 
                        if (product) directWeightInputRef.current?.focus();
                      }}
                      dir="rtl"
                      disabled={isProcessingCartAction || isLoadingProducts}
                    >
                      <SelectTrigger id="direct-weigh-product-select" className="bg-input/50 focus:bg-input h-9 text-xs">
                        <SelectValue placeholder={isLoadingProducts ? "جاري التحميل..." : weighableProductsForSelect.length > 0 ? "اختر منتجًا للوزن..." : "لا منتجات موزونة"} />
                      </SelectTrigger>
                      <SelectContent>
                        {weighableProductsForSelect.map(p => (
                          <SelectItem key={p.id} value={p.id} className="text-xs">{p.name} ({p.pricePerUnit.toFixed(2)}/{p.unit}) (م: {p.stock})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="flex-grow">
                        <Label htmlFor="direct-weight-input" className="text-xs sr-only">الوزن ({selectedDirectWeighProduct?.unit || 'الوحدة'})</Label>
                        <Input
                        ref={directWeightInputRef}
                        id="direct-weight-input"
                        type="number"
                        value={directWeightInput}
                        onChange={(e) => setDirectWeightInput(e.target.value)}
                        placeholder={`الوزن بـ (${selectedDirectWeighProduct?.unit || 'الوحدة'})`}
                        className="bg-input/50 focus:bg-input h-9 text-xs"
                        step="0.001"
                        min="0.001"
                        disabled={!selectedDirectWeighProduct || selectedDirectWeighProduct.stock <= 0 || isProcessingCartAction}
                        />
                    </div>
                    <Button
                        type="submit"
                        size="icon"
                        className="shrink-0 h-9 w-9 bg-accent hover:bg-accent/90 text-accent-foreground"
                        disabled={!selectedDirectWeighProduct || !directWeightInput || parseFloat(directWeightInput) <= 0 || selectedDirectWeighProduct.stock <=0 || isProcessingCartAction}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                   {selectedDirectWeighProduct && selectedDirectWeighProduct.stock <=0 && <p className="text-xs text-destructive mt-0.5">هذا المنتج نفذ من المخزون.</p>}
                </form>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="font-headline text-sm text-foreground">إضافة سريعة (غير موزونة)</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-2 overflow-hidden">
              <ScrollArea className="h-full pr-1">
                {isLoadingProducts && availableProducts.length === 0 ? (
                    <div className="flex justify-center items-center h-full"> <PackageSearch className="h-10 w-10 text-muted-foreground/30 animate-pulse" /> </div>
                ) : filteredProductsForQuickAdd.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-1.5">
                    {filteredProductsForQuickAdd.map(product => (
                      <Button 
                        key={product.id} 
                        variant="outline" 
                        className="h-auto p-1 flex flex-col items-center justify-center text-center whitespace-normal break-words min-h-[60px] relative text-[0.65rem] leading-tight shadow-sm hover:shadow-md"
                        onClick={() => handleProductSelection(product)}
                        disabled={product.stock <= 0 || isProcessingCartAction}
                      >
                        {product.stock <= 0 && <Badge variant="destructive" className="absolute top-0.5 right-0.5 text-[0.5rem] px-0.5 py-0 leading-none">نفذ</Badge>}
                        <Image src={product.image || `https://placehold.co/20x20.png?text=${encodeURIComponent(product.name.charAt(0))}`} alt={product.name} width={20} height={20} className="mb-0.5 rounded" data-ai-hint={product.dataAiHint || "item product"} />
                        <span className="text-[0.65rem] leading-tight block max-h-6 overflow-hidden">{product.name}</span>
                        <span className="text-[0.6rem] font-semibold text-primary block">{product.pricePerUnit.toFixed(2)}/{product.unit}</span>
                        <span className="text-[0.55rem] text-muted-foreground block">(م: {product.stock})</span>
                      </Button>
                    ))}
                  </div>
                ) : ( <p className="text-muted-foreground text-xs text-center py-3"> {availableProducts.length === 0 && !isLoadingProducts ? "لا منتجات." : "لا منتجات تطابق البحث." } </p> )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Current Sale */}
        <Card className="lg:w-3/5 xl:w-2/3 shadow-lg flex flex-col h-full">
          <CardHeader className="flex-shrink-0 pb-2 pt-3 px-3 flex flex-row justify-between items-center">
            <CardTitle className="font-headline text-lg text-foreground flex items-center"><ShoppingBasket className="ml-2 h-5 w-5 text-primary"/>السلة الحالية</CardTitle>
            {cart.length > 0 && <Badge variant="secondary" className="text-sm">{cart.length} أصناف</Badge>}
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
                  <PackageSearch className="h-16 w-16 mb-3 text-muted-foreground/30"/>
                  <p className="text-md">السلة فارغة. ابدأ بإضافة المنتجات.</p>
                </div>
              ) : (
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%] py-1.5 px-2">المنتج</TableHead>
                    <TableHead className="text-center w-[30%] py-1.5 px-1">الكمية/الوزن (المخزون)</TableHead>
                    <TableHead className="text-left w-[25%] py-1.5 px-1">السعر الإجمالي</TableHead>
                    <TableHead className="w-[5%] py-1.5 px-1"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {cart.map(item => (
                      <TableRow key={`${item.id}-${item.isWeighed}`}>
                        <TableCell className="py-1.5 px-2 align-top">
                          <div className="flex items-start gap-1.5">
                            <Image src={item.image || `https://placehold.co/28x28.png?text=${encodeURIComponent(item.name.charAt(0))}`} alt={item.name} width={28} height={28} className="rounded object-cover mt-0.5" data-ai-hint={item.dataAiHint || "item product"}/>
                            <div>
                              <p className="font-medium text-foreground text-xs leading-tight break-words">{item.name}</p>
                              <p className="text-[0.7rem] text-muted-foreground">{item.pricePerUnit.toFixed(2)} ل.س/{item.unit}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-1.5 px-1 align-top">
                          {item.isWeighed ? (
                            <div className="flex flex-col items-center justify-center gap-0">
                                <div className="flex items-center gap-0.5">
                                    <span className="font-medium text-xs">{item.itemQuantityInCart.toFixed(3)} {item.unit}</span>
                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleProductSelection(item)} disabled={isProcessingCartAction}> <Edit3 className="h-2.5 w-2.5 text-primary" /> </Button>
                                </div>
                                <span className="text-[0.65rem] text-muted-foreground block">(م: {item.stock})</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-0">
                                <div className="flex items-center justify-center gap-0.5">
                                <Button variant="outline" size="icon" className="h-5 w-5 border-primary/50 text-primary" onClick={() => updateCartItemQuantity(item.id, item.itemQuantityInCart - 1)} disabled={isProcessingCartAction}> <Minus className="h-2 w-2" /> </Button>
                                <Input type="number" value={item.itemQuantityInCart} 
                                    onChange={(e) => updateCartItemQuantity(item.id, e.target.value)} 
                                    onBlur={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (isNaN(val) || val < 1) updateCartItemQuantity(item.id, 1);
                                        else if (val > item.stock + item.itemQuantityInCart) updateCartItemQuantity(item.id, item.stock + item.itemQuantityInCart); // Check against original stock before this item was added
                                        else updateCartItemQuantity(item.id, val);
                                    }}
                                    className="w-8 h-6 text-center text-[0.7rem] p-0.5 bg-input/30 focus:bg-input"
                                    min="1" max={item.stock + item.itemQuantityInCart} // Max is current stock in DB + what's in cart
                                    disabled={isProcessingCartAction}
                                />
                                <Button variant="outline" size="icon" className="h-5 w-5 border-primary/50 text-primary" onClick={() => updateCartItemQuantity(item.id, item.itemQuantityInCart + 1)} disabled={isProcessingCartAction}> <Plus className="h-2 w-2" /> </Button>
                                </div>
                                <span className="text-[0.65rem] text-muted-foreground block">(م: {item.stock})</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-left font-semibold text-foreground text-xs py-1.5 px-1 align-top">
                          {item.totalItemPrice.toFixed(2)} ل.س
                        </TableCell>
                        <TableCell className="py-1.5 px-1 align-top">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/80" onClick={() => removeFromCart(item.id, item.isWeighed)} disabled={isProcessingCartAction}> <Trash2 className="h-3 w-3" /> </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              )}
            </ScrollArea>
          </CardContent>
          <Separator className="my-0" />
          <CardFooter className="flex-shrink-0 p-2.5 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">المجموع الفرعي:</span>
              <span className="font-semibold text-foreground">{subTotal.toFixed(2)} ل.س</span>
            </div>

            {discountAmount > 0 && (
               <div className="flex justify-between items-center text-xs text-destructive">
                <span className="flex items-center"><MinusCircle className="ml-1 h-3 w-3"/>الخصم:</span>
                <span className="font-semibold">-{discountAmount.toFixed(2)} ل.س</span>
              </div>
            )}
            
            <div className="flex justify-between items-center text-md font-semibold border-t pt-1.5">
              <span className="text-muted-foreground">الإجمالي:</span>
              <span className="font-headline text-lg text-primary">{cartTotal.toFixed(2)} ل.س</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-1.5 mt-1">
                <Button 
                    variant="outline" 
                    className="flex-1 text-xs h-8" 
                    onClick={() => { setDiscountInput(discountAmount > 0 ? discountAmount.toString() : ''); setIsDiscountModalOpen(true);}}
                    disabled={isProcessingCartAction || cart.length === 0}
                >
                    <Percent className="ml-1 h-3 w-3"/> {discountAmount > 0 ? 'تعديل الخصم' : 'إضافة خصم'}
                </Button>
                 <Button variant="outline" className="text-xs py-2 h-8 flex-1" disabled={true || isProcessingCartAction}>
                    <Landmark className="ml-1 h-3 w-3"/> دفع آجل (معطل)
                </Button>
            </div>
            <Button className="w-full text-sm py-2 h-auto bg-primary hover:bg-primary/90 text-primary-foreground mt-1" onClick={handleCheckout} disabled={cart.length === 0 || isProcessingCartAction || isLoadingProducts}>
              {isProcessingCartAction && cart.length > 0 ? (
                 <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-1.5"></div>
              ) : (
                <CreditCard className="ml-1.5 h-3.5 w-3.5" />
              )}
              {isProcessingCartAction && cart.length > 0 ? 'جاري المعالجة...' : 'الدفع الآن (حفظ الفاتورة)'}
            </Button>
             <p className="text-[0.65rem] text-muted-foreground text-center pt-1">
                الضغط على "الدفع الآن" سيقوم بحفظ الفاتورة. الطباعة ميزة منفصلة.
             </p>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isWeightModalOpen} onOpenChange={(isOpen) => {
        if (!isOpen) { setProductToWeigh(null); setWeightInputValue(''); }
        setIsWeightModalOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-xs bg-card">
            <DialogHeader> <DialogTitle className="font-headline text-lg text-foreground">إدخال وزن المنتج</DialogTitle> </DialogHeader>
            {productToWeigh && (
              <form onSubmit={(e) => {e.preventDefault(); handleAddOrUpdateWeighedProduct();}}>
                <div className="space-y-2 py-2">
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                        <Image src={productToWeigh.image || `https://placehold.co/32x32.png?text=${encodeURIComponent(productToWeigh.name.charAt(0))}`} alt={productToWeigh.name} width={32} height={32} className="rounded" data-ai-hint={productToWeigh.dataAiHint || "item product"}/>
                        <div>
                            <p className="font-medium text-sm">{productToWeigh.name}</p>
                            <p className="text-xs text-muted-foreground">{productToWeigh.pricePerUnit.toFixed(2)} ل.س / {productToWeigh.unit}</p>
                            <p className="text-[0.7rem] text-muted-foreground">المخزون: {productToWeigh.stock} {productToWeigh.unit}</p>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="weight-input-modal" className="text-xs text-muted-foreground">الوزن المطلوب ({productToWeigh.unit})</Label>
                        <Input 
                            ref={weightInputModalRef}
                            id="weight-input-modal"
                            type="number"
                            value={weightInputValue}
                            onChange={(e) => setWeightInputValue(e.target.value)}
                            placeholder={`مثال: 0.250`}
                            className="mt-0.5 bg-input/50 focus:bg-input text-sm h-9"
                            step="0.001" min="0.001" max={productToWeigh.stock}
                            autoFocus
                        />
                    </div>
                    {parseFloat(weightInputValue) > 0 && productToWeigh && (
                         <div className="p-1.5 bg-primary/10 rounded-md text-center mt-1">
                            <p className="text-[0.7rem] text-muted-foreground">السعر المحسوب</p>
                            <p className="text-md font-semibold text-primary">
                                { (productToWeigh.pricePerUnit * Math.min(parseFloat(weightInputValue), productToWeigh.stock)).toFixed(2) } ل.س
                            </p>
                        </div>
                    )}
                </div>
                <DialogFooter className="mt-2 pt-2 border-t">
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm" disabled={!productToWeigh || !weightInputValue || parseFloat(weightInputValue) <= 0 || isProcessingCartAction || productToWeigh.stock < parseFloat(weightInputValue)}>
                        {cart.find(item => item.id === productToWeigh?.id && item.isWeighed) ? 'تحديث الوزن' : 'إضافة للسلة'}
                    </Button>
                    <DialogClose asChild> <Button type="button" variant="outline" className="h-9 text-sm">إلغاء</Button> </DialogClose>
                </DialogFooter>
              </form>
            )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDiscountModalOpen} onOpenChange={setIsDiscountModalOpen}>
        <DialogContent className="sm:max-w-xs bg-card">
            <DialogHeader> <DialogTitle className="font-headline text-lg text-foreground">تطبيق خصم</DialogTitle> </DialogHeader>
            <form onSubmit={(e) => {e.preventDefault(); handleApplyDiscount();}}>
            <div className="space-y-2 py-2">
                <div>
                    <Label htmlFor="discount-input-modal" className="text-xs text-muted-foreground">مبلغ الخصم (ل.س)</Label>
                    <Input 
                        id="discount-input-modal" type="number" value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value)}
                        placeholder="أدخل مبلغ الخصم"
                        className="mt-0.5 bg-input/50 focus:bg-input text-sm h-9"
                        step="0.01" min="0" autoFocus
                    />
                </div>
                <p className="text-xs text-muted-foreground"> سيتم خصم هذا المبلغ من الإجمالي الفرعي: {subTotal.toFixed(2)} ل.س </p>
            </div>
            <DialogFooter className="mt-2 pt-2 border-t">
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground h-9 text-sm">تطبيق الخصم</Button>
                <DialogClose asChild> <Button type="button" variant="outline" className="h-9 text-sm">إلغاء</Button> </DialogClose>
            </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

    </AppLayout>
  );
};

export default PosPage;
    

    
