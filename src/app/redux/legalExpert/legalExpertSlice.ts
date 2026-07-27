/* eslint-disable */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LegalExpertState {
  data: {
    id: string;
    fullName: string;
    emailId: string;
    expertTypeId: string;
    legalExpertSchedule: any | null;
    legalExpertAddresses: Array<{
      id: string;
      addressName: string;
      fullAddress: string;

    }>;
    legalExpertProfessionalDetails: {
      registrationNumber: string;
      yearsOfExperience: number;
      portfolios: string[];
     
    };
    legalExpertPersonalDetails: {
      photoBinary: string;
      aboutMe: string;
      phoneNumber: string;
     
    };
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: LegalExpertState = {
  data: {
    id: '',
    fullName: '',
    emailId: '',
    expertTypeId: '',
    legalExpertSchedule: null,
    legalExpertAddresses: [],
    legalExpertProfessionalDetails: {
      registrationNumber: '',
      yearsOfExperience: 0,
      portfolios: [],
    },
    legalExpertPersonalDetails: {
      photoBinary: '',
      aboutMe: '',
      phoneNumber: '',
    },
  },
  loading: false,
  error: null,
};

const legalExpertSlice = createSlice({
  name: 'legalExpert',
  initialState,
  reducers: {
    fetchLegalExpertStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchLegalExpertSuccess(state, action: PayloadAction<LegalExpertState['data']>) {
      console.log('Reducer - action payload:', action.payload);  
      state.data = action.payload;
      state.loading = false;
    },
    fetchLegalExpertFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    clearLegalExpertData(state) {
      state.data = null;
    },
  },
});

export const {
  fetchLegalExpertStart,
  fetchLegalExpertSuccess,
  fetchLegalExpertFailure,
  clearLegalExpertData,
} = legalExpertSlice.actions;

export default legalExpertSlice.reducer;