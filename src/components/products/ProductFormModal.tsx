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
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0.01, "Price must be positive"),
  stock: z.number().min(0, "Stock cannot be negative").int("Stock must be an integer"),
  image: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product?: Product;
}

const categories = ["Fruits", "Vegetables", "Bakery", "Dairy & Eggs", "Meat", "Beverages", "Pantry", "Snacks", "Other"];

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
      id: product?.id || String(Date.now()), // Keep existing ID or generate new
      ...data,
    });
    toast({
      title: `Product ${product ? 'Updated' : 'Added'}`,
      description: `${data.name} has been successfully ${product ? 'updated' : 'added'}.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-foreground">{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div>
            <Label htmlFor="name" className="text-muted-foreground">Product Name</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input id="name" {...field} className="mt-1 bg-input/50 focus:bg-input"/>}
            />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="category" className="text-muted-foreground">Category</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="category" className="mt-1 bg-input/50 focus:bg-input">
                    <SelectValue placeholder="Select a category" />
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
              <Label htmlFor="price" className="text-muted-foreground">Price</Label>
              <Controller
                name="price"
                control={control}
                render={({ field }) => <Input id="price" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="mt-1 bg-input/50 focus:bg-input"/>}
              />
              {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <Label htmlFor="stock" className="text-muted-foreground">Stock Quantity</Label>
              <Controller
                name="stock"
                control={control}
                render={({ field }) => <Input id="stock" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} className="mt-1 bg-input/50 focus:bg-input"/>}
              />
              {errors.stock && <p className="text-sm text-destructive mt-1">{errors.stock.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="image" className="text-muted-foreground">Image URL (Optional)</Label>
            <Controller
                name="image"
                control={control}
                render={({ field }) => <Input id="image" {...field} placeholder="https://placehold.co/100x100.png" className="mt-1 bg-input/50 focus:bg-input"/>}
              />
            {errors.image && <p className="text-sm text-destructive mt-1">{errors.image.message}</p>}
          </div>

          <DialogFooter className="mt-8">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Product</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormModal;
