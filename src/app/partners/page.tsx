
// src/app/partners/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, FileEdit, Trash2, MoreHorizontal, Handshake, Percent, PackageSearch } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface Partner {
  partner_id: string;
  partner_name: string;
  profit_share_percentage: number;
  created_at?: string;
}

const mapToSupabasePartner = (partnerData: Omit<Partner, 'partner_id' | 'created_at'> & { partner_id?: string }) => ({
  partner_name: partnerData.partner_name,
  profit_share_percentage: partnerData.profit_share_percentage,
});

const mapFromSupabasePartner = (data: any): Partner => ({
  partner_id: data.partner_id,
  partner_name: data.partner_name,
  profit_share_percentage: data.profit_share_percentage,
  created_at: data.created_at,
});

const PartnersPage = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const fetchPartners = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('partner_name', { ascending: true });
      if (error) throw error;
      setPartners(data.map(mapFromSupabasePartner));
    } catch (error: any) {
      toast({ title: 'خطأ في جلب الشركاء', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (user) {
      fetchPartners();
    } else {
      setIsLoading(false);
    }
  }, [user, fetchPartners]);

  const handleAddPartner = () => {
    setEditingPartner(undefined);
    setIsModalOpen(true);
  };

  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setIsModalOpen(true);
  };

  const handleDeletePartner = async (partnerId: string) => {
    try {
      // Check if partner is associated with any sales
      const { data: salesData, error: salesCheckError } = await supabase
        .from('sales')
        .select('id')
        .eq('partner_id', partnerId)
        .limit(1);

      if (salesCheckError) throw salesCheckError;

      if (salesData && salesData.length > 0) {
        toast({
          title: 'لا يمكن حذف الشريك',
          description: 'هذا الشريك مرتبط بفواتير بيع حالية. لا يمكن حذفه.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.from('partners').delete().eq('partner_id', partnerId);
      if (error) throw error;
      fetchPartners();
      toast({ title: 'تم حذف الشريك' });
    } catch (error: any) {
      toast({ title: 'خطأ في حذف الشريك', description: error.message, variant: 'destructive' });
    }
  };

  const handleSavePartner = async (partnerData: Omit<Partner, 'partner_id' | 'created_at'> & { partner_id?: string }) => {
    const dataToSave = mapToSupabasePartner(partnerData);
    try {
      if (editingPartner && editingPartner.partner_id) {
        const { error } = await supabase.from('partners').update(dataToSave).eq('partner_id', editingPartner.partner_id);
        if (error) throw error;
        toast({ title: 'تم تحديث بيانات الشريك' });
      } else {
        const { error } = await supabase.from('partners').insert(dataToSave).select().single();
        if (error) throw error;
        toast({ title: 'تمت إضافة شريك جديد' });
      }
      fetchPartners();
      setIsModalOpen(false);
      setEditingPartner(undefined);
    } catch (error: any) {
      toast({ title: 'خطأ في حفظ بيانات الشريك', description: error.message, variant: 'destructive' });
    }
  };

  if (!user && !isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-lg text-muted-foreground mb-4">يرجى تسجيل الدخول للوصول إلى قسم الشركاء.</p>
          <Button onClick={() => router.push('/')}>الذهاب إلى صفحة تسجيل الدخول</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
            <Handshake className="ml-3 h-8 w-8 text-primary" /> إدارة الشركاء
          </h1>
          <Button onClick={handleAddPartner} className="mt-4 sm:mt-0 bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="ml-2 h-5 w-5" /> إضافة شريك جديد
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-foreground">قائمة الشركاء ({partners.length})</CardTitle>
            <CardDescription>عرض وتعديل بيانات الشركاء ونسب مشاركتهم في الأرباح.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم الشريك</TableHead>
                    <TableHead className="text-center">نسبة المشاركة في الربح (%)</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead className="text-left w-[80px]">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24"><PackageSearch className="h-12 w-12 mx-auto text-muted-foreground/30 animate-pulse" /></TableCell></TableRow>
                  ) : partners.length > 0 ? partners.map(partner => (
                    <TableRow key={partner.partner_id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium text-foreground">{partner.partner_name}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{partner.profit_share_percentage.toFixed(2)}%</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{partner.created_at ? new Date(partner.created_at).toLocaleDateString('ar-EG') : '-'}</TableCell>
                      <TableCell className="text-left">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => handleEditPartner(partner)}><FileEdit className="ml-2 h-4 w-4" />تعديل</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeletePartner(partner.partner_id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="ml-2 h-4 w-4" />حذف</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        لا يوجد شركاء مضافون بعد.
                    </TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          {partners.length === 0 && !isLoading && (
            <CardFooter className="justify-center p-4 text-muted-foreground">
              قم بإضافة شريك جديد لبدء إدارة نظام الشراكات.
            </CardFooter>
          )}
        </Card>

        <Dialog open={isModalOpen} onOpenChange={(isOpen) => { setIsModalOpen(isOpen); if (!isOpen) setEditingPartner(undefined); }}>
          <DialogContent className="sm:max-w-lg bg-card">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl text-foreground">{editingPartner ? 'تعديل بيانات الشريك' : 'إضافة شريك جديد'}</DialogTitle>
              <DialogDescription>
                {editingPartner ? `تعديل بيانات الشريك: ${editingPartner.partner_name}` : 'أدخل تفاصيل الشريك الجديد ونسبة مشاركته في الأرباح.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const partnerPayload: Omit<Partner, 'partner_id' | 'created_at'> & { partner_id?: string } = {
                partner_name: formData.get('p-name') as string,
                profit_share_percentage: parseFloat(formData.get('p-profit-share') as string),
              };
              if (editingPartner) {
                partnerPayload.partner_id = editingPartner.partner_id;
              }
              handleSavePartner(partnerPayload);
            }} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <Label htmlFor="p-name">اسم الشريك</Label>
                <Input id="p-name" name="p-name" defaultValue={editingPartner?.partner_name} required className="mt-1 bg-input/50 focus:bg-input" />
              </div>
              <div>
                <Label htmlFor="p-profit-share" className="flex items-center">
                  <Percent className="ml-1 h-4 w-4 text-muted-foreground" />
                  نسبة المشاركة في الربح (%)
                </Label>
                <Input
                  id="p-profit-share"
                  name="p-profit-share"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={editingPartner?.profit_share_percentage?.toString() || "0"}
                  required
                  className="mt-1 bg-input/50 focus:bg-input"
                  placeholder="مثال: 10.5"
                />
                <p className="text-xs text-muted-foreground mt-1">أدخل رقماً بين 0 و 100 (مثلاً 10.5 لـ 10.5%).</p>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">حفظ بيانات الشريك</Button>
                <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default PartnersPage;
