import {
  getSavedPlacesService,
  addSavedPlaceService,
  updateSavedPlaceService,
  deleteSavedPlaceService,
  getActivityService,
} from '../services/userDashboard.service.js';
import pool from '../config/db.js';

// GET /api/user/saved-places
export const getSavedPlaces = async (req, res) => {
  try {
    const places = await getSavedPlacesService(req.user.id);
    res.json({ success: true, data: places });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// POST /api/user/saved-places
export const addSavedPlace = async (req, res) => {
  try {
    const place = await addSavedPlaceService(req.user.id, req.body);
    res.status(201).json({ success: true, data: place });
  } catch (e) { res.status(e.status || 500).json({ success: false, message: e.message }); }
};

// PUT /api/user/saved-places/:id
export const updateSavedPlace = async (req, res) => {
  try {
    const place = await updateSavedPlaceService(req.params.id, req.user.id, req.body);
    res.json({ success: true, data: place });
  } catch (e) { res.status(e.status || 500).json({ success: false, message: e.message }); }
};

// DELETE /api/user/saved-places/:id
export const deleteSavedPlace = async (req, res) => {
  try {
    await deleteSavedPlaceService(req.params.id, req.user.id);
    res.json({ success: true, message: 'Deleted.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/user/activity
export const getActivity = async (req, res) => {
  try {
    const activity = await getActivityService(req.user.id);
    res.json({ success: true, data: activity });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// GET /api/user/profile
export const getUserProfile = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, created_at, last_seen FROM users WHERE id=$1',
      [req.user.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// PUT /api/user/profile
export const updateUserProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const { rows } = await pool.query(
      'UPDATE users SET name=$1, updated_at=NOW() WHERE id=$2 RETURNING id, name, email',
      [name, req.user.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
