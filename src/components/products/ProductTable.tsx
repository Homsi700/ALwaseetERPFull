
// src/components/products/ProductTable.tsx
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileEdit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit: 'قطعة' | 'كيلو' | 'متر' | 'غرام' | 'علبة' | 'لتر' | 'طرد';
  productType: 'منتج بباركود' | 'منتج موصول' | 'منتج عادي';
  barcodeNumber?: string;
  purchasePrice: number;
  salePrice: number; 
  stock: number;
  minStockLevel: number;
  image?: string;
  dataAiHint?: string;
}

export const productCategories = ["فواكه", "خضروات", "مخبوزات", "ألبان وبيض", "لحوم", "مشروبات", "بقالة", "وجبات خفيفة", "منظفات", "أخرى"] as const;
export const productTypes: Product['productType'][] = ['منتج بباركود', 'منتج موصول', 'منتج عادي'];


interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all'); 
  const [filterProductType, setFilterProductType] = useState('all'); 

  const ALL_FILTER_VALUE = "all"; 

  const filteredProducts = products.filter(product => {
    const categoryMatch = filterCategory === ALL_FILTER_VALUE || product.category === filterCategory;
    const productTypeMatch = filterProductType === ALL_FILTER_VALUE || product.productType === filterProductType;
    const searchTermMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || (product.barcodeNumber && product.barcodeNumber.includes(searchTerm));
    
    return searchTermMatch && categoryMatch && productTypeMatch;
  });

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-foreground">قائمة المنتجات ({filteredProducts.length})</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Input 
            placeholder="بحث بالاسم أو الباركود..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-input/50 focus:bg-input"
          />
          <Select value={filterCategory} onValueChange={setFilterCategory} dir="rtl">
            <SelectTrigger className="bg-input/50 focus:bg-input">
              <SelectValue placeholder="تصفية حسب الفئة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>كل الفئات</SelectItem>
              {productCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterProductType} onValueChange={setFilterProductType} dir="rtl">
            <SelectTrigger className="bg-input/50 focus:bg-input">
              <SelectValue placeholder="تصفية حسب نوع المنتج" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>كل الأنواع</SelectItem>
              {productTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">الصورة</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>الفئة</TableHead>
              <TableHead>نوع المنتج</TableHead>
              <TableHead>وحدة القياس</TableHead>
              <TableHead className="text-left">سعر الشراء</TableHead>
              <TableHead className="text-left">سعر البيع</TableHead>
              <TableHead className="text-left">المخزون</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead className="text-left w-[80px]">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center h-24 text-muted-foreground">
                  {products.length === 0 ? "لا توجد منتجات لعرضها. يرجى إضافة منتج جديد." : "لا توجد منتجات تطابق معايير البحث أو التصفية."}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <Image 
                      src={product.image || `https://placehold.co/60x60.png?text=${encodeURIComponent(product.name.charAt(0))}`} 
                      alt={product.name} 
                      width={40} 
                      height={40} 
                      className="rounded-md object-cover"
                      data-ai-hint={product.dataAiHint || "item object"}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.category}</TableCell>
                  <TableCell className="text-muted-foreground">{product.productType}</TableCell>
                  <TableCell className="text-muted-foreground">{product.unit}</TableCell>
                  <TableCell className="text-left text-muted-foreground">{product.purchasePrice.toFixed(2)} ل.س</TableCell>
                  <TableCell className="text-left text-muted-foreground">
                    {product.salePrice.toFixed(2)} ل.س
                    {product.productType === 'منتج موصول' && `/${product.unit}`}
                  </TableCell>
                  <TableCell className="text-left text-muted-foreground">{product.stock}</TableCell>
                  <TableCell className="text-center">
                    {product.stock > product.minStockLevel ? (
                      <Badge variant="default" className="bg-green-500/20 text-green-700 hover:bg-green-500/30 border-green-500/30">متوفر</Badge>
                    ) : product.stock > 0 ? (
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 border-yellow-500/30">مخزون منخفض</Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-500/20 text-red-700 hover:bg-red-500/30 border-red-500/30">نفذ المخزون</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-left">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">فتح القائمة</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => onEdit(product)}>
                          <FileEdit className="ml-2 h-4 w-4" /> تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(product.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="ml-2 h-4 w-4" /> حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </CardContent>
    </Card>
  );
};

export default ProductTable;
