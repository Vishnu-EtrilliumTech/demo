import { createSlice } from "@reduxjs/toolkit";
import { PURGE } from "redux-persist";

interface EcourtsSearchState {
  usedCount: number;
  lastResetMonth: string; // "YYYY-MM"
}

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const initialState: EcourtsSearchState = {
  usedCount: 0,
  lastResetMonth: getCurrentMonth(),
};

export const ecourtsSearchSlice = createSlice({
  name: "ecourtsSearch",
  initialState,
  reducers: {
    recordEcourtsSearch: (state) => {
      const currentMonth = getCurrentMonth();
      if (state.lastResetMonth !== currentMonth) {
        state.usedCount = 1;
        state.lastResetMonth = currentMonth;
      } else {
        state.usedCount += 1;
      }
    },
    checkMonthReset: (state) => {
      const currentMonth = getCurrentMonth();
      if (state.lastResetMonth !== currentMonth) {
        state.usedCount = 0;
        state.lastResetMonth = currentMonth;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(PURGE, () => initialState);
  },
});

export const { recordEcourtsSearch, checkMonthReset } = ecourtsSearchSlice.actions;
export default ecourtsSearchSlice.reducer;
