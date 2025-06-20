
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { QrCode, Search, Plus, Minus, Trash2, CreditCard, Percent, Edit3, PackageSearch, MinusCircle, ShoppingBasket, CheckCircle, XCircle, Handshake } from 'lucide-react';
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

interface Partner {
  partner_id: string;
  partner_name: string;
  profit_share_percentage: number;
}

const PosPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [availablePartners, setAvailablePartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | undefined>(undefined);

  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
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

  const fetchPartners = useCallback(async () => {
    if(!user) return;
    setIsLoadingPartners(true);
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('partner_id, partner_name, profit_share_percentage')
        .order('partner_name', { ascending: true });
      if (error) throw error;
      setAvailablePartners(data || []);
    } catch (error: any) {
      toast({ title: 'خطأ في جلب الشركاء', description: error.message, variant: 'destructive'});
    } finally {
      setIsLoadingPartners(false);
    }
  }, [toast, user]);


  useEffect(() => {
    fetchProducts();
    fetchPartners();
    barcodeInputRef.current?.focus(); // Initial focus
  }, [fetchProducts, fetchPartners]);

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
      p.stock > 0 
    ).slice(0,12), 
    [searchTerm, cart, availableProducts] 
  );

  const updateProductState = (productId: string, newStock: number) => {
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
    
    let currentStockInDB = productInState.stock;
    let effectiveQuantity = quantity;

    if (isWeighedItem) { 
        if (currentStockInDB < quantity) {
            toast({ title: "تنبيه المخزون", description: `الكمية المتوفرة من ${product.name} هي ${currentStockInDB} ${product.unit}. سيتم إضافة الكمية المتوفرة فقط.`, variant: "destructive"});
            effectiveQuantity = currentStockInDB;
        }
    } else { 
        const existingCartItem = cart.find(item => item.id === product.id && !item.isWeighed);
        const quantityAlreadyInCart = existingCartItem ? existingCartItem.itemQuantityInCart : 0;

        if (currentStockInDB < (quantityAlreadyInCart + effectiveQuantity)) {
             toast({ title: "نفذ المخزون", description: `عفواً، ${product.name} غير متوفر بالكمية المطلوبة. المتوفر بالإضافة لما في السلة: ${Math.max(0, currentStockInDB - quantityAlreadyInCart)}`, variant: "destructive" });
            setIsProcessingCartAction(false);
            return;
        }
    }

    if (effectiveQuantity <= 0) {
        if (currentStockInDB <= 0 && isWeighedItem) toast({ title: "نفذ المخزون بالكامل", description: `عفواً، ${product.name} غير متوفر حالياً.`, variant: "destructive" });
        setIsProcessingCartAction(false);
        return;
    }

    const newStockInDB = currentStockInDB - effectiveQuantity;
    const { error: stockUpdateError } = await supabase
      .from('products')
      .update({ stock: newStockInDB < 0 ? 0 : newStockInDB }) 
      .eq('id', product.id)
      .gte('stock', effectiveQuantity); 

    if (stockUpdateError) {
      toast({ title: "خطأ في تحديث المخزون", description: `فشل تحديث مخزون ${product.name}. قد يكون المخزون غير كافٍ أو خطأ في الاتصال. ${stockUpdateError.message}`, variant: "destructive" });
      setIsProcessingCartAction(false);
      await fetchProducts(); 
      return;
    }

    updateProductState(product.id, newStockInDB < 0 ? 0 : newStockInDB);
    
    const existingItemIndex = cart.findIndex(item => item.id === product.id && item.isWeighed === isWeighedItem);
    if (existingItemIndex > -1) {
      const updatedCart = [...cart];
      const currentItem = updatedCart[existingItemIndex];
      const newCartQuantity = isWeighedItem ? effectiveQuantity : currentItem.itemQuantityInCart + effectiveQuantity; 
      
      updatedCart[existingItemIndex] = {
        ...currentItem,
        itemQuantityInCart: newCartQuantity,
        totalItemPrice: product.pricePerUnit * newCartQuantity,
        stock: newStockInDB < 0 ? 0 : newStockInDB, 
      };
      setCart(updatedCart);
      toast({ title: `تم تحديث ${isWeighedItem ? "وزن" : "كمية"} المنتج`, description: `${product.name} في السلة.` });
    } else {
      setCart(prevCart => [...prevCart, {
        ...product,
        itemQuantityInCart: effectiveQuantity,
        totalItemPrice: product.pricePerUnit * effectiveQuantity,
        isWeighed: isWeighedItem,
        stock: newStockInDB < 0 ? 0 : newStockInDB, 
      }]);
      toast({ title: "تمت إضافة المنتج", description: `${product.name} أضيف إلى السلة.` });
    }

    setIsProcessingCartAction(false);
  }, [cart, toast, availableProducts, isProcessingCartAction, fetchProducts]);

  const handleProductSelection = useCallback(async (product: Product) => {
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
      await addProductToCart(productInState, 1, false);
      // Focus barcode input after adding non-weighable product via button
      setTimeout(() => {
         barcodeInputRef.current?.focus();
      }, 0);
    }
  }, [cart, toast, addProductToCart, availableProducts]);

  const handleAddOrUpdateWeighedProduct = useCallback(async () => {
    if (!productToWeigh || !weightInputValue || isProcessingCartAction) return;
    
    let weight = parseFloat(weightInputValue);
    if (isNaN(weight) || weight <= 0) {
      toast({ title: "خطأ في الإدخال", description: "يرجى إدخال وزن صحيح للمنتج.", variant: "destructive" });
      return;
    }
    
    setIsProcessingCartAction(true);
    const existingCartItem = cart.find(item => item.id === productToWeigh.id && item.isWeighed);
    const productInDb = availableProducts.find(p => p.id === productToWeigh.id);

    if (!productInDb) {
        toast({ title: "خطأ", description: "المنتج غير موجود.", variant: "destructive"});
        setIsProcessingCartAction(false);
        return;
    }
    
    if (existingCartItem) { 
        const stockToRestore = existingCartItem.itemQuantityInCart;
        const { error: stockRevertError } = await supabase
            .from('products')
            .update({ stock: supabase.sql`stock + ${stockToRestore}` })
            .eq('id', productToWeigh.id);
        
        if (stockRevertError) {
            toast({ title: "خطأ في استرجاع المخزون", description: stockRevertError.message, variant: "destructive"});
            setIsProcessingCartAction(false);
            return;
        }
        updateProductState(productToWeigh.id, productInDb.stock + stockToRestore); 
        setCart(prev => prev.filter(item => !(item.id === productToWeigh.id && item.isWeighed))); 
    }
    
    const freshProductData = availableProducts.find(p => p.id === productToWeigh.id); 
    if (freshProductData) {
        await addProductToCart(freshProductData, weight, true); 
    } else {
        toast({ title: "خطأ", description: "لم يتم العثور على المنتج لتحديث وزنه.", variant: "destructive"});
    }
    
    setIsWeightModalOpen(false);
    setProductToWeigh(null);
    setWeightInputValue('');
    setIsProcessingCartAction(false);
    setTimeout(() => {
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
    }, 0);
  }, [productToWeigh, weightInputValue, toast, addProductToCart, cart, availableProducts, isProcessingCartAction]);

  const handleDirectAddWeighedProduct = useCallback(async () => {
    if (!selectedDirectWeighProduct || !directWeightInput || isProcessingCartAction) return;
    let weight = parseFloat(directWeightInput);
  
    if (isNaN(weight) || weight <= 0) {
      toast({ title: "خطأ في الإدخال", description: "يرجى إدخال وزن صحيح للمنتج.", variant: "destructive" });
      return;
    }
    
    await addProductToCart(selectedDirectWeighProduct, weight, true);
  
    setSelectedDirectWeighProduct(null);
    setDirectWeightInput('');
    barcodeInputRef.current?.focus();
    barcodeInputRef.current?.select();
  }, [selectedDirectWeighProduct, directWeightInput, toast, addProductToCart, isProcessingCartAction]);
  
  const updateCartItemQuantity = useCallback(async (productId: string, newQuantityValue: number | string) => {
    if (isProcessingCartAction) return;
    setIsProcessingCartAction(true);

    let newQuantity = Number(newQuantityValue);
    const itemIndex = cart.findIndex(item => item.id === productId && !item.isWeighed);

    if (itemIndex === -1) {
        setIsProcessingCartAction(false);
        return;
    }

    const updatedCart = [...cart];
    const item = updatedCart[itemIndex];
    const oldCartQuantity = item.itemQuantityInCart;
    
    if (newQuantity <= 0) { 
        const { error: stockUpdateError } = await supabase
            .from('products')
            .update({ stock: supabase.sql`stock + ${oldCartQuantity}`}) 
            .eq('id', productId);
        if (stockUpdateError) {
            toast({ title: "خطأ في تحديث المخزون", description: stockUpdateError.message, variant: "destructive" });
            setIsProcessingCartAction(false);
            return;
        }
        const productInState = availableProducts.find(p => p.id === productId);
        if (productInState) updateProductState(productId, productInState.stock + oldCartQuantity);
        
        updatedCart.splice(itemIndex, 1);
        setCart(updatedCart);
        toast({ title: "تمت إزالة المنتج"});
    } else { 
        const quantityChange = newQuantity - oldCartQuantity; 
        const productInState = availableProducts.find(p => p.id === productId);

        if (!productInState) {
            toast({ title: "خطأ", description: "المنتج غير موجود.", variant: "destructive"});
            setIsProcessingCartAction(false);
            return;
        }
        const currentDBStock = productInState.stock; 

        if (quantityChange > 0 && currentDBStock < quantityChange) { 
            toast({ title: "تنبيه المخزون", description: `لا يوجد ما يكفي من ${item.name}. المتاح للإضافة: ${currentDBStock}`, variant: "destructive" });
            newQuantity = oldCartQuantity + currentDBStock; 
            const stockChangeInDBForSupabase = -currentDBStock; 

            const { error: stockUpdateError } = await supabase
                .from('products')
                .update({ stock: supabase.sql`stock + ${stockChangeInDBForSupabase}`})
                .eq('id', productId);
            if (stockUpdateError) { toast({ title: "خطأ تحديث المخزون", description: stockUpdateError.message, variant: "destructive" }); }
            else updateProductState(productId, productInState.stock + stockChangeInDBForSupabase);

        } else { 
            const stockChangeInDBForSupabase = -quantityChange; 
             const { error: stockUpdateError } = await supabase
                .from('products')
                .update({ stock: supabase.sql`stock + ${stockChangeInDBForSupabase}`})
                .eq('id', productId);
            if (stockUpdateError) {
                toast({ title: "خطأ في تحديث المخزون", description: stockUpdateError.message, variant: "destructive" });
                setIsProcessingCartAction(false);
                return;
            }
            updateProductState(productId, productInState.stock + stockChangeInDBForSupabase);
        }
        
        item.itemQuantityInCart = newQuantity;
        item.totalItemPrice = item.pricePerUnit * item.itemQuantityInCart;
        updatedCart[itemIndex] = {...item, stock: availableProducts.find(p => p.id === productId)?.stock || 0 }; 
        setCart(updatedCart);
        toast({ title: "تم تحديث الكمية", description: `تم تحديث كمية ${item.name} في السلة.`});
    }
    setIsProcessingCartAction(false);
  }, [cart, toast, availableProducts, isProcessingCartAction]);

  const removeFromCart = useCallback(async (productId: string, isWeighedItem: boolean) => {
    if (isProcessingCartAction) return;
    setIsProcessingCartAction(true);

    const itemInCart = cart.find(item => item.id === productId && item.isWeighed === isWeighedItem);
    if (!itemInCart) {
        setIsProcessingCartAction(false);
        return;
    }
    const productInState = availableProducts.find(p => p.id === productId);
    if (!productInState) {
         toast({ title: "خطأ", description: "المنتج المراد إزالته غير موجود في القائمة.", variant: "destructive"});
        setIsProcessingCartAction(false);
        return;
    }

    
    const { error: stockUpdateError } = await supabase
      .from('products')
      .update({ stock: supabase.sql`stock + ${itemInCart.itemQuantityInCart}` })
      .eq('id', productId);

    if (stockUpdateError) {
      toast({ title: "خطأ في استرجاع المخزون", description: stockUpdateError.message, variant: "destructive" });
      setIsProcessingCartAction(false);
      return;
    }
    
    updateProductState(productId, productInState.stock + itemInCart.itemQuantityInCart); 
    setCart(prevCart => prevCart.filter(item => !(item.id === productId && item.isWeighed === isWeighedItem) ));
    toast({ title: "تمت إزالة المنتج", description: "تمت إزالة المنتج من السلة واسترجاع المخزون." });
    setIsProcessingCartAction(false);
  }, [toast, cart, availableProducts, isProcessingCartAction]);

  const subTotal = useMemo(() => 
    cart.reduce((sum, item) => sum + item.totalItemPrice, 0),
    [cart]
  );

  const cartTotal = useMemo(() => {
    const calculatedTotal = subTotal - discountAmount;
    return calculatedTotal > 0 ? calculatedTotal : 0;
  }, [subTotal, discountAmount]);

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    if (!barcode.trim() || isProcessingCartAction) return;
    const product = availableProducts.find(p => p.barcodeNumber === barcode.trim());

    if (product) {
        if (product.stock <=0 && !isProductWeighable(product)) { 
            toast({ title: "نفذ المخزون", description: `منتج الباركود ${product.name} غير متوفر.`, variant: "destructive" });
        } else if (isProductWeighable(product)) {
            if (product.stock <= 0) { 
               toast({ title: "نفذ المخزون", description: `منتج الباركود ${product.name} غير متوفر للوزن.`, variant: "destructive" });
            } else {
                setProductToWeigh(product); 
                const existingCartItem = cart.find(item => item.id === product.id && item.isWeighed);
                setWeightInputValue(existingCartItem ? String(existingCartItem.itemQuantityInCart) : '');
                setIsWeightModalOpen(true);
                setTimeout(() => weightInputModalRef.current?.focus(), 0);
            }
        } else { 
            await addProductToCart(product, 1, false);
        }
    } else {
      toast({ title: "لم يتم العثور على المنتج", description: `لم يتم العثور على منتج برمز الباركود: ${barcode}`, variant: "destructive" });
    }
    setSearchTerm(''); 
    barcodeInputRef.current?.select(); 
    barcodeInputRef.current?.focus();
  }, [availableProducts, toast, addProductToCart, cart, isProcessingCartAction]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement;

      if (event.key === 'Enter' && !isProcessingCartAction) {
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
  }, [searchTerm, handleBarcodeScan, productToWeigh, isWeightModalOpen, weightInputValue, handleAddOrUpdateWeighedProduct, selectedDirectWeighProduct, directWeightInput, handleDirectAddWeighedProduct, isProcessingCartAction]);

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

    
    let totalCostOfGoodsSold = 0;
    for (const item of cart) {
      
      totalCostOfGoodsSold += item.itemQuantityInCart * item.purchasePrice;
    }
    const saleProfit = cartTotal - totalCostOfGoodsSold; 
    let partnerShareAmountValue: number | null = null;

    if (selectedPartner && saleProfit > 0) {
      const partnerDetails = availablePartners.find(p => p.partner_id === selectedPartner);
      if (partnerDetails) {
        partnerShareAmountValue = saleProfit * (partnerDetails.profit_share_percentage / 100.0);
        partnerShareAmountValue = parseFloat(partnerShareAmountValue.toFixed(2)); 
      }
    }


    try {
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          total_amount: cartTotal, 
          discount_amount: discountAmount > 0 ? discountAmount : null, 
          payment_method: 'Cash', 
          sale_date: new Date().toISOString(),
          user_id: user.id,
          partner_id: selectedPartner || null,
          partner_share_amount: partnerShareAmountValue,
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
      
      
      
      toast({ icon: <CheckCircle className="text-green-500" />, title: "تم الدفع بنجاح", description: `الإجمالي: ${cartTotal.toFixed(2)} ل.س. تم تسجيل البيع.` });
      setCart([]); 
      setSelectedDirectWeighProduct(null);
      setDirectWeightInput('');
      setDiscountAmount(0);
      setDiscountInput('');
      setSelectedPartner(undefined);
      barcodeInputRef.current?.focus();
      await fetchProducts(); // Refresh product list to show updated stock
    } catch (error: any) {
      console.error("خطأ أثناء الدفع:", error);
      toast({ icon: <XCircle className="text-red-500" />, title: "خطأ أثناء الدفع", description: error.message || "فشلت عملية الدفع.", variant: "destructive"});
      // Attempt to refetch products even on error to reflect any partial stock changes that might have occurred
      await fetchProducts();
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

  if (isLoadingProducts && isLoadingPartners && !user && cart.length === 0) { 
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }
  
  if (!user && !isLoadingProducts && !isLoadingPartners) { 
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-7rem)] max-h-[calc(100vh-7rem)]">
        
        <div className="lg:col-span-2 flex flex-col gap-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="font-headline text-base text-foreground">بحث وإضافة سريعة</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5 px-3 pb-3">
              <div className="flex gap-2 items-center">
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
                    disabled={isProcessingCartAction || isLoadingProducts}
                  />
                </div>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => barcodeInputRef.current?.focus()} disabled={isProcessingCartAction}>
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-xs font-medium mb-1 text-muted-foreground">إضافة منتج بالوزن:</h3>
                <form onSubmit={(e) => { e.preventDefault(); handleDirectAddWeighedProduct(); }} className="space-y-1.5">
                  <Select
                    value={selectedDirectWeighProduct?.id || ""}
                    onValueChange={(productId) => {
                      const product = availableProducts.find(p => p.id === productId);
                      setSelectedDirectWeighProduct(product || null);
                      setDirectWeightInput(''); 
                      if (product) setTimeout(()=> directWeightInputRef.current?.focus(),0);
                    }}
                    dir="rtl"
                    disabled={isProcessingCartAction || isLoadingProducts || weighableProductsForSelect.length === 0}
                  >
                    <SelectTrigger className="bg-input/50 focus:bg-input h-9 text-xs">
                      <SelectValue placeholder={isLoadingProducts ? "جاري التحميل..." : weighableProductsForSelect.length > 0 ? "اختر منتجًا للوزن..." : "لا منتجات موزونة"} />
                    </SelectTrigger>
                    <SelectContent>
                      {weighableProductsForSelect.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">{p.name} ({p.pricePerUnit.toFixed(2)}/{p.unit}) (م: {p.stock})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1.5">
                    <Input
                      ref={directWeightInputRef}
                      type="number"
                      value={directWeightInput}
                      onChange={(e) => setDirectWeightInput(e.target.value)}
                      placeholder={`الوزن (${selectedDirectWeighProduct?.unit || 'الوحدة'})`}
                      className="bg-input/50 focus:bg-input h-9 text-xs flex-grow"
                      step="0.001" min="0.001"
                      disabled={!selectedDirectWeighProduct || selectedDirectWeighProduct.stock <= 0 || isProcessingCartAction}
                    />
                    <Button
                        type="submit" size="icon" className="h-9 w-9 shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground"
                        disabled={!selectedDirectWeighProduct || !directWeightInput || parseFloat(directWeightInput) <= 0 || selectedDirectWeighProduct.stock <=0 || isProcessingCartAction}
                    > <Plus className="h-4 w-4" /> </Button>
                  </div>
                  {selectedDirectWeighProduct && selectedDirectWeighProduct.stock <=0 && <p className="text-xs text-destructive mt-0.5">هذا المنتج نفذ من المخزون.</p>}
                </form>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-1.5 pt-2.5 px-3">
              <CardTitle className="font-headline text-sm text-foreground">منتجات للإضافة السريعة (غير موزونة)</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-2 overflow-hidden">
              <ScrollArea className="h-full pr-1">
                {isLoadingProducts && availableProducts.length === 0 ? (
                    <div className="flex justify-center items-center h-full"> <PackageSearch className="h-10 w-10 text-muted-foreground/30 animate-pulse" /> </div>
                ) : filteredProductsForQuickAdd.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {filteredProductsForQuickAdd.map(product => (
                      <Button 
                        key={product.id} variant="outline" 
                        className="h-auto p-1.5 flex flex-col items-center justify-center text-center whitespace-normal break-words min-h-[70px] relative text-[0.7rem] leading-tight shadow-sm hover:shadow-md"
                        onClick={() => handleProductSelection(product)}
                        disabled={product.stock <= 0 || isProcessingCartAction}
                      >
                        {product.stock <= 0 && <Badge variant="destructive" className="absolute top-0.5 right-0.5 text-[0.5rem] px-0.5 py-0 leading-none">نفذ</Badge>}
                        <Image src={product.image || `https://placehold.co/24x24.png?text=${encodeURIComponent(product.name.charAt(0))}`} alt={product.name} width={24} height={24} className="mb-0.5 rounded" data-ai-hint={product.dataAiHint || "item product"}/>
                        <span className="text-[0.65rem] leading-tight block max-h-6 overflow-hidden font-medium">{product.name}</span>
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

        
        <Card className="lg:col-span-3 shadow-lg flex flex-col h-full">
          <CardHeader className="flex-shrink-0 pb-2 pt-3 px-4 flex flex-row justify-between items-center border-b">
            <CardTitle className="font-headline text-lg text-foreground flex items-center"><ShoppingBasket className="mr-2 h-5 w-5 text-primary"/>السلة الحالية</CardTitle>
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
                    <TableHead className="py-2 px-3 w-[40%]">المنتج</TableHead>
                    <TableHead className="text-center py-2 px-2 w-[25%]">الكمية/الوزن</TableHead>
                    <TableHead className="text-left py-2 px-2 w-[20%]">السعر الإجمالي</TableHead>
                    <TableHead className="py-2 px-1 w-[15%] text-left">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {cart.map(item => (
                      <TableRow key={`${item.id}-${item.isWeighed}`} className="border-b align-top">
                        <TableCell className="py-2 px-3">
                          <div className="flex items-start gap-2">
                            <Image src={item.image || `https://placehold.co/32x32.png?text=${encodeURIComponent(item.name.charAt(0))}`} alt={item.name} width={32} height={32} className="rounded object-cover mt-0.5 shrink-0" data-ai-hint={item.dataAiHint || "item product"}/>
                            <div className="flex-grow min-w-0">
                              <p className="font-medium text-foreground text-xs leading-tight break-words">{item.name}</p>
                              <p className="text-[0.7rem] text-muted-foreground">{item.pricePerUnit.toFixed(2)} ل.س/{item.unit}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2 px-2">
                          {item.isWeighed ? (
                            <div className="flex flex-col items-center justify-center gap-0.5">
                                <div className="flex items-center gap-1">
                                    <span className="font-medium text-xs">{item.itemQuantityInCart.toFixed(3)} {item.unit}</span>
                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleProductSelection(item)} disabled={isProcessingCartAction}> <Edit3 className="h-3 w-3 text-primary" /> </Button>
                                </div>
                                <span className="text-[0.65rem] text-muted-foreground block">(م: {(availableProducts.find(p=>p.id===item.id)?.stock || 0).toFixed(2)})</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-0.5">
                                <div className="flex items-center justify-center gap-1">
                                <Button variant="outline" size="icon" className="h-6 w-6 border-primary/50 text-primary" onClick={() => updateCartItemQuantity(item.id, item.itemQuantityInCart - 1)} disabled={isProcessingCartAction}> <Minus className="h-3 w-3" /> </Button>
                                <Input type="number" value={item.itemQuantityInCart} 
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if(!isNaN(val)) updateCartItemQuantity(item.id, val);
                                    }} 
                                    onBlur={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (isNaN(val) || val < 1) updateCartItemQuantity(item.id, 1);
                                    }}
                                    className="w-10 h-6 text-center text-xs p-0.5 bg-input/30 focus:bg-input"
                                    min="1" 
                                    disabled={isProcessingCartAction}
                                />
                                <Button variant="outline" size="icon" className="h-6 w-6 border-primary/50 text-primary" onClick={() => updateCartItemQuantity(item.id, item.itemQuantityInCart + 1)} disabled={isProcessingCartAction}> <Plus className="h-3 w-3" /> </Button>
                                </div>
                                <span className="text-[0.65rem] text-muted-foreground block">(م: {availableProducts.find(p=>p.id===item.id)?.stock || 0})</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-left font-semibold text-foreground text-xs py-2 px-2">
                          {item.totalItemPrice.toFixed(2)} ل.س
                        </TableCell>
                        <TableCell className="py-2 px-1 text-left">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/80" onClick={() => removeFromCart(item.id, item.isWeighed)} disabled={isProcessingCartAction}> <Trash2 className="h-3.5 w-3.5" /> </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              )}
            </ScrollArea>
          </CardContent>
          <Separator className="my-0" />
          <CardFooter className="flex-shrink-0 p-3 flex flex-col gap-2 border-t">
            <div className="flex justify-between items-center w-full text-sm">
              <span className="text-muted-foreground">المجموع الفرعي:</span>
              <span className="font-semibold text-foreground">{subTotal.toFixed(2)} ل.س</span>
            </div>

            {discountAmount > 0 && (
               <div className="flex justify-between items-center w-full text-sm text-destructive">
                <span className="flex items-center"><MinusCircle className="mr-1 h-3.5 w-3.5"/>الخصم:</span>
                <span className="font-semibold">-{discountAmount.toFixed(2)} ل.س</span>
              </div>
            )}

            <div className="w-full">
              <Label htmlFor="pos-partner-select" className="text-xs text-muted-foreground">اختيار الشريك (اختياري)</Label>
              <Select
                value={selectedPartner}
                onValueChange={(value) => setSelectedPartner(value === "NO_PARTNER_SELECTED" ? undefined : value)}
                dir="rtl"
                disabled={isProcessingCartAction || isLoadingPartners}
              >
                <SelectTrigger id="pos-partner-select" className="mt-0.5 bg-input/50 focus:bg-input h-9 text-xs w-full">
                  <SelectValue placeholder={isLoadingPartners ? "جاري تحميل الشركاء..." : "بدون شريك"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_PARTNER_SELECTED" className="text-xs">بدون شريك</SelectItem>
                  {availablePartners.map(p => (
                    <SelectItem key={p.partner_id} value={p.partner_id} className="text-xs">{p.partner_name} ({p.profit_share_percentage}%)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-between items-center w-full text-lg font-semibold border-t pt-2 mt-1">
              <span className="text-muted-foreground">الإجمالي:</span>
              <span className="font-headline text-xl font-bold text-purple-600">{cartTotal.toFixed(2)} ل.س</span>
            </div>
            
            <Button 
                variant="outline" 
                className="w-full text-sm h-10" 
                onClick={() => { setDiscountInput(discountAmount > 0 ? discountAmount.toString() : ''); setIsDiscountModalOpen(true);}}
                disabled={isProcessingCartAction || cart.length === 0}
            >
                <Percent className="mr-1.5 h-4 w-4"/> {discountAmount > 0 ? 'تعديل الخصم' : 'إضافة خصم'}
            </Button>
            
            <Button 
                className="w-full text-base py-2 h-10 bg-purple-600 hover:bg-purple-700 text-primary-foreground" 
                onClick={handleCheckout} 
                disabled={cart.length === 0 || isProcessingCartAction || isLoadingProducts || isLoadingPartners}
            >
              {isProcessingCartAction && cart.length > 0 ? (
                 <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <CreditCard className="mr-2 h-5 w-5" />
              )}
              {isProcessingCartAction && cart.length > 0 ? 'جاري المعالجة...' : 'الدفع الآن'}
            </Button>
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
                            <p className="text-[0.7rem] text-muted-foreground">المخزون: {(availableProducts.find(p=>p.id === productToWeigh.id)?.stock || productToWeigh.stock).toFixed(2)} {productToWeigh.unit}</p>
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
                            step="0.001" min="0.001" max={(availableProducts.find(p=>p.id === productToWeigh.id)?.stock || productToWeigh.stock)}
                            autoFocus
                        />
                    </div>
                     {parseFloat(weightInputValue) > 0 && productToWeigh && (
                         <div className="p-1.5 bg-primary/10 rounded-md text-center mt-1">
                            <p className="text-[0.7rem] text-muted-foreground">السعر المحسوب</p>
                            <p className="text-md font-semibold text-primary">
                                { (productToWeigh.pricePerUnit * Math.min(parseFloat(weightInputValue) || 0, (availableProducts.find(p=>p.id === productToWeigh.id)?.stock || productToWeigh.stock))).toFixed(2) } ل.س
                            </p>
                        </div>
                    )}
                </div>
                <DialogFooter className="mt-2 pt-2 border-t">
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm" disabled={!productToWeigh || !weightInputValue || parseFloat(weightInputValue) <= 0 || isProcessingCartAction || ((availableProducts.find(p=>p.id === productToWeigh.id)?.stock || productToWeigh.stock) < parseFloat(weightInputValue))}>
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

    