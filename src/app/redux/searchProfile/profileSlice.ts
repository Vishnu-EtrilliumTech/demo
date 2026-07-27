/* eslint-disable */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PURGE } from "redux-persist";

interface ProfileState {
  id: string;
  name: string;
  role: string;
  experience: string;
  location: string;
  rating: number;
  reviews: string;
  fees: string;
  image: string;
  portfolios: string[];
  organizationRole: string | null;
  organizationId: string | null;
  userId: string | null;
}

const initialState: ProfileState = {
  id: "",
  name: "",
  role: "",
  experience: "",
  location: "",
  rating: 0,
  reviews: "",
  fees: "",
  image: "",
  portfolios: [],
  organizationRole: null,
  organizationId: null,
  userId: null,
};

export const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setProfileData: (state, action: PayloadAction<Partial<ProfileState>>) => {
      return { ...state, ...action.payload };
    },
    setOrganizationRole: (state, action: PayloadAction<{
      organizationRole: string;
      organizationId: string;
      userId: string;
    }>) => {
      state.organizationRole = action.payload.organizationRole;
      state.organizationId = action.payload.organizationId;
      state.userId = action.payload.userId;
    },
    clearProfileData: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(PURGE, (state) => {
      return initialState;
    });
  },
});

export const { setProfileData, setOrganizationRole, clearProfileData } = profileSlice.actions;
export default profileSlice.reducer;