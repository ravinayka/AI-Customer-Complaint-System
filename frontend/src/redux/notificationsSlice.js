import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../services/notificationsApi';

export const fetchNotificationsThunk = createAsyncThunk(
  'notifications/fetchNotifications',
  async (filters, { rejectWithValue }) => {
    try {
      const data = await getNotifications(filters);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAsReadThunk = createAsyncThunk(
  'notifications/markAsRead',
  async (id, { rejectWithValue }) => {
    try {
      const data = await markNotificationAsRead(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAllReadThunk = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      const data = await markAllNotificationsAsRead();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteNotificationThunk = createAsyncThunk(
  'notifications/deleteNotification',
  async (id, { rejectWithValue }) => {
    try {
      await deleteNotification(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    list: [],
    loading: false,
    error: null,
    unreadCount: 0,
  },
  reducers: {
    addNotificationFromSocket: (state, action) => {
      // Avoid duplicates
      if (!state.list.some(n => n.id === action.payload.id)) {
        state.list = [action.payload, ...state.list];
        if (!action.payload.is_read) {
          state.unreadCount += 1;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchNotificationsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        state.unreadCount = action.payload.filter(n => !n.is_read).length;
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark as read
      .addCase(markAsReadThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        state.list = state.list.map(n => n.id === updated.id ? updated : n);
        state.unreadCount = state.list.filter(n => !n.is_read).length;
      })
      // Mark all read
      .addCase(markAllReadThunk.fulfilled, (state) => {
        state.list = state.list.map(n => ({ ...n, is_read: true }));
        state.unreadCount = 0;
      })
      // Delete
      .addCase(deleteNotificationThunk.fulfilled, (state, action) => {
        const id = action.payload;
        state.list = state.list.filter(n => n.id !== id);
        state.unreadCount = state.list.filter(n => !n.is_read).length;
      });
  }
});

export const { addNotificationFromSocket } = notificationsSlice.actions;
export default notificationsSlice.reducer;
