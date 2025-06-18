// src/app/products/page.tsx
"use client";

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import ProductTable, { Product } from '@/components/products/ProductTable'; // Product type is now imported
import ProductFormModal from '@/components/products/ProductFormModal';
import { useToast } from '@/hooks/use-toast';

const initialProducts: Product[] = [
  { 
    id: '1', name: 'تفاح عضوي فاخر', category: 'فواكه', unit: 'كيلو', productType: 'منتج موصول',
    purchasePrice: 8.50, salePrice: 12.50, stock: 150, minStockLevel: 10, 
    image: 'https://placehold.co/100x100.png?text=تفاح', dataAiHint: 'apple fruit', description: 'تفاح أحمر عضوي طازج من المزرعة.'
  },
  { 
    id: '2', name: 'خبز قمح كامل طازج', category: 'مخبوزات', unit: 'قطعة', productType: 'منتج بباركود', barcodeNumber: '1234567890123',
    purchasePrice: 2.00, salePrice: 3.49, stock: 80, minStockLevel: 20, 
    image: 'https://placehold.co/100x100.png?text=خبز', dataAiHint: 'bread pastry', description: 'خبز مصنوع من دقيق القمح الكامل الغني بالألياف.'
  },
  { 
    id: '3', name: 'بيض مائدة (طبق 30)', category: 'ألبان وبيض', unit: 'علبة', productType: 'منتج عادي',
    purchasePrice: 12.00, salePrice: 15.00, stock: 60, minStockLevel: 5, 
    image: 'https://placehold.co/100x100.png?text=بيض', dataAiHint: 'eggs dairy'
  },
  { 
    id: '4', name: 'حليب لوز (١ لتر)', category: 'مشروبات', unit: 'لتر', productType: 'منتج بباركود', barcodeNumber: '9876543210987',
    purchasePrice: 9.00, salePrice: 11.50, stock: 120, minStockLevel: 15, 
    image: 'https://placehold.co/100x100.png?text=حليب', dataAiHint: 'almond milk' 
  },
  { 
    id: '5', name: 'لحم بقري مفروم بلدي', category: 'لحوم', unit: 'كيلو', productType: 'منتج موصول',
    purchasePrice: 55.00, salePrice: 70.00, stock: 45, minStockLevel: 5, 
    image: 'https://placehold.co/100x100.png?text=لحم', dataAiHint: 'beef mince', description: 'لحم بقري مفروم طازج، مثالي للطهي.'
  },
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

  // Updated onSave to handle new Product structure
  const handleSaveProduct = (productData: Omit<Product, 'id' | 'dataAiHint'> & { id?: string }) => {
    if (editingProduct) {
      setProducts(prevProducts => 
        prevProducts.map(p => (p.id === editingProduct.id ? { ...editingProduct, ...productData } : p))
      );
      toast({
        title: 'تم تحديث المنتج',
        description: `تم تحديث بيانات المنتج "${productData.name}" بنجاح.`,
      });
    } else {
      const newProductWithId: Product = {
        id: String(Date.now()), 
        name: productData.name,
        description: productData.description,
        category: productData.category,
        unit: productData.unit,
        productType: productData.productType,
        barcodeNumber: productData.barcodeNumber,
        purchasePrice: productData.purchasePrice,
        salePrice: productData.salePrice,
        stock: productData.stock,
        minStockLevel: productData.minStockLevel,
        image: productData.image || `https://placehold.co/100x100.png?text=${encodeURIComponent(productData.name.substring(0,2))}`,
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
