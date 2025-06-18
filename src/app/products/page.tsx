
// src/app/products/page.tsx
"use client";

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import ProductTable, { Product } from '@/components/products/ProductTable';
import ProductFormModal from '@/components/products/ProductFormModal';

const initialProducts: Product[] = [
  { id: '1', name: 'تفاح عضوي', category: 'فواكه', price: 2.99, stock: 150, image: 'https://placehold.co/100x100.png' },
  { id: '2', name: 'خبز قمح كامل', category: 'مخبوزات', price: 3.49, stock: 80, image: 'https://placehold.co/100x100.png' },
  { id: '3', name: 'بيض (طبق)', category: 'ألبان وبيض', price: 4.99, stock: 60, image: 'https://placehold.co/100x100.png' },
  { id: '4', name: 'حليب لوز (١ لتر)', category: 'مشروبات', price: 2.79, stock: 120, image: 'https://placehold.co/100x100.png' },
  { id: '5', name: 'لحم بقري مفروم (١ كجم)', category: 'لحوم', price: 7.99, stock: 45, image: 'https://placehold.co/100x100.png' },
];

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === product.id ? product : p));
    } else {
      setProducts([...products, { ...product, id: String(Date.now()) }]);
    }
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
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProduct}
          product={editingProduct}
        />
      </div>
    </AppLayout>
  );
};

export default ProductsPage;
