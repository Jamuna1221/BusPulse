import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getSavedPlaces,
  addSavedPlace,
  updateSavedPlace,
  deleteSavedPlace,
  getActivity,
  logActivity,
  getUserProfile,
  updateUserProfile,
} from '../controllers/userDashboard.controller.js';

const router = express.Router();

// All routes require a valid user JWT
router.use(verifyToken);

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

router.get('/saved-places', getSavedPlaces);
router.post('/saved-places', addSavedPlace);
router.put('/saved-places/:id', updateSavedPlace);
router.delete('/saved-places/:id', deleteSavedPlace);

router.get('/activity', getActivity);
router.post('/activity/log', logActivity);

export default router;
