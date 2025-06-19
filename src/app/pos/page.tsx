
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
import { QrCode, Search, Plus, Minus, Trash2, CreditCard, Tag, Percent, Landmark, Edit3, PackageSearch } from 'lucide-react';
import type { Product as BaseProduct } from '@/components/products/ProductTable'; 
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

interface Product extends BaseProduct {
  pricePerUnit: number; // This will be product.salePrice
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
  const [calculatedPriceForWeight, setCalculatedPriceForWeight] = useState(0);

  const [selectedDirectWeighProduct, setSelectedDirectWeighProduct] = useState<Product | null>(null);
  const [directWeightInput, setDirectWeightInput] = useState('');

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
    availableProducts.filter(p => isProductWeighable(p) && p.stock > 0), // Only show weighable products with stock
    [availableProducts]
  );

  const filteredProductsForQuickAdd = useMemo(() => 
    availableProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!isProductWeighable(p) || !cart.find(item => item.id === p.id && item.isWeighed)) 
    ),
    [searchTerm, cart, availableProducts] 
  );

  const handleProductSelection = useCallback((product: Product) => {
    if (product.stock === 0 && !isProductWeighable(product)) { 
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
        if (product.stock < 1) { // Check stock before adding new non-weighed item
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
        // For weighed items, stock check against available weight can be complex if unit is 'gram' and stock is in 'kg'.
        // Assuming stock is in the same primary unit as pricePerUnit (e.g., kg).
        if (weight > productToWeigh.stock) {
            setCalculatedPriceForWeight(productToWeigh.pricePerUnit * productToWeigh.stock);
            toast({title: "تنبيه المخزون", description: `الكمية المتوفرة من ${productToWeigh.name} هي ${productToWeigh.stock} ${productToWeigh.unit}. تم تعديل الوزن.`, variant: "destructive"})
            setWeightInputValue(String(productToWeigh.stock)); // Adjust input to max available
        } else {
            setCalculatedPriceForWeight(productToWeigh.pricePerUnit * weight);
        }
      } else {
        setCalculatedPriceForWeight(0);
      }
    } else {
      setCalculatedPriceForWeight(0);
    }
  }, [productToWeigh, weightInputValue, toast]);

  const handleAddOrUpdateWeighedProduct = () => {
    if (!productToWeigh || !weightInputValue) return;
    let weight = parseFloat(weightInputValue);

    if (isNaN(weight) || weight <= 0) {
      toast({ title: "خطأ في الإدخال", description: "يرجى إدخال وزن صحيح للمنتج.", variant: "destructive" });
      return;
    }
    if (weight > productToWeigh.stock) {
        toast({ title: "تنبيه المخزون", description: `الكمية المتوفرة من ${productToWeigh.name} هي ${productToWeigh.stock} ${productToWeigh.unit}. سيتم إضافة الكمية المتوفرة فقط.`, variant: "destructive"});
        weight = productToWeigh.stock; // Cap weight at available stock
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
      toast({ title: "تم تحديث المنتج", description: `تم تحديث وزن ${productToWeigh.name} إلى ${weight.toFixed(3)} ${productToWeigh.unit}.` });
    } else {
      setCart([...cart, {
        ...productToWeigh,
        itemQuantityInCart: weight,
        totalItemPrice: productToWeigh.pricePerUnit * weight,
        isWeighed: true,
      }]);
      toast({ title: "تمت إضافة المنتج", description: `${productToWeigh.name} (${weight.toFixed(3)} ${productToWeigh.unit}) أضيف إلى السلة.` });
    }
    setIsWeightModalOpen(false);
    setProductToWeigh(null);
    setWeightInputValue('');
  };

  const handleDirectAddWeighedProduct = () => {
    if (!selectedDirectWeighProduct || !directWeightInput) return;
    let weight = parseFloat(directWeightInput);
  
    if (isNaN(weight) || weight <= 0) {
      toast({ title: "خطأ في الإدخال", description: "يرجى إدخال وزن صحيح للمنتج.", variant: "destructive" });
      return;
    }
    if (selectedDirectWeighProduct.stock <= 0) {
         toast({ title: "نفذ المخزون", description: `عفواً، ${selectedDirectWeighProduct.name} غير متوفر حالياً للوزن.`, variant: "destructive" });
         return;
    }
    if (weight > selectedDirectWeighProduct.stock) {
        toast({ title: "تنبيه المخزون", description: `الكمية المتوفرة من ${selectedDirectWeighProduct.name} هي ${selectedDirectWeighProduct.stock} ${selectedDirectWeighProduct.unit}. سيتم إضافة الكمية المتوفرة فقط.`, variant: "destructive"});
        weight = selectedDirectWeighProduct.stock; // Cap weight at available stock
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
      toast({ title: "تم تحديث وزن المنتج", description: `تم تحديث وزن ${selectedDirectWeighProduct.name} في السلة إلى ${weight.toFixed(3)} ${selectedDirectWeighProduct.unit}.` });
    } else {
      setCart([...cart, {
        ...selectedDirectWeighProduct,
        itemQuantityInCart: weight,
        totalItemPrice: selectedDirectWeighProduct.pricePerUnit * weight,
        isWeighed: true,
      }]);
      toast({ title: "تمت إضافة المنتج", description: `${selectedDirectWeighProduct.name} (${weight.toFixed(3)} ${selectedDirectWeighProduct.unit}) أضيف إلى السلة.` });
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

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ title: "سلة فارغة", description: "يرجى إضافة منتجات إلى السلة قبل الدفع.", variant: "destructive"});
      return;
    }
    if (!user) {
        toast({ title: "خطأ", description: "يجب تسجيل الدخول لإتمام العملية.", variant: "destructive"});
        return;
    }

    setIsLoadingProducts(true); // Indicate loading during checkout

    try {
      // 1. Insert into 'sales' table
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          total_amount: cartTotal,
          payment_method: 'Cash', // Hardcoded for now
          sale_date: new Date().toISOString(),
          user_id: user.id,
          // client_id: null, // Add client_id if client selection is implemented
        })
        .select()
        .single();

      if (saleError) throw saleError;
      if (!saleData) throw new Error("فشل في إنشاء سجل البيع.");

      const saleId = saleData.id;

      // 2. Insert into 'sale_items' table
      const saleItemsToInsert = cart.map(item => ({
        sale_id: saleId,
        product_id: item.id,
        quantity: item.itemQuantityInCart, // This is the weight for weighed items
        unit_price: item.pricePerUnit,
        total_price: item.totalItemPrice,
      }));

      const { error: saleItemsError } = await supabase.from('sale_items').insert(saleItemsToInsert);
      if (saleItemsError) throw saleItemsError;

      // 3. Update stock for each product
      for (const item of cart) {
        const { data: currentProductData, error: fetchError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.id)
          .single();

        if (fetchError || !currentProductData) {
          console.error(`Error fetching stock for product ${item.name}:`, fetchError);
          toast({ title: "خطأ جزئي في تحديث المخزون", description: `فشل في جلب المخزون الحالي لـ ${item.name}. البيع سُجل ولكن قد يكون المخزون غير دقيق.`, variant: "destructive" });
          continue; // Skip stock update for this item if fetch fails
        }
        
        const quantityToDeduct = item.itemQuantityInCart;
        const newStock = currentProductData.stock - quantityToDeduct;

        if (newStock < 0) {
            // This case should ideally be prevented by checks before/during adding to cart
            toast({ title: "خطأ حرج في المخزون", description: `نفذ مخزون ${item.name} أثناء محاولة إتمام البيع. تم بيع ${currentProductData.stock} فقط. يرجى مراجعة المخزون.`, variant: "destructive" });
            // Set stock to 0 if it would go negative.
            const { error: stockUpdateErrorNegative } = await supabase
                .from('products')
                .update({ stock: 0 }) 
                .eq('id', item.id);
            if (stockUpdateErrorNegative) {
                console.error(`Error setting stock to 0 for ${item.name}:`, stockUpdateErrorNegative);
                toast({ title: "خطأ في تحديث مخزون", description: `فشل تحديث مخزون ${item.name} إلى 0.`, variant: "destructive" });
            }
        } else {
            const { error: stockUpdateError } = await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', item.id);
            if (stockUpdateError) {
                console.error(`Error updating stock for ${item.name}:`, stockUpdateError);
                toast({ title: "خطأ في تحديث مخزون", description: `فشل تحديث مخزون ${item.name}.`, variant: "destructive" });
            }
        }
      }
      
      toast({ title: "تم الدفع بنجاح", description: `الإجمالي: ${cartTotal.toFixed(2)} ل.س. تم تحديث المخزون وتسجيل البيع.` });
      setCart([]); 
      setSelectedDirectWeighProduct(null);
      setDirectWeightInput('');
      await fetchProducts(); // Refetch products to update stock display
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({ title: "خطأ أثناء الدفع", description: error.message || "فشلت عملية الدفع أو تحديث المخزون.", variant: "destructive"});
    } finally {
        setIsLoadingProducts(false);
    }
  };

  if (isLoadingProducts && !user && cart.length === 0) { // Show loader only on initial load without user
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
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)]">
        <div className="lg:w-2/5 flex flex-col gap-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground">بحث وإضافة منتجات</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
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
              <div>
                <h3 className="text-md font-semibold mb-2 text-muted-foreground">إضافة سريعة لمنتج بالوزن:</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="direct-weigh-product-select">اختر منتجًا</Label>
                    <Select
                      value={selectedDirectWeighProduct?.id || ""}
                      onValueChange={(productId) => {
                        const product = availableProducts.find(p => p.id === productId);
                        setSelectedDirectWeighProduct(product || null);
                        setDirectWeightInput(''); // Clear weight input on product change
                      }}
                      dir="rtl"
                    >
                      <SelectTrigger id="direct-weigh-product-select" className="mt-1 bg-input/50 focus:bg-input">
                        <SelectValue placeholder={isLoadingProducts ? "جاري تحميل المنتجات..." : weighableProductsForSelect.length > 0 ? "اختر منتجًا للوزن..." : "لا توجد منتجات موزونة"} />
                      </SelectTrigger>
                      <SelectContent>
                        {weighableProductsForSelect.length > 0 ? weighableProductsForSelect.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.pricePerUnit.toFixed(2)} ل.س/{p.unit}) (المخزون: {p.stock} {p.unit})</SelectItem>
                        )) : <SelectItem value="no-weighable-products" disabled>لا توجد منتجات موزونة متاحة</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="direct-weight-input">الوزن ({selectedDirectWeighProduct?.unit || 'الوحدة'})</Label>
                    <Input
                      id="direct-weight-input"
                      type="number"
                      value={directWeightInput}
                      onChange={(e) => setDirectWeightInput(e.target.value)}
                      placeholder="مثال: 0.250"
                      className="mt-1 bg-input/50 focus:bg-input"
                      step="0.001"
                      min="0.001"
                      disabled={!selectedDirectWeighProduct || selectedDirectWeighProduct.stock <= 0}
                    />
                     <p className="text-xs text-muted-foreground mt-1">ادخل الوزن بـ {selectedDirectWeighProduct?.unit || 'الوحدة المختارة'}. مثال: 0.2 لـ 200 غرام (إذا كانت الوحدة كيلو).</p>
                     {selectedDirectWeighProduct && selectedDirectWeighProduct.stock <=0 && <p className="text-xs text-destructive mt-1">هذا المنتج نفذ من المخزون.</p>}
                  </div>
                  <Button
                    onClick={handleDirectAddWeighedProduct}
                    disabled={!selectedDirectWeighProduct || !directWeightInput || parseFloat(directWeightInput) <= 0 || selectedDirectWeighProduct.stock <=0 || isLoadingProducts}
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
                {isLoadingProducts && availableProducts.length === 0 ? ( // Show loader only if products are truly loading for the first time
                    <div className="flex justify-center items-center h-full">
                        <PackageSearch className="h-16 w-16 text-muted-foreground/30 animate-pulse" />
                    </div>
                ) : filteredProductsForQuickAdd.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredProductsForQuickAdd.slice(0, 12).map(product => (
                      <Button 
                        key={product.id} 
                        variant="outline" 
                        className="h-auto p-2 flex flex-col items-center justify-center text-center whitespace-normal break-words min-h-[90px] relative"
                        onClick={() => handleProductSelection(product)}
                        disabled={product.stock <= 0 && !isProductWeighable(product)}
                      >
                        {product.stock <= 0 && !isProductWeighable(product) && (
                            <Badge variant="destructive" className="absolute top-1 right-1 text-xs px-1 py-0.5">نفذ</Badge>
                        )}
                         {isProductWeighable(product) && product.stock <= 0 && (
                            <Badge variant="destructive" className="absolute top-1 right-1 text-xs px-1 py-0.5">نفذ</Badge>
                        )}
                        <Image src={product.image || `https://placehold.co/40x40.png?text=${encodeURIComponent(product.name.charAt(0))}`} alt={product.name} width={30} height={30} className="mb-1 rounded" data-ai-hint={product.dataAiHint || "item product"} />
                        <span className="text-xs leading-tight">{product.name}</span>
                        <span className="text-xs font-semibold text-primary">{product.pricePerUnit.toFixed(2)} ل.س/{product.unit}</span>
                        <span className="text-xs text-muted-foreground">(المخزون: {product.stock})</span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    {availableProducts.length === 0 && !isLoadingProducts ? "لا توجد منتجات متاحة حالياً." : "لا توجد منتجات تطابق البحث أو كلها في السلة." }
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

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
                            <Image src={item.image || `https://placehold.co/32x32.png?text=${encodeURIComponent(item.name.charAt(0))}`} alt={item.name} width={32} height={32} className="ml-3 rounded object-cover" data-ai-hint={item.dataAiHint || "item product"}/>
                            <div>
                              <p className="font-medium text-foreground">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.pricePerUnit.toFixed(2)} ل.س لل{item.unit}</p>
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
                                onBlur={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (isNaN(val) || val < 1) updateCartItemQuantity(item.id, 1);
                                    else if (val > item.stock) updateCartItemQuantity(item.id, item.stock);
                                    else updateCartItemQuantity(item.id, val);
                                }}
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
                          {item.totalItemPrice.toFixed(2)} ل.س
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
              <span className="font-headline text-primary">{cartTotal.toFixed(2)} ل.س</span>
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
                <Button className="w-full text-lg py-3 bg-primary hover:bg-primary/90 text-primary-foreground col-span-2 sm:col-span-1" onClick={handleCheckout} disabled={cart.length === 0 || isLoadingProducts}>
                  {isLoadingProducts && cart.length > 0 ? (
                     <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <CreditCard className="ml-2 h-5 w-5" />
                  )}
                  {isLoadingProducts && cart.length > 0 ? 'جاري المعالجة...' : 'الدفع الآن'}
                </Button>
            </div>
             <p className="text-xs text-muted-foreground text-center">طرق دفع أخرى (بطاقة، تحويل) يمكن تفعيلها من الإعدادات.</p>
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
        <DialogContent className="sm:max-w-md bg-card">
            <DialogHeader>
                <DialogTitle className="font-headline text-2xl text-foreground">إدخال وزن المنتج</DialogTitle>
            </DialogHeader>
            {productToWeigh && (
                <div className="space-y-4 py-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                        <Image src={productToWeigh.image || `https://placehold.co/40x40.png?text=${encodeURIComponent(productToWeigh.name.charAt(0))}`} alt={productToWeigh.name} width={40} height={40} className="rounded" data-ai-hint={productToWeigh.dataAiHint || "item product"}/>
                        <div>
                            <p className="font-medium text-lg">{productToWeigh.name}</p>
                            <p className="text-sm text-muted-foreground">{productToWeigh.pricePerUnit.toFixed(2)} ل.س / {productToWeigh.unit}</p>
                            <p className="text-xs text-muted-foreground">المخزون المتوفر: {productToWeigh.stock} {productToWeigh.unit}</p>
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
                            min="0.001"
                            max={productToWeigh.stock} // Set max to available stock
                        />
                    </div>
                    {parseFloat(weightInputValue) > 0 && productToWeigh && (
                         <div className="p-3 bg-primary/10 rounded-md text-center">
                            <p className="text-sm text-muted-foreground">السعر المحسوب</p>
                            <p className="text-2xl font-semibold text-primary">
                                { (productToWeigh.pricePerUnit * Math.min(parseFloat(weightInputValue), productToWeigh.stock)).toFixed(2) } ل.س
                            </p>
                        </div>
                    )}
                </div>
            )}
            <DialogFooter>
                <Button onClick={handleAddOrUpdateWeighedProduct} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!productToWeigh || !weightInputValue || parseFloat(weightInputValue) <= 0 || isLoadingProducts}>
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
    
