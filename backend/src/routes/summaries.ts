import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all summaries
router.get('/', async (req, res) => {
  const summaries = await prisma.summary.findMany({
    include: {
      category: true,
    },
  });
  res.json(summaries);
});

// CREATE a new summary
router.post('/', async (req, res) => {
  const { categoryId, yearStart, yearEnd, description } = req.body;
  const newSummary = await prisma.summary.create({
    data: {
      categoryId,
      yearStart,
      yearEnd,
      description,
    },
  });
  res.status(201).json(newSummary);
});

// UPDATE a summary
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { categoryId, yearStart, yearEnd, description } = req.body;
  const updatedSummary = await prisma.summary.update({
    where: { summaryId: parseInt(id) },
    data: {
      categoryId,
      yearStart,
      yearEnd,
      description,
    },
  });
  res.json(updatedSummary);
});

// DELETE a summary
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.summary.delete({
    where: { summaryId: parseInt(id) },
  });
  res.status(204).send();
});

export default router; 