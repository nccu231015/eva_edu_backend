import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all awards
router.get('/', async (req, res) => {
  const awards = await prisma.award.findMany({
    include: {
      category: true,
    },
  });
  res.json(awards);
});

// CREATE a new award
router.post('/', async (req, res) => {
  const { categoryId, awardYear, awardMonth, awardTitle, awardName, awardEngName, awardSource, awardDescription, mediaPath } = req.body;
  
  // 獲取同分類的所有獎項，按時間排序
  const existingAwards = await prisma.award.findMany({
    where: { categoryId },
    orderBy: [
      { awardYear: 'desc' },
      { awardMonth: 'desc' }
    ]
  });

  // 計算新獎項應該插入的位置
  let newOrder = 0;
  const newAwardDate = awardYear * 100 + awardMonth;
  
  for (let i = 0; i < existingAwards.length; i++) {
    const existingDate = existingAwards[i].awardYear * 100 + existingAwards[i].awardMonth;
    if (newAwardDate >= existingDate) {
      newOrder = i;
      break;
    }
    newOrder = i + 1;
  }

  // 更新後續獎項的 order
  await prisma.award.updateMany({
    where: {
      categoryId,
      order: { gte: newOrder }
    },
    data: {
      order: { increment: 1 }
    }
  });

  const newAward = await prisma.award.create({
    data: {
      categoryId,
      awardYear,
      awardMonth,
      awardTitle,
      awardName,
      awardEngName,
      awardSource,
      awardDescription,
      mediaPath,
      order: newOrder,
    },
  });
  res.status(201).json(newAward);
});

// UPDATE an award
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { categoryId, awardYear, awardMonth, awardTitle, awardName, awardEngName, awardSource, awardDescription, mediaPath } = req.body;
  const updatedAward = await prisma.award.update({
    where: { awardId: parseInt(id) },
    data: {
      categoryId,
      awardYear,
      awardMonth,
      awardTitle,
      awardName,
      awardEngName,
      awardSource,
      awardDescription,
      mediaPath,
    },
  });
  res.json(updatedAward);
});

// REORDER awards
router.patch('/reorder', async (req, res) => {
    const { awards } = req.body as { awards: { awardId: number; order: number }[] };

    try {
        await prisma.$transaction(
            awards.map(award => 
                prisma.award.update({
                    where: { awardId: award.awardId },
                    data: { order: award.order },
                })
            )
        );
        res.status(200).json({ message: 'Awards reordered successfully' });
    } catch (error) {
        console.error('Failed to reorder awards:', error);
        res.status(500).json({ error: 'Failed to reorder awards' });
    }
});


// DELETE an award
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  // 先獲取要刪除的獎項資訊
  const awardToDelete = await prisma.award.findUnique({
    where: { awardId: parseInt(id) }
  });

  if (!awardToDelete) {
    return res.status(404).json({ error: 'Award not found' });
  }

  // 刪除獎項
  await prisma.award.delete({
    where: { awardId: parseInt(id) },
  });

  // 更新後續獎項的 order（減1）
  await prisma.award.updateMany({
    where: {
      categoryId: awardToDelete.categoryId,
      order: { gt: awardToDelete.order }
    },
    data: {
      order: { decrement: 1 }
    }
  });

  res.status(204).send();
});

export default router; 