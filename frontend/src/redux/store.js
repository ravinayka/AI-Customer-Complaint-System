import { configureStore } from '@reduxjs/toolkit';
import complaintsReducer from './complaintsSlice';
import settingsReducer from './settingsSlice';
import reportsReducer from './reportsSlice';
import notificationsReducer from './notificationsSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    complaints: complaintsReducer,
    settings: settingsReducer,
    reports: reportsReducer,
    notifications: notificationsReducer,
    auth: authReducer,
  },
});


