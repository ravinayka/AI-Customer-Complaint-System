import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getSettings, updateSettings, changePassword, logoutAllDevices } from '../services/settingsApi';

export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getSettings();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveSettings = createAsyncThunk(
  'settings/saveSettings',
  async (settingsData, { rejectWithValue }) => {
    try {
      const data = await updateSettings(settingsData);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePassword = createAsyncThunk(
  'settings/updatePassword',
  async ({ oldPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await changePassword(oldPassword, newPassword);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutAll = createAsyncThunk(
  'settings/logoutAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await logoutAllDevices();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  data: {
    name: 'Ravi M',
    email: 'ravi.m@facility.org',
    role: 'Administrator',
    profile_pic: null,
    groq_api_key: '',
    model_selection: 'llama-3.3-70b-versatile',
    temperature: 0.1,
    max_tokens: 1024,
    theme_mode: 'dark',
    email_notifications: true,
    desktop_notifications: true,
    critical_alerts: true,
    two_factor_enabled: false,
    language: 'en'
  },
  loading: false,
  saving: false,
  error: null,
  successMessage: null
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    updateLocalThemeMode: (state, action) => {
      state.data.theme_mode = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch settings
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = { ...state.data, ...action.payload };
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Save settings
      .addCase(saveSettings.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.saving = false;
        state.data = action.payload;
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  }
});

export const { clearStatus, updateLocalThemeMode } = settingsSlice.actions;
export default settingsSlice.reducer;
