// src/app/pos/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QrCode, Search, Plus, Minus, Trash2, Scale, CreditCard } from 'lucide-react';
import type { Product } from '@/components/products/ProductTable'; // Reusing Product type
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

// Mock product data (ideally fetched from a backend or context)
const availableProducts: Product[] = [
  { id: '1', name: 'Organic Apples', category: 'Fruits', price: 2.99, stock: 150, image: 'https://placehold.co/40x40.png' },
  { id: '2', name: 'Whole Wheat Bread', category: 'Bakery', price: 3.49, stock: 80, image: 'https://placehold.co/40x40.png' },
  { id: '3', name: 'Free-Range Eggs', category: 'Dairy & Eggs', price: 4.99, stock: 60, image: 'https://placehold.co/40x40.png' },
  { id: '4', name: 'Banana', category: 'Fruits', price: 0.50, stock: 200, image: 'https://placehold.co/40x40.png' }, // Price per unit
  { id: '5', name: 'Chicken Breast (per kg)', category: 'Meat', price: 9.99, stock: 50, image: 'https://placehold.co/40x40.png' }, // Price per kg
];

interface CartItem extends Product {
  quantity: number;
  isWeighed?: boolean;
  calculatedWeight?: number; // for weighed items based on total price
}

const PosPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedWeighedProduct, setSelectedWeighedProduct] = useState<Product | null>(null);
  const [totalPriceForWeighed, setTotalPriceForWeighed] = useState('');
  const { toast } = useToast();

  const filteredProducts = useMemo(() => 
    availableProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
      !cart.find(item => item.id === p.id) // Exclude items already in cart from quick add
    ),
    [searchTerm, cart]
  );

  const addToCart = (product: Product, quantity: number = 1) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if(existingItem.isWeighed) {
        toast({ title: "Info", description: `${product.name} is already in cart as a weighed item. Remove to re-add.`, variant: "default" });
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) } : item));
    } else {
      if (product.stock < quantity && product.category !== 'Meat') { // Assuming Meat is weighable and stock is in kg
         toast({ title: "Stock Alert", description: `Not enough ${product.name} in stock.`, variant: "destructive" });
         return;
      }
      setCart([...cart, { ...product, quantity: Math.min(quantity, product.stock) }]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const productInCart = cart.find(item => item.id === productId);
    if (productInCart) {
      if (newQuantity > productInCart.stock && !productInCart.isWeighed) {
        toast({ title: "Stock Alert", description: `Cannot exceed available stock for ${productInCart.name}.`, variant: "destructive" });
        return;
      }
      if (newQuantity <= 0) {
        removeFromCart(productId);
      } else {
        setCart(cart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
      }
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleAddWeighedItem = () => {
    if (!selectedWeighedProduct || !totalPriceForWeighed) {
      toast({ title: "Error", description: "Please select a weighable product and enter total price.", variant: "destructive"});
      return;
    }
    const price = parseFloat(totalPriceForWeighed);
    if (isNaN(price) || price <= 0) {
      toast({ title: "Error", description: "Please enter a valid total price.", variant: "destructive"});
      return;
    }
    const calculatedWeight = price / selectedWeighedProduct.price;
    
    if (cart.find(item => item.id === selectedWeighedProduct.id)) {
      toast({ title: "Info", description: `${selectedWeighedProduct.name} is already in cart. Remove to re-add as weighed.`, variant: "default" });
      return;
    }

    setCart([...cart, { 
      ...selectedWeighedProduct, 
      quantity: 1, // Represents one instance of this weighed purchase
      price: price, // Override unit price with total price for this entry
      isWeighed: true, 
      calculatedWeight 
    }]);
    setSelectedWeighedProduct(null);
    setTotalPriceForWeighed('');
    toast({ title: "Item Added", description: `${selectedWeighedProduct.name} added to cart.` });
  };

  const cartTotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.isWeighed ? item.price : item.price * item.quantity), 0),
    [cart]
  );

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "Empty Cart", description: "Please add items to the cart before checkout.", variant: "destructive"});
      return;
    }
    // Mock checkout process
    toast({ title: "Checkout Successful", description: `Total: $${cartTotal.toFixed(2)}. Thank you!` });
    setCart([]); // Clear cart after checkout
  };

  const weighableProducts = useMemo(() => availableProducts.filter(p => p.name.toLowerCase().includes('(per kg)')), []);


  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)]">
        {/* Left Panel: Product Selection & Weight Tool */}
        <div className="lg:w-2/5 flex flex-col gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground">Product Search</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Search products or scan barcode..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input/50 focus:bg-input"
                />
              </div>
              <Button variant="outline" size="icon" className="shrink-0">
                <QrCode className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg flex-1 flex flex-col min-h-0">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground">Quick Add</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-3 overflow-hidden">
              <ScrollArea className="h-full pr-3">
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredProducts.slice(0, 9).map(product => (
                      <Button 
                        key={product.id} 
                        variant="outline" 
                        className="h-auto p-3 flex flex-col items-center justify-center text-center whitespace-normal break-words min-h-[80px]"
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0 && !product.name.toLowerCase().includes('(per kg)')}
                      >
                        <Image src={product.image!} alt={product.name} width={32} height={32} className="mb-1 rounded" data-ai-hint="product item" />
                        <span className="text-xs">{product.name}</span>
                        <span className="text-xs font-semibold text-primary">${product.price.toFixed(2)}{product.name.toLowerCase().includes('(per kg)') ? '/kg' : ''}</span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">No products match search or all are in cart.</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-foreground">Weighed Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select 
                value={selectedWeighedProduct?.id || ''} 
                onChange={(e) => setSelectedWeighedProduct(weighableProducts.find(p => p.id === e.target.value) || null)}
                className="w-full p-2 border rounded-md bg-input/50 focus:bg-input text-sm"
              >
                <option value="">Select weighable product</option>
                {weighableProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (${p.price}/kg)</option>
                ))}
              </select>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="number" 
                  placeholder="Enter total price for item" 
                  value={totalPriceForWeighed}
                  onChange={(e) => setTotalPriceForWeighed(e.target.value)}
                  className="pl-9 bg-input/50 focus:bg-input"
                  disabled={!selectedWeighedProduct}
                />
              </div>
              <Button onClick={handleAddWeighedItem} className="w-full" disabled={!selectedWeighedProduct || !totalPriceForWeighed}>
                <Scale className="mr-2 h-4 w-4" /> Add Weighed Item
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Cart & Checkout */}
        <Card className="lg:w-3/5 shadow-lg flex flex-col h-full">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="font-headline text-2xl text-foreground">Current Sale</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {cart.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground text-lg p-6">Your cart is empty.</p>
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60%]">Product</TableHead>
                    <TableHead className="text-center w-[20%]">Quantity/Weight</TableHead>
                    <TableHead className="text-right w-[20%]">Price</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {cart.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Image src={item.image!} alt={item.name} width={32} height={32} className="mr-2 rounded" data-ai-hint="product item" />
                            <div>
                              <p className="font-medium text-foreground">{item.name}</p>
                              {!item.isWeighed && <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>}
                              {item.isWeighed && <p className="text-xs text-muted-foreground">{item.calculatedWeight?.toFixed(3)} kg @ ${item.price / (item.calculatedWeight || 1) : 0 /kg}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.isWeighed ? (
                            <span>{item.calculatedWeight?.toFixed(3)} kg</span>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))} className="w-12 h-8 text-center text-sm p-1 bg-input/30"/>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          ${item.isWeighed ? item.price.toFixed(2) : (item.price * item.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              )}
            </ScrollArea>
          </CardContent>
          <Separator className="my-0" />
          <CardFooter className="flex-shrink-0 p-6 space-y-4">
            <div className="flex justify-between items-center text-xl font-semibold">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-headline text-foreground">${cartTotal.toFixed(2)}</span>
            </div>
            <Button className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleCheckout}>
              <CreditCard className="mr-2 h-5 w-5" /> Checkout
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PosPage;
