import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getReportsStatistics } from '../services/reportsApi';

export const fetchReportsStatistics = createAsyncThunk(
  'reports/fetchReportsStatistics',
  async (filters, { rejectWithValue }) => {
    try {
      const data = await getReportsStatistics(filters);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  statisticsData: {
    total_complaints: 0,
    open_complaints: 0,
    closed_complaints: 0,
    critical_complaints: 0,
    avg_resolution_time: 0.0,
    trends: [],
    severity_distribution: [],
    complaint_types: [],
    product_wise: [],
    monthly: []
  },
  filters: {
    start_date: null,
    end_date: null,
    product: 'All',
    severity: 'All',
    status: 'All'
  },
  loading: false,
  error: null
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state.filters[key] = value;
    },
    resetFilters: (state) => {
      state.filters = { ...initialState.filters };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReportsStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportsStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.statisticsData = action.payload;
      })
      .addCase(fetchReportsStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setFilter, resetFilters } = reportsSlice.actions;
export default reportsSlice.reducer;
