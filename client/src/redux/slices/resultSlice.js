import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: null,
  loading: false,
  query: null,
  visualType: 0,
};

export const resultSlice = createSlice({
  name: 'result',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setQuery: (state, action) => {
      state.query = action.payload;
    },
    setResultData: (state, action) => {
      state.data = action.payload;
    },
    clearResult: (state) => {
      state.data = null;
    },
    setVisualType: (state, action) => {
      state.visualType = action.payload;
    },
    resetResult: () => initialState,
  },
});

export const {
  setLoading,
  setQuery,
  setResultData,
  setVisualType,
  clearResult,
  resetResult,
} = resultSlice.actions;

export default resultSlice.reducer;
