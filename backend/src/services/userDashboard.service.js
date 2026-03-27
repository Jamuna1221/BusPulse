import * as repo from '../repositories/userDashboard.repository.js';

export const getSavedPlacesService = async (userId) => {
  const { rows } = await repo.getSavedPlaces(userId);
  return rows;
};

export const addSavedPlaceService = async (userId, data) => {
  const { rows } = await repo.upsertSavedPlace(userId, data);
  return rows[0];
};

export const updateSavedPlaceService = async (id, userId, data) => {
  const { rows } = await repo.updateSavedPlace(id, userId, data);
  if (!rows.length) throw Object.assign(new Error('Place not found or not yours.'), { status: 404 });
  return rows[0];
};

export const deleteSavedPlaceService = async (id, userId) => {
  await repo.deleteSavedPlace(id, userId);
};

export const getActivityService = async (userId) => {
  const { rows } = await repo.getActivity(userId, 50);
  return rows;
};

export const logSearchService = async (userId, details) => {
  await repo.logSearch(userId, details);
};
