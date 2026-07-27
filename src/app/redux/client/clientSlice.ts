
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ClientState {
  data: {
    id: string;
    fullName: string;
    emailId: string;
    enabled: boolean;
    gender: string;
    lastLoginDate: string;
    phoneNumber: string;
    registeredDate: string;
    systemUserId: string;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: ClientState = {
  data: {
    id: '',
    fullName: '',
    emailId: '',
    enabled: false,
    gender: '',
    lastLoginDate: '',
    phoneNumber: '',
    registeredDate: '',
    systemUserId: '',
  },
  loading: false,
  error: null,
};

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    fetchClientStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchClientSuccess(state, action: PayloadAction<ClientState['data']>) {
      console.log('Reducer - action payload:', action.payload);  
      state.data = action.payload;
      state.loading = false;
    },
    fetchClientFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    clearClientData(state) {
      state.data = null;
    },
  },
});

export const {
  fetchClientStart,
  fetchClientSuccess,
  fetchClientFailure,
  clearClientData,
} = clientSlice.actions;

export default clientSlice.reducer;