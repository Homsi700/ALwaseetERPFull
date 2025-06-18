
// src/app/products/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import ProductTable, { Product } from '@/components/products/ProductTable';
import ProductFormModal from '@/components/products/ProductFormModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';


const mapToSupabaseProduct = (productData: Omit<Product, 'id' | 'dataAiHint'> & { id?: string; created_at?: string }) => {
  return {
    id: productData.id, 
    name: productData.name,
    description: productData.description,
    unit: productData.unit,
    product_type: productData.productType,
    barcode_number: productData.barcodeNumber,
    purchase_price: productData.purchasePrice,
    sale_price: productData.salePrice,
    stock: productData.stock,
    min_stock_level: productData.minStockLevel,
    category: productData.category,
    image_url: productData.image || `https://placehold.co/100x100.png?text=${encodeURIComponent(productData.name.charAt(0))}`,
    data_ai_hint: `${productData.category.split(" ")[0] || ""} ${productData.name.split(" ")[0] || ""}`.toLowerCase().trim(),
  };
};

const mapFromSupabaseProduct = (supabaseProduct: any): Product => {
  return {
    id: supabaseProduct.id,
    name: supabaseProduct.name,
    description: supabaseProduct.description,
    unit: supabaseProduct.unit,
    productType: supabaseProduct.product_type,
    barcodeNumber: supabaseProduct.barcode_number,
    purchasePrice: supabaseProduct.purchase_price,
    salePrice: supabaseProduct.sale_price,
    stock: supabaseProduct.stock,
    minStockLevel: supabaseProduct.min_stock_level,
    category: supabaseProduct.category,
    image: supabaseProduct.image_url,
    dataAiHint: supabaseProduct.data_ai_hint,
  };
};


const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const fetchProducts = useCallback(async () => {
    if (!user) return; 
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      if (data) {
        setProducts(data.map(mapFromSupabaseProduct));
      }
    } catch (error: any) {
      toast({
        title: 'خطأ في جلب المنتجات',
        description: error.message || 'فشل الاتصال بالخادم لجلب قائمة المنتجات.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if(user){ 
        fetchProducts();
    } else {
        setProducts([]); 
        setIsLoading(false);
    }
  }, [fetchProducts, user]);


  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      await fetchProducts(); 
      toast({
        title: 'تم حذف المنتج',
        description: 'تمت إزالة المنتج من القائمة بنجاح.',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ في حذف المنتج',
        description: error.message || 'فشل حذف المنتج. حاول مرة أخرى.',
        variant: 'destructive',
      });
    }
  };
  
  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'dataAiHint'> & { id?: string }) => {
    const productToSaveSupabase = mapToSupabaseProduct(productData);
    
    const { id, ...dataForSupabase } = productToSaveSupabase;

    if (editingProduct && editingProduct.id) { 
      try {
        const { data: updatedProduct, error } = await supabase
          .from('products')
          .update(dataForSupabase)
          .eq('id', editingProduct.id)
          .select()
          .single(); 

        if (error) throw error;

        if (updatedProduct) {
            await fetchProducts(); 
            toast({
            title: 'تم تحديث المنتج',
            description: `تم تحديث بيانات المنتج "${updatedProduct.name}" بنجاح.`,
            });
        } else {
             throw new Error("لم يتم العثور على المنتج بعد التحديث.");
        }
      } catch (error: any) {
        toast({
          title: 'خطأ في تحديث المنتج',
          description: error.message || 'فشل تحديث المنتج. تحقق من البيانات وحاول مرة أخرى.',
          variant: 'destructive',
        });
      }
    } else { 
      try {
        const { data: newProductData, error } = await supabase
          .from('products')
          .insert([dataForSupabase]) 
          .select()
          .single(); 

        if (error) throw error;
        
        if (newProductData) {
            await fetchProducts(); 
            toast({
            title: 'تمت إضافة منتج جديد',
            description: `تمت إضافة المنتج "${newProductData.name}" بنجاح.`,
            });
        } else {
            throw new Error("فشلت إضافة المنتج.");
        }
      } catch (error: any) {
        toast({
          title: 'خطأ في إضافة المنتج',
          description: error.message || 'فشل إضافة المنتج. تحقق من البيانات وحاول مرة أخرى.',
          variant: 'destructive',
        });
      }
    }
    setIsModalOpen(false);
    setEditingProduct(undefined);
  };

  if (isLoading && !user) { 
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }
  
  if (!user && !isLoading) { 
     return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-lg text-muted-foreground mb-4">يرجى تسجيل الدخول لعرض وإدارة المنتجات.</p>
          <Button onClick={() => router.push('/')}>الذهاب إلى صفحة تسجيل الدخول</Button>
        </div>
      </AppLayout>
    );
  }


  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-headline font-semibold text-foreground">إدارة المنتجات</h1>
          <Button onClick={handleAddProduct} className="mt-4 sm:mt-0 bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="ml-2 h-5 w-5" /> إضافة منتج جديد
          </Button>
        </div>
        
        {isLoading && user ? (
             <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             </div>
        ) : (
            <ProductTable 
            products={products} 
            onEdit={handleEditProduct} 
            onDelete={handleDeleteProduct} 
            />
        )}


        <ProductFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(undefined);
          }}
          onSave={handleSaveProduct}
          product={editingProduct}
        />
      </div>
    </AppLayout>
  );
};

export default ProductsPage;

