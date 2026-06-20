const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  createPairing,
  getPairing,
  getPublishedPairings,
  getAllPairings,
  updatePairing,
  deletePairing,
} = require('../db/queries');

const router = express.Router();

// Public routes
router.get('/summary', async (req, res, next) => {
  try {
    const pairings = await getPublishedPairings();
    const summary = pairings.map((p) => ({
      id: p.id,
      name: p.name,
      is_published: p.is_published,
      played: p.played === 1,
      created_at: p.created_at,
    }));
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const pairings = await getPublishedPairings();
    const parsed = pairings.map((p) => ({
      id: p.id,
      name: p.name,
      rounds: JSON.parse(p.rounds),
      winner_selections: JSON.parse(p.winner_selections),
      created_at: p.created_at,
      updated_at: p.updated_at,
      is_published: p.is_published,
      played: p.played === 1,
    }));
    res.json(parsed);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pairing = await getPairing(req.params.id);
    if (!pairing) {
      return res.status(404).json({ message: 'Pairing not found' });
    }
    if (!pairing.is_published) {
      return res.status(403).json({ message: 'This pairing is not published' });
    }

    res.json({
      id: pairing.id,
      name: pairing.name,
      rounds: JSON.parse(pairing.rounds),
      winner_selections: JSON.parse(pairing.winner_selections),
      created_at: pairing.created_at,
      updated_at: pairing.updated_at,
      is_published: pairing.is_published,
      played: pairing.played === 1,
    });
  } catch (error) {
    next(error);
  }
});

// Admin routes
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { name, rounds, winner_selections, is_published } = req.body;

    if (!name || !rounds) {
      return res.status(400).json({ message: 'Name and rounds are required' });
    }

    const pairing = await createPairing(
      name,
      rounds,
      winner_selections || [],
      is_published ? 1 : 0
    );

    res.status(201).json({
      id: pairing.id,
      name: pairing.name,
      rounds: JSON.parse(pairing.rounds),
      winner_selections: JSON.parse(pairing.winner_selections),
      created_at: pairing.created_at,
      updated_at: pairing.updated_at,
      is_published: pairing.is_published,
      played: pairing.played === 1,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const pairing = await getPairing(req.params.id);
    if (!pairing) {
      return res.status(404).json({ message: 'Pairing not found' });
    }

    const updated = await updatePairing(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Pairing not found' });
    }

    res.json({
      id: updated.id,
      name: updated.name,
      rounds: JSON.parse(updated.rounds),
      winner_selections: JSON.parse(updated.winner_selections),
      created_at: updated.created_at,
      updated_at: updated.updated_at,
      is_published: updated.is_published,
      played: updated.played === 1,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const pairing = await getPairing(req.params.id);
    if (!pairing) {
      return res.status(404).json({ message: 'Pairing not found' });
    }

    const deleted = await deletePairing(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Pairing not found' });
    }

    res.json({ message: 'Pairing deleted' });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/publish', authenticateToken, async (req, res, next) => {
  try {
    const pairing = await getPairing(req.params.id);
    if (!pairing) {
      return res.status(404).json({ message: 'Pairing not found' });
    }

    const updated = await updatePairing(req.params.id, {
      is_published: pairing.is_published ? 0 : 1,
    });

    res.json({
      id: updated.id,
      name: updated.name,
      rounds: JSON.parse(updated.rounds),
      winner_selections: JSON.parse(updated.winner_selections),
      created_at: updated.created_at,
      updated_at: updated.updated_at,
      is_published: updated.is_published,
      played: updated.played === 1,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
