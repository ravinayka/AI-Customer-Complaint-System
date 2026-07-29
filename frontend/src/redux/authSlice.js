import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials) => {
    return {
      name: credentials.username || 'Dr. Jane Doe',
      email: 'j.doe@clinic.org',
      role: 'Administrator'
    };
  }
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (details) => {
    return {
      name: details.name || 'Dr. Jane Doe',
      email: details.email || 'j.doe@clinic.org',
      role: 'Administrator'
    };
  }
);

// Load persisted user from localStorage
const storedUser = localStorage.getItem('user');
let parsedUser = null;
try {
  if (storedUser) parsedUser = JSON.parse(storedUser);
} catch (e) {
  console.error("Failed to parse stored user", e);
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    currentUser: {
      name: 'Dr. Jane Doe',
      email: 'j.doe@clinic.org',
      role: 'Administrator'
    },
    isAuthenticated: true,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      // Do nothing, auth is disabled/removed
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
