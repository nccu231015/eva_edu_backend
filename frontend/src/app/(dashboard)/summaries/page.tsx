'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Toaster, toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Category {
  categoryId: number;
  categoryName: string;
}

interface Summary {
  summaryId: number;
  categoryId: number;
  yearStart: number;
  yearEnd: number;
  description: string;
  category?: Category;
}

function SummaryDialog({ 
  summary,
  categories,
  onDone
}: { 
  summary?: Summary | null, 
  categories: Category[], 
  onDone: () => void 
}) {
  const [open, setOpen] = useState(false);
  const [yearStart, setYearStart] = useState<number | undefined>();
  const [yearEnd, setYearEnd] = useState<number | undefined>();
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  
  const isEditMode = !!summary;

  useEffect(() => {
    if (isEditMode && summary) {
      setYearStart(summary.yearStart);
      setYearEnd(summary.yearEnd);
      setDescription(summary.description);
      setCategoryId(summary.categoryId);
    } else {
      setYearStart(undefined);
      setYearEnd(undefined);
      setDescription('');
      setCategoryId(undefined);
    }
  }, [summary, isEditMode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearStart || !yearEnd || !description || !categoryId) {
      toast.error('請填寫所有必填欄位');
      return;
    }

    const summaryData = { categoryId, yearStart, yearEnd, description };
    const url = isEditMode ? `http://localhost:3002/api/summaries/${summary.summaryId}` : 'http://localhost:3002/api/summaries';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summaryData),
      });

      if (!res.ok) {
        throw new Error(isEditMode ? '更新失敗' : '新增失敗');
      }

      toast.success(isEditMode ? '更新成功！' : '新增成功！');
      onDone();
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditMode ? 
          <Button variant="outline" size="sm" className="mr-2">編輯</Button> :
          <Button>新增年份區段</Button>
        }
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '編輯年份區段' : '新增年份區段'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">分類</Label>
              <Select value={categoryId ? String(categoryId) : undefined} onValueChange={(value) => setCategoryId(parseInt(value))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="選擇分類" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => <SelectItem key={cat.categoryId} value={String(cat.categoryId)}>{cat.categoryName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="yearStart" className="text-right">
                開始年份
              </Label>
              <Input id="yearStart" type="number" value={yearStart || ''} onChange={(e) => setYearStart(parseInt(e.target.value))} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="yearEnd" className="text-right">
                結束年份
              </Label>
              <Input id="yearEnd" type="number" value={yearEnd || ''} onChange={(e) => setYearEnd(parseInt(e.target.value))} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                描述
              </Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3"/>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">儲存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SummariesPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState('');

  const fetchSummaries = async () => {
    try {
      const res = await fetch('http://localhost:3002/api/summaries');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setSummaries(data);
    } catch (error) {
      console.error('Failed to fetch summaries:', error);
      toast.error('無法讀取年份區段資料');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:3002/api/categories');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setCategories(data);
      if (data.length > 0 && !activeTab) {
        setActiveTab(data[0].categoryName);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('無法讀取分類資料');
    }
  };

  useEffect(() => {
    fetchSummaries();
    fetchCategories();
  }, []);

  const handleDelete = async (summaryId: number) => {
    if (!confirm('您確定要刪除這個年份區段嗎？')) return;
    try {
      const res = await fetch(`http://localhost:3002/api/summaries/${summaryId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('刪除失敗');
      toast.success('刪除成功！');
      fetchSummaries();
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message);
    }
  };
  
  const filteredSummaries = useMemo(
    () => summaries.filter(summary => summary.category?.categoryName === activeTab),
    [summaries, activeTab]
  );

  return (
    <>
      <Toaster />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">年份區段管理</h1>
        <SummaryDialog categories={categories} onDone={fetchSummaries} />
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {categories.map((cat) => (
            <TabsTrigger key={cat.categoryId} value={cat.categoryName}>
              {cat.categoryName}
            </TabsTrigger>
          ))}
        </TabsList>
        {categories.map((cat) => (
          <TabsContent key={cat.categoryId} value={cat.categoryName}>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>開始年份</TableHead>
                    <TableHead>結束年份</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSummaries.length > 0 ? (
                    filteredSummaries.map((summary) => (
                      <TableRow key={summary.summaryId}>
                        <TableCell>{summary.yearStart}</TableCell>
                        <TableCell>{summary.yearEnd}</TableCell>
                        <TableCell className="max-w-xs truncate">{summary.description}</TableCell>
                        <TableCell className="text-right">
                          <SummaryDialog 
                            summary={summary}
                            categories={categories}
                            onDone={fetchSummaries}
                          />
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(summary.summaryId)}>
                            刪除
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        這個分類中沒有資料
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
} 