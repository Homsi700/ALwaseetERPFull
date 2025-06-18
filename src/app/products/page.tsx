
// src/app/products/page.tsx
"use client";

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import ProductTable, { Product } from '@/components/products/ProductTable';
import ProductFormModal from '@/components/products/ProductFormModal';
import { useToast } from '@/hooks/use-toast';

const initialProducts: Product[] = [
  { id: '1', name: 'تفاح عضوي', category: 'فواكه', price: 2.99, stock: 150, unit: 'كيلو', image: 'https://placehold.co/100x100.png?text=تفاح' , dataAiHint: 'apple fruit' },
  { id: '2', name: 'خبز قمح كامل', category: 'مخبوزات', price: 3.49, stock: 80, unit: 'قطعة', image: 'https://placehold.co/100x100.png?text=خبز', dataAiHint: 'bread pastry' },
  { id: '3', name: 'بيض (طبق)', category: 'ألبان وبيض', price: 4.99, stock: 60, unit: 'علبة', image: 'https://placehold.co/100x100.png?text=بيض', dataAiHint: 'eggs dairy' },
  { id: '4', name: 'حليب لوز (١ لتر)', category: 'مشروبات', price: 2.79, stock: 120, unit: 'لتر', image: 'https://placehold.co/100x100.png?text=حليب', dataAiHint: 'milk drink' },
  { id: '5', name: 'لحم بقري مفروم', category: 'لحوم', price: 7.99, stock: 45, unit: 'كيلو', image: 'https://placehold.co/100x100.png?text=لحم', dataAiHint: 'meat beef' },
  { id: '6', name: 'خيار بلدي', category: 'خضروات', price: 1.50, stock: 200, unit: 'كيلو', image: 'https://placehold.co/100x100.png?text=خيار', dataAiHint: 'cucumber vegetable' },
  { id: '7', name: 'أرز بسمتي فاخر', category: 'بقالة', price: 5.25, stock: 90, unit: 'كيلو', image: 'https://placehold.co/100x100.png?text=أرز', dataAiHint: 'rice grains' },
  { id: '8', name: 'زيت زيتون بكر', category: 'بقالة', price: 12.00, stock: 70, unit: 'لتر', image: 'https://placehold.co/100x100.png?text=زيت', dataAiHint: 'oil olive' },
  { id: '9', name: 'مناديل ورقية (طرد)', category: 'أخرى', price: 8.50, stock: 50, unit: 'طرد', image: 'https://placehold.co/100x100.png?text=مناديل', dataAiHint: 'tissue paper' },
  { id: '10', name: 'مسحوق غسيل (غرام)', category: 'منظفات', price: 0.05, stock: 10000, unit: 'غرام', image: 'https://placehold.co/100x100.png?text=مسحوق', dataAiHint: 'detergent powder' },
];

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const { toast } = useToast();

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
    toast({
      title: 'تم حذف المنتج',
      description: 'تمت إزالة المنتج من القائمة بنجاح.',
      variant: 'default',
    });
  };

  const handleSaveProduct = (productData: Omit<Product, 'id' | 'dataAiHint'> & { id?: string }) => {
    if (editingProduct) {
      setProducts(prevProducts => 
        prevProducts.map(p => (p.id === editingProduct.id ? { ...p, ...productData, id: editingProduct.id } : p))
      );
      toast({
        title: 'تم تحديث المنتج',
        description: `تم تحديث بيانات المنتج "${productData.name}" بنجاح.`,
      });
    } else {
      const newProductWithId: Product = {
        ...productData,
        id: String(Date.now()), // Generate a new ID for new products
        image: productData.image || `https://placehold.co/100x100.png?text=${encodeURIComponent(productData.name.substring(0,10))}`,
        dataAiHint: `${productData.category.split(" ")[0] || ""} ${productData.name.split(" ")[0] || ""}`.toLowerCase().trim()
      };
      setProducts(prevProducts => [newProductWithId, ...prevProducts]);
      toast({
        title: 'تمت إضافة منتج جديد',
        description: `تمت إضافة المنتج "${productData.name}" بنجاح.`,
      });
    }
    setIsModalOpen(false);
    setEditingProduct(undefined);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-headline font-semibold text-foreground">إدارة المنتجات</h1>
          <Button onClick={handleAddProduct} className="mt-4 sm:mt-0 bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="ml-2 h-5 w-5" /> إضافة منتج جديد
          </Button>
        </div>
        
        <ProductTable 
          products={products} 
          onEdit={handleEditProduct} 
          onDelete={handleDeleteProduct} 
        />

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

    