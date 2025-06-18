// src/components/products/ProductFormModal.tsx
"use client";

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Product } from './ProductTable'; 
import { ScrollArea } from '@/components/ui/scroll-area';

const measurementUnits = ["قطعة", "كيلو", "متر", "غرام", "علبة", "لتر", "طرد"] as const;
const productCategoriesList = ["فواكه", "خضروات", "مخبوزات", "ألبان وبيض", "لحوم", "مشروبات", "بقالة", "وجبات خفيفة", "منظفات", "أخرى"] as const;
const productTypesList: Product['productType'][] = ['منتج بباركود', 'منتج موصول', 'منتج عادي'];

const productSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  description: z.string().optional(),
  unit: z.enum(measurementUnits, { required_error: "وحدة القياس مطلوبة"}),
  productType: z.enum(productTypesList, { required_error: "نوع المنتج مطلوب"}),
  barcodeNumber: z.string().optional(),
  purchasePrice: z.coerce.number().min(0, "سعر الشراء يجب أن يكون صفراً أو أكثر"),
  salePrice: z.coerce.number().min(0.01, "سعر البيع يجب أن يكون إيجابيًا"),
  stock: z.coerce.number().min(0, "لا يمكن أن يكون المخزون سالبًا").int("يجب أن يكون المخزون عددًا صحيحًا"),
  minStockLevel: z.coerce.number().min(0, "الحد الأدنى للمخزون يجب أن يكون صفراً أو أكثر").int("يجب أن يكون صحيحًا"),
  category: z.enum(productCategoriesList, { required_error: "فئة المنتج مطلوبة"}),
  image: z.string().url("يجب أن يكون عنوان URL صالحًا للصورة").optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.productType === 'منتج بباركود' && (!data.barcodeNumber || data.barcodeNumber.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "رقم الباركود مطلوب للمنتجات ذات الباركود",
      path: ['barcodeNumber'],
    });
  }
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'dataAiHint'> & { id?: string }) => void;
  product?: Product;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, product }) => {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      unit: measurementUnits[0],
      productType: productTypesList[0],
      barcodeNumber: '',
      purchasePrice: 0,
      salePrice: 0,
      stock: 0,
      minStockLevel: 0,
      category: productCategoriesList[0],
      image: '',
    }
  });

  const watchedProductType = watch("productType");
  const watchedUnit = watch("unit");

  useEffect(() => {
    if (isOpen) {
      if (product) {
        reset({
          name: product.name,
          description: product.description || '',
          unit: product.unit,
          productType: product.productType,
          barcodeNumber: product.barcodeNumber || '',
          purchasePrice: product.purchasePrice,
          salePrice: product.salePrice,
          stock: product.stock,
          minStockLevel: product.minStockLevel,
          category: product.category as typeof productCategoriesList[number],
          image: product.image || '',
        });
      } else {
        reset({
          name: '',
          description: '',
          unit: measurementUnits[0],
          productType: productTypesList[0],
          barcodeNumber: '',
          purchasePrice: 0,
          salePrice: 0,
          stock: 0,
          minStockLevel: 5, // Default min stock level
          category: productCategoriesList[0],
          image: '',
        });
      }
    }
  }, [product, isOpen, reset]);

  const onSubmit = (data: ProductFormData) => {
    const productDataToSave = {
      ...data,
      id: product?.id,
    };
    onSave(productDataToSave);
  };
  
  const salePriceLabel = watchedProductType === 'منتج موصول' 
    ? `سعر البيع لكل ${watchedUnit || 'وحدة'}` 
    : "سعر البيع";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-foreground">{product ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
          <DialogDescription>
            {product ? `تعديل بيانات المنتج: ${product.name}` : 'أدخل تفاصيل المنتج الجديد ليتم إضافته إلى المخزون.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ScrollArea className="max-h-[70vh] p-1 pr-3">
            <div className="space-y-5 py-4 pr-1">
              <div>
                <Label htmlFor="name" className="text-muted-foreground">اسم المنتج</Label>
                <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} className="mt-1 bg-input/50 focus:bg-input"/>} />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <Label htmlFor="description" className="text-muted-foreground">وصف المنتج (اختياري)</Label>
                <Controller name="description" control={control} render={({ field }) => <Textarea id="description" {...field} className="mt-1 bg-input/50 focus:bg-input resize-y min-h-[80px]" />} />
                {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="unit" className="text-muted-foreground">وحدة القياس</Label>
                    <Controller name="unit" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                        <SelectTrigger id="unit" className="mt-1 bg-input/50 focus:bg-input"><SelectValue placeholder="اختر وحدة" /></SelectTrigger>
                        <SelectContent>{measurementUnits.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent>
                        </Select>
                    )} />
                    {errors.unit && <p className="text-sm text-destructive mt-1">{errors.unit.message}</p>}
                </div>
                <div>
                    <Label htmlFor="productType" className="text-muted-foreground">نوع المنتج</Label>
                    <Controller name="productType" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                        <SelectTrigger id="productType" className="mt-1 bg-input/50 focus:bg-input"><SelectValue placeholder="اختر نوع المنتج" /></SelectTrigger>
                        <SelectContent>{productTypesList.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                        </Select>
                    )} />
                    {errors.productType && <p className="text-sm text-destructive mt-1">{errors.productType.message}</p>}
                </div>
              </div>

              {watchedProductType === 'منتج بباركود' && (
                <div>
                  <Label htmlFor="barcodeNumber" className="text-muted-foreground">رقم الباركود</Label>
                  <Controller name="barcodeNumber" control={control} render={({ field }) => <Input id="barcodeNumber" {...field} className="mt-1 bg-input/50 focus:bg-input"/>} />
                  {errors.barcodeNumber && <p className="text-sm text-destructive mt-1">{errors.barcodeNumber.message}</p>}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchasePrice" className="text-muted-foreground">سعر الشراء</Label>
                  <Controller name="purchasePrice" control={control} render={({ field }) => <Input id="purchasePrice" type="number" step="0.01" {...field} className="mt-1 bg-input/50 focus:bg-input"/>} />
                  {errors.purchasePrice && <p className="text-sm text-destructive mt-1">{errors.purchasePrice.message}</p>}
                </div>
                <div>
                  <Label htmlFor="salePrice" className="text-muted-foreground">{salePriceLabel}</Label>
                  <Controller name="salePrice" control={control} render={({ field }) => <Input id="salePrice" type="number" step="0.01" {...field} className="mt-1 bg-input/50 focus:bg-input"/>} />
                  {errors.salePrice && <p className="text-sm text-destructive mt-1">{errors.salePrice.message}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock" className="text-muted-foreground">الكمية الحالية/المخزون</Label>
                  <Controller name="stock" control={control} render={({ field }) => <Input id="stock" type="number" {...field}  className="mt-1 bg-input/50 focus:bg-input"/>} />
                  {errors.stock && <p className="text-sm text-destructive mt-1">{errors.stock.message}</p>}
                </div>
                <div>
                  <Label htmlFor="minStockLevel" className="text-muted-foreground">الحد الأدنى للمخزون للتنبيه</Label>
                  <Controller name="minStockLevel" control={control} render={({ field }) => <Input id="minStockLevel" type="number" {...field} className="mt-1 bg-input/50 focus:bg-input"/>} />
                  {errors.minStockLevel && <p className="text-sm text-destructive mt-1">{errors.minStockLevel.message}</p>}
                </div>
              </div>
              
              <div>
                <Label htmlFor="category" className="text-muted-foreground">فئة المنتج</Label>
                <Controller name="category" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                    <SelectTrigger id="category" className="mt-1 bg-input/50 focus:bg-input"><SelectValue placeholder="اختر فئة" /></SelectTrigger>
                    <SelectContent>{productCategoriesList.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                    </Select>
                )} />
                {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
              </div>

              <div>
                <Label htmlFor="image" className="text-muted-foreground">رابط الصورة (اختياري)</Label>
                <Controller name="image" control={control} render={({ field }) => <Input id="image" {...field} placeholder="https://placehold.co/100x100.png" className="mt-1 bg-input/50 focus:bg-input"/>} />
                {errors.image && <p className="text-sm text-destructive mt-1">{errors.image.message}</p>}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-8 pt-4 border-t">
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ المنتج</Button>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormModal;
