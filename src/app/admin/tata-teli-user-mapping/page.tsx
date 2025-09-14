// src/components/admin/TataTeliMappings.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Users,
  AlertTriangle,
  Phone,
} from "lucide-react";
import {
  useGetUserMappingsQuery,
  useCreateUserMappingMutation,
} from "@/redux/slices/tataTeliApi";
import { useGetUserLeadStatsQuery } from "@/redux/slices/leadsApi"; // ✅ CHANGED: Use this instead
import { useNotifications } from "@/components/common/NotificationSystem";
import {
  createMappingService,
  CreateMappingForm,
} from "@/services/tataTeliMapping/tataTeliMappingService";

const TataTeliMappings: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateMappingForm>({
    crm_user_id: "",
    tata_email: "",
    auto_create_agent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { showSuccess, showError } = useNotifications();

  // API hooks
  const {
    data: mappings,
    isLoading: mappingsLoading,
    error: mappingsError,
    refetch: refetchMappings,
  } = useGetUserMappingsQuery();

  const { data: users } = useGetUserLeadStatsQuery(); // ✅ CHANGED: Use this API

  const [createMapping, { isLoading: isCreating }] =
    useCreateUserMappingMutation();

  const handleInputChange = (
    field: keyof CreateMappingForm,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleRefresh = () => {
    refetchMappings();
  };

  const handleCreateMapping = async () => {
    await createMappingService(formData, {
      createMutation: createMapping,
      showSuccess,
      showError,
      onSuccess: () => {
        setIsCreateModalOpen(false);
        setFormData({
          crm_user_id: "",
          tata_email: "",
          auto_create_agent: false,
        });
        setErrors({});
      },
      onValidationError: (validationErrors) => {
        setErrors(validationErrors);
      },
    });
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case "synced":
        return (
          <Badge variant={"success-light"}>
            <CheckCircle className="w-3 h-3 mr-1" />
            Synced
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Pending
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  const getCanCallBadge = (canCall: boolean) => {
    return canCall ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <Phone className="w-3 h-3 mr-1" />
        Enabled
      </Badge>
    ) : (
      <Badge variant="secondary">
        <XCircle className="w-3 h-3 mr-1" />
        Disabled
      </Badge>
    );
  };

  if (mappingsError) {
    return (
      <div className="p-6">
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load user mappings. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="mr-3 h-6 w-6" />
            Tata Teli User Mappings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage user mappings between LeadG CRM and Tata Teli calling system
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={mappingsLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                mappingsLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Mapping
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create User Mapping</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {/* User Selection */}
                <div className="space-y-2">
                  <Label htmlFor="user">CRM User *</Label>
                  <Select
                    value={formData.crm_user_id}
                    onValueChange={(value) =>
                      handleInputChange("crm_user_id", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.user_stats?.map((user, index) => (
                        <SelectItem
                          key={user.user_id || `user-${index}`}
                          value={user.user_id}
                        >
                          <div className="flex gap-2">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-sm text-gray-500">
                              ({user.email})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.crm_user_id && (
                    <p className="text-sm text-red-600">{errors.crm_user_id}</p>
                  )}
                </div>

                {/* Tata Email */}
                <div className="space-y-2">
                  <Label htmlFor="tata_email">Tata Teli Email *</Label>
                  <Input
                    id="tata_email"
                    type="email"
                    placeholder="user@example.com"
                    value={formData.tata_email}
                    onChange={(e) =>
                      handleInputChange("tata_email", e.target.value)
                    }
                  />
                  {errors.tata_email && (
                    <p className="text-sm text-red-600">{errors.tata_email}</p>
                  )}
                </div>

                {/* Auto Create Agent */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto_create_agent"
                    checked={formData.auto_create_agent}
                    disabled
                    onCheckedChange={(checked) =>
                      handleInputChange("auto_create_agent", checked)
                    }
                  />
                  <Label htmlFor="auto_create_agent" className="text-sm">
                    Auto-create Tata Teli agent if not exists
                  </Label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateMapping} disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Mapping"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mappings Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Mappings ({mappings?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {mappingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading mappings...</span>
            </div>
          ) : mappings && mappings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CRM User</TableHead>
                    <TableHead>Tata Email</TableHead>
                    <TableHead>Agent ID</TableHead>
                    <TableHead>Sync Status</TableHead>
                    <TableHead>Can Call</TableHead>
                    <TableHead>Last Synced</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((mapping, index) => (
                    <TableRow key={mapping.id || `mapping-${index}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {mapping.crm_user_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {mapping.crm_user_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{mapping.tata_email}</TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {mapping.tata_agent_id}
                        </code>
                      </TableCell>
                      <TableCell>
                        {getSyncStatusBadge(mapping.sync_status)}
                      </TableCell>
                      <TableCell>
                        {getCanCallBadge(mapping.can_make_calls)}
                      </TableCell>
                      <TableCell>
                        {mapping.last_synced
                          ? new Date(mapping.last_synced).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No user mappings
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first user mapping.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TataTeliMappings;
