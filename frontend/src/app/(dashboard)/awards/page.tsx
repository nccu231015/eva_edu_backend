'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
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
import { Upload, Trash2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


// Define types for our data
interface Award {
  awardId: number;
  categoryId: number;
  awardYear: number;
  awardMonth: number;
  awardTitle: string | null;
  awardName: string;
  awardEngName: string;
  awardSource: string;
  awardDescription: string | null;
  mediaPath: string | null;
  order: number;
  category: Category;
}

interface Category {
  categoryId: number;
  categoryName: string;
}

function AwardDialog({ 
  award, 
  categories, 
  onAwardAdded, 
  onAwardUpdated 
}: { 
  award?: Award | null; 
  categories: Category[]; 
  onAwardAdded: () => void;
  onAwardUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [awardYear, setAwardYear] = useState<number | undefined>();
  const [awardMonth, setAwardMonth] = useState<number | undefined>();
  const [awardTitle, setAwardTitle] = useState('');
  const [awardName, setAwardName] = useState('');
  const [awardEngName, setAwardEngName] = useState('');
  const [awardSource, setAwardSource] = useState('');
  const [awardDescription, setAwardDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categoryId, setCategoryId] = useState<number | undefined>();

  const isEditMode = !!award;

  useEffect(() => {
    if (isEditMode && award) {
      setAwardYear(award.awardYear);
      setAwardMonth(award.awardMonth);
      setAwardTitle(award.awardTitle || '');
      setAwardName(award.awardName || '');
      setAwardEngName(award.awardEngName || '');
      setAwardSource(award.awardSource || '');
      setAwardDescription(award.awardDescription || '');
      setCategoryId(award.categoryId);
      if (award.mediaPath) {
        setPreviewUrl(`http://localhost:3002${award.mediaPath}`);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setAwardYear(undefined);
      setAwardMonth(undefined);
      setAwardTitle('');
      setAwardName('');
      setAwardEngName('');
      setAwardSource('');
      setAwardDescription('');
      setSelectedFile(null);
      setCategoryId(undefined);
      setPreviewUrl(null);
    }
  }, [award, isEditMode, open]);


  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardYear || !awardMonth || !categoryId) {
      toast.error('請填寫年份、月份和分類');
      return;
    }

    let mediaPath = isEditMode ? award.mediaPath : null;

    if (selectedFile) {
      const formData = new FormData();
      formData.append('image', selectedFile);

      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('圖片上傳失敗');
        }
        const uploadData = await uploadRes.json();
        mediaPath = uploadData.filePath;
      } catch (error) {
        toast.error((error as Error).message);
        return;
      }
    }

    const awardData = {
      categoryId,
      awardYear,
      awardMonth,
      awardTitle,
      awardName,
      awardEngName,
      awardSource,
      awardDescription,
      mediaPath,
    };

    const url = isEditMode ? `/api/awards/${award.awardId}` : '/api/awards';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(awardData),
      });

      if (!res.ok) {
        throw new Error(isEditMode ? '更新獎項失敗' : '新增獎項失敗');
      }

      toast.success(isEditMode ? '獎項更新成功！' : '獎項新增成功！');
      if (isEditMode) {
        onAwardUpdated();
      } else {
        onAwardAdded();
      }
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message);
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditMode ? (
          <Button variant="outline" size="sm" className="mr-2">編輯</Button>
        ) : (
          <Button>新增獎項</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[825px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '編輯獎項' : '新增獎項'}</DialogTitle>
          <hr className="my-2" />
        </DialogHeader>
        <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
          <div className="space-y-6">
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Time & Category</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="date-year">Date</Label>
                   <Select value={awardYear ? String(awardYear) : undefined} onValueChange={(value) => setAwardYear(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="年" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                    <Label htmlFor="date-month">Month</Label>
                    <Select value={awardMonth ? String(awardMonth) : undefined} onValueChange={(value) => setAwardMonth(parseInt(value))}>
                        <SelectTrigger>
                        <SelectValue placeholder="月" />
                        </SelectTrigger>
                        <SelectContent>
                        {months.map(month => <SelectItem key={month} value={String(month)}>{month}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryId ? String(categoryId) : undefined} onValueChange={(value) => setCategoryId(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇分類" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => <SelectItem key={cat.categoryId} value={String(cat.categoryId)}>{cat.categoryName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Image</h3>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer h-48 flex items-center justify-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept="image/*"
                />
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2 text-gray-500">
                      <Upload className="w-8 h-8" />
                      <span>Upload</span>
                  </div>
                )}
              </div>
               {selectedFile && !previewUrl && <p className="text-sm mt-2">{selectedFile.name}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Current Title</Label>
              <Input id="title" placeholder="Award title..." value={awardTitle} onChange={e => setAwardTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="awardName">Award Name</Label>
              <Input id="awardName" placeholder="Award name..." value={awardName} onChange={e => setAwardName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="awardEngName">Award Eng Name</Label>
              <Input id="awardEngName" placeholder="Award Eng name..." value={awardEngName} onChange={e => setAwardEngName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="awardSource">Award Source</Label>
              <Input id="awardSource" placeholder="Award source..." value={awardSource} onChange={e => setAwardSource(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="description">Current Description</Label>
              <Textarea id="description" placeholder="Award description..." rows={8} value={awardDescription} onChange={e => setAwardDescription(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button type="submit" className="w-full bg-gray-800 text-white hover:bg-gray-700">Save</Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SortableAwardRow({ award, categories, fetchAwards }: { award: Award, categories: Category[], fetchAwards: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: award.awardId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = async (awardId: number) => {
    if (!confirm('您確定要刪除這個獎項嗎？')) {
      return;
    }

    try {
      const res = await fetch(`/api/awards/${awardId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('刪除獎項失敗');
      }

      toast.success('獎項刪除成功！');
      fetchAwards(); // Refetch awards to update the list
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message);
    }
  };

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes}>
      <TableCell>
        <div {...listeners} style={{ cursor: 'grab' }}>
            <GripVertical />
        </div>
      </TableCell>
      <TableCell>{award.awardYear}</TableCell>
      <TableCell>{award.awardMonth}</TableCell>
      <TableCell>{award.awardTitle}</TableCell>
      <TableCell>{award.awardName}</TableCell>
      <TableCell>
        <AwardDialog
          award={award}
          categories={categories}
          onAwardAdded={fetchAwards}
          onAwardUpdated={fetchAwards}
        />
        <Button variant="destructive" size="sm" onClick={() => handleDelete(award.awardId)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}


export default function AwardsPage() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState('');
  // 為每個分類維護獨立的排序狀態
  const [dateSortDirections, setDateSortDirections] = useState<Record<string, 'desc' | 'asc'>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchAwards = useCallback(async () => {
    try {
      const res = await fetch('/api/awards');
      if (!res.ok) throw new Error('Network response was not ok');
      let data: Award[] = await res.json();
      data = data.sort((a, b) => a.order - b.order);
      setAwards(data);
    } catch (error) {
      console.error('Failed to fetch awards:', error);
      toast.error('無法讀取獎項資料');
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
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
  }, [activeTab]);

  useEffect(() => {
    fetchAwards();
    fetchCategories();
  }, [fetchAwards, fetchCategories]);
  
  const filteredAwards = useMemo(
    () => awards.filter(award => award.category?.categoryName === activeTab).sort((a,b) => a.order - b.order),
    [awards, activeTab]
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // 只對當前分類的獎項進行排序
    const currentCategoryAwards = filteredAwards;
    const oldIndex = currentCategoryAwards.findIndex((a) => a.awardId === active.id);
    const newIndex = currentCategoryAwards.findIndex((a) => a.awardId === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // 重新排序當前分類的獎項
    const reorderedCategoryAwards = arrayMove(currentCategoryAwards, oldIndex, newIndex);
    
    // 重新分配 order 值（只針對當前分類）
    const updatedCategoryAwards = reorderedCategoryAwards.map((award, index) => ({
      ...award,
      order: index,
    }));

    // 更新全部 awards 陣列，保持其他分類不變
    const updatedAllAwards = awards.map(award => {
      const updatedAward = updatedCategoryAwards.find(a => a.awardId === award.awardId);
      return updatedAward || award;
    });

    // 立即更新本地狀態
    setAwards(updatedAllAwards);
    
    // 重置日期排序狀態，因為用戶手動排序了
    setDateSortDirections({ ...dateSortDirections, [activeTab]: 'desc' });

    // 只更新當前分類的獎項到後端
    const awardsToUpdate = updatedCategoryAwards.map(({ awardId, order }) => ({
      awardId,
      order,
    }));

    try {
      const res = await fetch('/api/awards/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ awards: awardsToUpdate }),
      });

      if (!res.ok) {
        throw new Error('儲存排序失敗');
      }
      toast.success('獎項排序已儲存');
    } catch (error) {
      console.error(error);
      toast.error('儲存排序失敗，正在還原...');
      // 如果失敗，重新載入資料
      fetchAwards();
    }
  }

  const sortAwardsByDate = async () => {
    const newDirection = dateSortDirections[activeTab] === 'desc' ? 'asc' : 'desc';

    // 只對當前分類的獎項進行日期排序
    const currentCategoryAwards = filteredAwards;
    const sorted = [...currentCategoryAwards].sort((a, b) => {
      const dateA = a.awardYear * 100 + a.awardMonth;
      const dateB = b.awardYear * 100 + b.awardMonth;
      if (newDirection === 'asc') {
        return dateA - dateB;
      }
      return dateB - dateA;
    });

    // 重新分配 order 值（只針對當前分類）
    const updatedCategoryAwards = sorted.map((award, index) => ({
      ...award,
      order: index,
    }));

    // 更新全部 awards 陣列，保持其他分類不變
    const updatedAllAwards = awards.map(award => {
      const updatedAward = updatedCategoryAwards.find(a => a.awardId === award.awardId);
      return updatedAward || award;
    });

    // 立即更新本地狀態
    setAwards(updatedAllAwards);

    // 只更新當前分類的獎項到後端
    const awardsToUpdate = updatedCategoryAwards.map(({ awardId, order }) => ({
      awardId,
      order,
    }));

    try {
      const res = await fetch('/api/awards/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ awards: awardsToUpdate }),
      });

      if (!res.ok) {
        throw new Error('儲存排序失敗');
      }
      toast.success('獎項排序已儲存');
      setDateSortDirections({ ...dateSortDirections, [activeTab]: newDirection });
    } catch (error) {
      console.error(error);
      toast.error('儲存排序失敗，正在還原...');
      // 如果失敗，重新載入資料
      fetchAwards();
    }
  };

  return (
    <>
      <Toaster />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">獎項管理</h1>
        <AwardDialog categories={categories} onAwardAdded={fetchAwards} onAwardUpdated={fetchAwards} />
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {categories.map((cat) => (
            <TabsTrigger key={cat.categoryId} value={cat.categoryName}>
              {cat.categoryName}
            </TabsTrigger>
          ))}
        </TabsList>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredAwards.map(a => a.awardId)}
            strategy={verticalListSortingStrategy}
          >
            {categories.map((cat) => (
              <TabsContent key={cat.categoryId} value={cat.categoryName}>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ width: '50px' }}></TableHead>
                        <TableHead>
                          <Button variant="ghost" onClick={sortAwardsByDate} className="px-2 py-1">
                            年度
                            {dateSortDirections[cat.categoryName] === 'asc' 
                              ? <ArrowUp className="inline-block ml-2 h-4 w-4" /> 
                              : <ArrowDown className="inline-block ml-2 h-4 w-4" />
                            }
                          </Button>
                        </TableHead>
                        <TableHead>月份</TableHead>
                        <TableHead>獎項標題</TableHead>
                        <TableHead>獎項名稱</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAwards.length > 0 ? (
                        filteredAwards.map((award) => (
                          <SortableAwardRow key={award.awardId} award={award} categories={categories} fetchAwards={fetchAwards} />
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            這個分類中沒有獎項資料。
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </SortableContext>
        </DndContext>
      </Tabs>
    </>
  );
} 