
// src/components/products/ProductFormModal.tsx
"use client";

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Product } from './ProductTable';
import { useToast } from '@/hooks/use-toast';

const productSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  category: z.string().min(1, "الفئة مطلوبة"),
  price: z.number().min(0.01, "يجب أن يكون السعر إيجابيًا"),
  stock: z.number().min(0, "لا يمكن أن يكون المخزون سالبًا").int("يجب أن يكون المخزون عددًا صحيحًا"),
  image: z.string().url("يجب أن يكون عنوان URL صالحًا").optional().or(z.literal('')),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product?: Product;
}

const categories = ["فواكه", "خضروات", "مخبوزات", "ألبان وبيض", "لحوم", "مشروبات", "بقالة", "وجبات خفيفة", "أخرى"];

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, product }) => {
  const { toast } = useToast();
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      price: 0,
      stock: 0,
      image: '',
    }
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        image: product.image || '',
      });
    } else {
      reset({ name: '', category: '', price: 0, stock: 0, image: '' });
    }
  }, [product, isOpen, reset]);

  const onSubmit = (data: ProductFormData) => {
    onSave({
      id: product?.id || String(Date.now()), 
      ...data,
    });
    toast({
      title: `تم ${product ? 'تحديث' : 'إضافة'} المنتج`,
      description: `تم ${product ? 'تحديث' : 'إضافة'} ${data.name} بنجاح.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-foreground">{product ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div>
            <Label htmlFor="name" className="text-muted-foreground">اسم المنتج</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input id="name" {...field} className="mt-1 bg-input/50 focus:bg-input"/>}
            />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="category" className="text-muted-foreground">الفئة</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                  <SelectTrigger id="category" className="mt-1 bg-input/50 focus:bg-input">
                    <SelectValue placeholder="اختر فئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price" className="text-muted-foreground">السعر</Label>
              <Controller
                name="price"
                control={control}
                render={({ field }) => <Input id="price" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="mt-1 bg-input/50 focus:bg-input"/>}
              />
              {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <Label htmlFor="stock" className="text-muted-foreground">كمية المخزون</Label>
              <Controller
                name="stock"
                control={control}
                render={({ field }) => <Input id="stock" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} className="mt-1 bg-input/50 focus:bg-input"/>}
              />
              {errors.stock && <p className="text-sm text-destructive mt-1">{errors.stock.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="image" className="text-muted-foreground">رابط الصورة (اختياري)</Label>
            <Controller
                name="image"
                control={control}
                render={({ field }) => <Input id="image" {...field} placeholder="https://placehold.co/100x100.png" className="mt-1 bg-input/50 focus:bg-input"/>}
              />
            {errors.image && <p className="text-sm text-destructive mt-1">{errors.image.message}</p>}
          </div>

          <DialogFooter className="mt-8">
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ المنتج</Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">إلغاء</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormModal;
