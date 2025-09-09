// src/redux/slices/cvExtractionSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CVExtraction } from "@/models/types/cvExtraction";

interface CVExtractionState {
  // UI states
  selectedExtractions: string[];
  isUploadModalOpen: boolean;
  isConvertModalOpen: boolean;

  // Current operation tracking
  currentExtraction: CVExtraction | null;

  // Filters
  filters: {
    status: string;
    user_filter: string;
    search: string;
  };

  // Loading states
  uploading: boolean;
  converting: boolean;

  // Error states
  uploadError: string | null;
  convertError: string | null;
}

const initialState: CVExtractionState = {
  selectedExtractions: [],
  isUploadModalOpen: false,
  isConvertModalOpen: false,
  currentExtraction: null,
  filters: {
    status: "",
    user_filter: "all",
    search: "",
  },
  uploading: false,
  converting: false,
  uploadError: null,
  convertError: null,
};

const cvExtractionSlice = createSlice({
  name: "cvExtraction",
  initialState,
  reducers: {
    // Selection management
    setSelectedExtractions: (state, action: PayloadAction<string[]>) => {
      state.selectedExtractions = action.payload;
    },

    toggleExtractionSelection: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.selectedExtractions.includes(id)) {
        state.selectedExtractions = state.selectedExtractions.filter(
          (item) => item !== id
        );
      } else {
        state.selectedExtractions.push(id);
      }
    },

    clearSelection: (state) => {
      state.selectedExtractions = [];
    },

    // Modal management
    openUploadModal: (state) => {
      state.isUploadModalOpen = true;
    },

    closeUploadModal: (state) => {
      state.isUploadModalOpen = false;
      state.uploadError = null;
    },

    openConvertModal: (state, action: PayloadAction<CVExtraction>) => {
      state.isConvertModalOpen = true;
      state.currentExtraction = action.payload;
    },

    closeConvertModal: (state) => {
      state.isConvertModalOpen = false;
      state.currentExtraction = null;
      state.convertError = null;
    },

    // Filter management
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.filters.status = action.payload;
    },

    setUserFilter: (state, action: PayloadAction<string>) => {
      state.filters.user_filter = action.payload;
    },

    setSearchFilter: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },

    clearFilters: (state) => {
      state.filters = {
        status: "",
        user_filter: "all",
        search: "",
      };
    },

    // Loading states
    setUploading: (state, action: PayloadAction<boolean>) => {
      state.uploading = action.payload;
    },

    setConverting: (state, action: PayloadAction<boolean>) => {
      state.converting = action.payload;
    },

    // Error handling
    setUploadError: (state, action: PayloadAction<string | null>) => {
      state.uploadError = action.payload;
    },

    setConvertError: (state, action: PayloadAction<string | null>) => {
      state.convertError = action.payload;
    },

    clearErrors: (state) => {
      state.uploadError = null;
      state.convertError = null;
    },

    // Reset state
    resetCVExtractionState: () => {
      return initialState;
    },
  },
});

// Export actions
export const {
  setSelectedExtractions,
  toggleExtractionSelection,
  clearSelection,
  openUploadModal,
  closeUploadModal,
  openConvertModal,
  closeConvertModal,
  setStatusFilter,
  setUserFilter,
  setSearchFilter,
  clearFilters,
  setUploading,
  setConverting,
  setUploadError,
  setConvertError,
  clearErrors,
  resetCVExtractionState,
} = cvExtractionSlice.actions;

// Export reducer
export default cvExtractionSlice.reducer;
