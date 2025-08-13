import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserX, RotateCcw, User } from "lucide-react";
import {
  useUpdateLeadMutation,
  useGetAssignableUsersWithDetailsQuery,
  usePreviewRoundRobinAssignmentQuery,
} from "@/redux/slices/leadsApi";
import MultiSelect, { SelectOption } from "@/components/common/MultiSelect";
import { useAuth } from "@/redux/hooks/useAuth";

interface AssignmentDropdownProps {
  leadId?: string;
  currentAssignment?: string;
  onAssignmentChange?: (assignment: {
    type: "unassigned" | "selective_round_robin" | "manual";
    assigned_to?: string;
    assigned_users?: string[];
  }) => void;
  disabled?: boolean;
  className?: string;
  showLabel?: boolean;
  size?: "default" | "sm" | "lg";
  mode?: "create" | "edit";
}

interface AssignmentOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  type: "unassigned" | "selective_round_robin" | "manual";
}

const LeadAssignmentDropdown: React.FC<AssignmentDropdownProps> = ({
  leadId,
  currentAssignment = "unassigned",
  onAssignmentChange,
  disabled = false,
  className = "",
  showLabel = true,
  size = "default",
  mode = "edit",
}) => {
  // RTK Query hooks
  const { isAdmin, userName, userEmail } = useAuth();
  const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();
  const { data: assignableUsersData, isLoading: isLoadingUsers } =
    useGetAssignableUsersWithDetailsQuery(undefined, {
      skip: !isAdmin,
    });
  const { data: roundRobinPreview } = usePreviewRoundRobinAssignmentQuery(
    {},
    {
      skip: !isAdmin,
    }
  );

  const [selectedOption, setSelectedOption] = useState<string>("unassigned");
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const assignableUsers = assignableUsersData?.users || [];

  // Define assignment options
  const assignmentOptions: AssignmentOption[] = isAdmin
    ? [
        {
          value: "unassigned",
          label: "Unassign Lead",
          description: "Remove assignment from this lead",
          icon: <UserX className="h-4 w-4" />,
          type: "unassigned",
        },
        {
          value: "selective_round_robin",
          label: "Selected Counselors Only",
          description: "Round robin among selected counselors",
          icon: <RotateCcw className="h-4 w-4" />,
          type: "selective_round_robin",
        },
        {
          value: "manual",
          label: "Manual Assignment",
          description: "Select specific counselor",
          icon: <User className="h-4 w-4" />,
          type: "manual",
        },
      ]
    : [
        // 🔥 NON-ADMIN: Only show manual assignment to self
        {
          value: "unassigned",
          label: "Unassign Lead",
          description: "Remove assignment from this lead",
          icon: <UserX className="h-4 w-4" />,
          type: "unassigned",
        },
        {
          value: "manual",
          label: "Assign to Me",
          description: "Assign this lead to yourself",
          icon: <User className="h-4 w-4" />,
          type: "manual",
        },
      ];

  // Initialize current assignment
  useEffect(() => {
    if (currentAssignment && currentAssignment !== "unassigned") {
      setSelectedOption("manual");
      setSelectedUsers([currentAssignment]);
    }
  }, [currentAssignment]);

  const handleOptionChange = async (value: string) => {
    setSelectedOption(value);
    const option = assignmentOptions.find((opt) => opt.value === value);

    if (!option) return;

    // For create mode, just call the callback
    if (mode === "create") {
      handleCreateModeAssignment(option);
      return;
    }

    // For edit mode, make API calls
    if (leadId) {
      await handleEditModeAssignment(option);
    }
  };

  const handleCreateModeAssignment = (option: AssignmentOption) => {
    switch (option.type) {
      case "unassigned":
        onAssignmentChange?.({
          type: "unassigned",
          assigned_to: "unassigned",
        });
        setShowUserSelection(false);
        setSelectedUsers([]);
        break;

      case "selective_round_robin":
        setShowUserSelection(true);
        setSelectedUsers([]); // Reset selection
        break;

      case "manual":
        setShowUserSelection(true);
        if (!isAdmin) {
          setSelectedUsers([userEmail]);
          // Also trigger the assignment immediately
          onAssignmentChange?.({
            type: "manual",
            assigned_to: userEmail,
            assigned_users: [userEmail],
          });
        } else {
          setSelectedUsers([]); // Reset selection for admins
        }
        break;
    }
  };

  const handleEditModeAssignment = async (option: AssignmentOption) => {
    if (!leadId) return;

    try {
      switch (option.type) {
        case "unassigned":
          await updateLead({
            lead_id: leadId,
            assigned_to: "unassigned",
          }).unwrap();

          onAssignmentChange?.({
            type: "unassigned",
            assigned_to: "unassigned",
          });
          setShowUserSelection(false);
          setSelectedUsers([]);
          break;

        case "selective_round_robin":
          setShowUserSelection(true);
          setSelectedUsers([]);
          break;

        case "manual":
          setShowUserSelection(true);
          if (!isAdmin) {
            setSelectedUsers([userEmail]);
            // Also make the API call immediately
            await updateLead({
              lead_id: leadId,
              assigned_to: userEmail,
            }).unwrap();

            onAssignmentChange?.({
              type: "manual",
              assigned_to: userEmail,
              assigned_users: [userEmail],
            });
          } else {
            setSelectedUsers([]); // Reset selection for admins
          }
          break;
      }
    } catch (error) {
      console.error("Assignment update failed:", error);
    }
  };

  const handleUserSelectionChange = async (values: string[]) => {
    setSelectedUsers(values);

    // Handle assignment based on current mode
    if (mode === "create") {
      if (selectedOption === "selective_round_robin") {
        onAssignmentChange?.({
          type: "selective_round_robin",
          assigned_users: values,
        });
      } else if (selectedOption === "manual") {
        onAssignmentChange?.({
          type: "manual",
          assigned_to: values[0] || "unassigned",
          assigned_users: values,
        });
      }
    } else if (leadId && mode === "edit") {
      // For edit mode, update via API
      try {
        if (selectedOption === "manual" && values.length > 0) {
          await updateLead({
            lead_id: leadId,
            assigned_to: values[0],
          }).unwrap();

          onAssignmentChange?.({
            type: "manual",
            assigned_to: values[0],
            assigned_users: values,
          });
        } else if (selectedOption === "selective_round_robin") {
          onAssignmentChange?.({
            type: "selective_round_robin",
            assigned_users: values,
          });
        }
      } catch (error) {
        console.error("Assignment failed:", error);
      }
    }
  };

  const getDisplayValue = () => {
    const option = assignmentOptions.find(
      (opt) => opt.value === selectedOption
    );
    if (!option) return "Select assignment";
    return option.label;
  };

  // Convert assignable users to SelectOption format for MultiSelect
  const userOptions: SelectOption[] = isAdmin
    ? assignableUsers.map((user) => ({
        value: user.email,
        label: `${user.name}`,
        subtitle: `${user.current_lead_count || 0} leads`,
        icon: undefined,
        disabled: false,
      }))
    : [
        // 🔥 NON-ADMIN: Only show current user
        {
          value: userEmail,
          label: userName,
          subtitle: "Assign to yourself",
          icon: undefined,
          disabled: false,
        },
      ];

  return (
    <div className={`space-y-4 ${className}`}>
      {showLabel && <Label htmlFor="assignment_type">Lead Assignment</Label>}

      {/* Assignment Method Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Assignment Method</Label>
        <Select
          value={selectedOption}
          onValueChange={handleOptionChange}
          disabled={disabled || isLoadingUsers || isUpdating}
        >
          <SelectTrigger
            className={size === "sm" ? "h-8" : size === "lg" ? "h-12" : "h-10"}
          >
            <SelectValue placeholder="Select assignment method">
              <div className="flex items-center gap-2">
                {
                  assignmentOptions.find((opt) => opt.value === selectedOption)
                    ?.icon
                }
                <span>{getDisplayValue()}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {assignmentOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {option.icon}
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-gray-500">
                      {option.description}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(isLoadingUsers || isUpdating) && (
        <p className="text-xs text-gray-500">
          {isUpdating ? "Updating assignment..." : "Loading counselors..."}
        </p>
      )}

      {/* User Selection with MultiSelect */}
      {showUserSelection && assignableUsers.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Select Counselors</Label>
          <MultiSelect
            options={userOptions}
            value={isAdmin ? selectedUsers : [userEmail]}
            onChange={
              isAdmin
                ? handleUserSelectionChange
                : () => handleUserSelectionChange([userEmail])
            } // 🔥 Force self-assignment
            disabled={disabled || isLoadingUsers || isUpdating || !isAdmin}
            placeholder={
              selectedOption === "selective_round_robin"
                ? "Select counselors for round robin..."
                : selectedOption === "manual"
                ? "Select counselor..."
                : "Select counselors..."
            }
            searchPlaceholder="Search counselors..."
            emptyMessage="No counselors found."
            maxDisplayItems={3}
            showCheckbox={true}
            allowSingleSelect={selectedOption === "manual"}
            showSelectedBadges={true}
            alwaysShowPlaceholder={false}
            showIcon={false}
            buttonVariant="outline"
            buttonSize="default"
            className="w-full"
          />

          {selectedOption === "manual" && selectedUsers.length > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                Lead will be assigned to the selected counselor.
              </p>
            </div>
          )}
        </div>
      )}
      {!isAdmin && selectedOption === "manual" && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Lead will be assigned to you ({userName}).
          </p>
        </div>
      )}

      {/* Info boxes for different assignment types */}
      {selectedOption === "selective_round_robin" && !showUserSelection && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-900">
              Round Robin Assignment
            </span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            {roundRobinPreview?.next_user_in_rotation
              ? `Next assignee: ${roundRobinPreview.next_user_in_rotation}`
              : "Lead will be automatically assigned to the next available counselor in rotation."}
          </p>
        </div>
      )}

      {selectedOption === "unassigned" && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <UserX className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-gray-900">Unassigned Lead</span>
          </div>
          <p className="text-sm text-gray-700 mt-1">
            Lead will remain unassigned until manually assigned later.
          </p>
        </div>
      )}
    </div>
  );
};

export default LeadAssignmentDropdown;
