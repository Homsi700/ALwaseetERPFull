
// src/components/products/ProductTable.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileEdit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '../ui/card';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
}

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, onEdit, onDelete }) => {
  return (
    <Card className="shadow-lg">
      <CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">الصورة</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>الفئة</TableHead>
              <TableHead className="text-left">السعر</TableHead>
              <TableHead className="text-left">المخزون</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  لا توجد منتجات.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <Image 
                      src={product.image || `https://placehold.co/100x100.png`} 
                      alt={product.name} 
                      width={40} 
                      height={40} 
                      className="rounded-md object-cover"
                      data-ai-hint="product item"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.category}</TableCell>
                  <TableCell className="text-left text-muted-foreground">{product.price.toFixed(2)} ر.س</TableCell>
                  <TableCell className="text-left text-muted-foreground">{product.stock}</TableCell>
                  <TableCell className="text-center">
                    {product.stock > 20 ? (
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
