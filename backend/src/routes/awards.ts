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
  
  const count = await prisma.award.count({ where: { categoryId } });

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
      order: count,
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
  await prisma.award.delete({
    where: { awardId: parseInt(id) },
  });
  res.status(204).send();
});

export default router; 