// src/components/calling/TataTeliModal.tsx
"use client";

import React, { useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Shield, History } from "lucide-react";
import type { RootState } from "@/redux/store";
import {
  closeModal,
  setActiveTab,
  setValidationLoading,
  setValidationResult,
  setValidationError,
} from "@/redux/slices/tataTeliSlice";
import { useValidateCallMutation } from "@/redux/slices/tataTeliApi";
import { useGetLeadDetailsQuery } from "@/redux/slices/leadsApi";
import CallValidation from "./CallValidation";
import CallControls from "./CallControls";
import CallHistory from "./CallHistory";
import { useAppDispatch } from "@/redux/hooks";

// Define interface for error handling
interface ValidationError {
  message?: string;
  data?: {
    detail?: string;
  };
}

const TataTeliModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isModalOpen, activeTab, currentLeadId, validation } = useSelector(
    (state: RootState) => state.tataTeli
  );

  // Get lead details
  const { data: leadDetails } = useGetLeadDetailsQuery(currentLeadId || "", {
    skip: !currentLeadId,
  });

  // Validation mutation
  const [validateCall] = useValidateCallMutation();

  const handleClose = () => {
    dispatch(closeModal());
  };

  const handleTabChange = (value: string) => {
    dispatch(setActiveTab(value as "validate" | "call" | "history"));
  };

  // Memoize performValidation to prevent unnecessary re-renders
  const performValidation = useCallback(async () => {
    if (!currentLeadId) return;

    dispatch(setValidationLoading(true));

    try {
      const result = await validateCall({ lead_id: currentLeadId }).unwrap();
      dispatch(setValidationResult(result));
    } catch (error: unknown) {
      const validationError = error as ValidationError;
      const errorMessage =
        validationError?.message ||
        validationError?.data?.detail ||
        "Failed to validate call";
      dispatch(setValidationError(errorMessage));
    }
  }, [currentLeadId, dispatch, validateCall]);

  // Auto-trigger validation when modal opens - with all dependencies
  useEffect(() => {
    if (
      isModalOpen &&
      currentLeadId &&
      !validation.isValidating &&
      validation.canCall === null
    ) {
      performValidation();
    }
  }, [
    isModalOpen,
    currentLeadId,
    validation.isValidating,
    validation.canCall,
    performValidation,
  ]);

  if (!isModalOpen || !currentLeadId || !leadDetails) {
    return null;
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center">
            <Phone className="mr-2 h-5 w-5 text-blue-600" />
            Call Communication
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="validate" className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              Validate
            </TabsTrigger>
            <TabsTrigger value="call" className="flex items-center">
              <Phone className="mr-2 h-4 w-4" />
              Call
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center">
              <History className="mr-2 h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="validate" className="mt-6">
            <CallValidation
              leadDetails={leadDetails}
              validation={validation}
              onRetryValidation={performValidation}
            />
          </TabsContent>

          <TabsContent value="call" className="mt-6">
            <CallControls
              leadDetails={leadDetails}
              validation={validation}
              // refetch={refetch}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <CallHistory leadDetails={leadDetails} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TataTeliModal;
