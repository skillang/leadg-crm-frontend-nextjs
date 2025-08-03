// src/components/calling/CallValidation.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Phone,
  User,
  AlertTriangle,
  Info,
} from "lucide-react";
import { CallValidation as CallValidationType } from "@/models/types/tatatTeli";
import { Lead } from "@/models/types/lead";

interface CallValidationProps {
  leadDetails: Lead;
  validation: CallValidationType;
  onRetryValidation: () => void;
}

const CallValidation: React.FC<CallValidationProps> = ({
  leadDetails,
  validation,
  onRetryValidation,
}) => {
  const renderValidationStatus = () => {
    if (validation.isValidating) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-lg font-medium">Validating call...</p>
            <p className="text-sm text-muted-foreground">
              Checking lead and user permissions
            </p>
          </div>
        </div>
      );
    }

    if (validation.error) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Validation Failed:</strong> {validation.error}
            <Button
              onClick={onRetryValidation}
              size="sm"
              variant="outline"
              className="ml-4 h-8"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    if (validation.canCall === true) {
      return (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Ready to Call:</strong> All validations passed successfully!
          </AlertDescription>
        </Alert>
      );
    }

    if (validation.canCall === false) {
      return (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Cannot Make Call:</strong> Some validations failed. Please
            check details below.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  const renderValidationDetails = () => {
    if (validation.canCall === null && !validation.error) {
      return null;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lead Status */}
        <Card>
          <CardContent className="space-y-3">
            <div className="text-base font-semibold flex items-center">
              <Phone className="mr-2 h-4 w-4" />
              Lead Status
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Lead Found:</span>
              <Badge variant={validation.leadFound ? "default" : "destructive"}>
                {validation.leadFound ? "Yes" : "No"}
              </Badge>
            </div>

            {validation.leadPhone && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Phone Number:
                </span>
                <span className="text-sm font-medium">
                  {validation.leadPhone}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Status */}
        <Card>
          <CardContent className="space-y-3">
            <div className=" font-semibold text-base flex items-center">
              <User className="mr-2 h-4 w-4" />
              User Status
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Can Call:</span>
              <Badge
                variant={validation.userCanCall ? "default" : "destructive"}
              >
                {validation.userCanCall ? "Yes" : "No"}
              </Badge>
            </div>

            {validation.userAgentId && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Agent ID:</span>
                <span className="text-sm font-medium">
                  {validation.userAgentId}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRecommendations = () => {
    if (
      !validation.recommendations ||
      validation.recommendations.length === 0
    ) {
      return null;
    }

    return (
      <Card>
        <CardContent className="space-y-2">
          <div className="text-base flex items-center font-semibold">
            <Info className="mr-2 h-4 w-4" />
            Recommendations
          </div>
          <ul className="space-y-2">
            {validation.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{recommendation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Lead Information */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Lead Information</div>
            {/* Retry Button */}
            {!validation.isValidating &&
              (validation.error || validation.canCall !== null) && (
                <div className="">
                  <Button
                    onClick={onRetryValidation}
                    variant="outline"
                    className="flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-validate Status
                  </Button>
                </div>
              )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-sm font-semibold">{leadDetails.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Phone Number
              </p>
              <p className="text-sm font-semibold">
                {leadDetails.phoneNumber ||
                  leadDetails.contact ||
                  "No phone number"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Status */}
      {renderValidationStatus()}

      {/* Validation Details */}
      {renderValidationDetails()}

      {/* Recommendations */}
      {renderRecommendations()}
    </div>
  );
};

export default CallValidation;
