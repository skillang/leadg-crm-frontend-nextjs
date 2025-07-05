// src/components/contacts/ContactEditor.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Contact,
  UpdateContactRequest,
  CONTACT_ROLES,
  CONTACT_RELATIONSHIPS,
} from "@/models/types/contact";
import {
  useCreateContactMutation,
  useUpdateContactMutation,
} from "@/redux/slices/contactsApi";
// import { useAppSelector } from "@/redux/hooks";
import { useNotifications } from "@/components/common/NotificationSystem";

// Type definitions
interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  relationship: string;
  address: string;
  notes: string;
  is_primary: boolean;
}

interface ValidationError {
  loc?: string[];
  msg: string;
  type: string;
}

interface ApiErrorResponse {
  status?: number;
  data?: {
    detail?: ValidationError[] | string;
    message?: string;
  };
  message?: string;
}

interface ContactEditorProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  contact?: Contact;
}

const ContactEditor: React.FC<ContactEditorProps> = ({
  isOpen,
  onClose,
  leadId,
  contact,
}) => {
  const [createContact, { isLoading: isCreating }] = useCreateContactMutation();
  const [updateContact, { isLoading: isUpdating }] = useUpdateContactMutation();

  // Get notifications
  const { showSuccess, showError } = useNotifications();

  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    role: "",
    relationship: "Student",
    address: "",
    notes: "",
    is_primary: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>("");

  const isEditing = !!contact;
  const isLoading = isCreating || isUpdating;

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (contact) {
        setFormData({
          name:
            contact.full_name || `${contact.first_name} ${contact.last_name}`,
          email: contact.email,
          phone: contact.phone,
          role: contact.role,
          relationship: contact.relationship,
          address: contact.address || "",
          notes: contact.notes || "",
          is_primary: contact.is_primary,
        });
      } else {
        setFormData({
          name: "",
          email: "",
          phone: "",
          role: "",
          relationship: "Student",
          address: "",
          notes: "",
          is_primary: false,
        });
      }
      setFormErrors({});
      setApiError("");
    }
  }, [isOpen, contact]);

  const handleInputChange = (
    field: keyof ContactFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email format is invalid";
    }
    if (!formData.phone.trim()) errors.phone = "Phone number is required";
    if (!formData.role) errors.role = "Role is required";
    if (!formData.relationship)
      errors.relationship = "Relationship is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (!validateForm()) return;

    try {
      if (isEditing && contact) {
        // Update logic
        const nameParts = formData.name.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName =
          nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

        const updateData: UpdateContactRequest = {
          first_name: firstName,
          last_name: lastName,
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          relationship: formData.relationship,
          is_primary: formData.is_primary,
          address: formData.address.trim(),
          notes: formData.notes.trim(),
        };

        await updateContact({
          contactId: contact.id,
          contactData: updateData,
        }).unwrap();
        showSuccess(`Contact "${formData.name}" updated successfully!`);
      } else {
        // Create new contact
        const nameParts = formData.name.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName =
          nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

        const createData = {
          address: formData.address.trim(),
          email: formData.email.trim(),
          first_name: firstName,
          last_name: lastName,
          is_primary: formData.is_primary,
          linked_leads: [leadId],
          notes: formData.notes.trim(),
          phone: formData.phone.trim(),
          relationship: formData.relationship,
          role: formData.role,
        };

        await createContact({ leadId, contactData: createData }).unwrap();
        showSuccess(`Contact "${formData.name}" created successfully!`);
      }

      onClose();
    } catch (error) {
      let errorMessage = "Failed to save contact. Please try again.";

      if (error && typeof error === "object") {
        const errorObj = error as ApiErrorResponse;

        if (errorObj.status === 422 && errorObj.data?.detail) {
          if (Array.isArray(errorObj.data.detail)) {
            errorMessage =
              "Validation errors:\n" +
              errorObj.data.detail
                .map(
                  (err: ValidationError) =>
                    `• ${err.loc?.join(".")}: ${err.msg}`
                )
                .join("\n");
          } else if (typeof errorObj.data.detail === "string") {
            errorMessage = errorObj.data.detail;
          }
        } else if (errorObj.data?.message) {
          errorMessage = errorObj.data.message;
        } else if (errorObj.message) {
          errorMessage = errorObj.message;
        }
      }

      setApiError(errorMessage);
      showError(errorMessage);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit contact" : "Add new contact"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update contact information."
              : "Add a new contact for this lead."}
          </DialogDescription>
        </DialogHeader>

        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600 whitespace-pre-line">
              {apiError}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter full name"
              disabled={isLoading}
              className={formErrors.name ? "border-red-500" : ""}
            />
            {formErrors.name && (
              <p className="text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email address"
              disabled={isLoading}
              className={formErrors.email ? "border-red-500" : ""}
            />
            {formErrors.email && (
              <p className="text-sm text-red-600">{formErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Enter phone number"
              disabled={isLoading}
              className={formErrors.phone ? "border-red-500" : ""}
            />
            {formErrors.phone && (
              <p className="text-sm text-red-600">{formErrors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Role <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange("role", value)}
              disabled={isLoading}
            >
              <SelectTrigger
                className={formErrors.role ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.role && (
              <p className="text-sm text-red-600">{formErrors.role}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">
              Relationship <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.relationship}
              onValueChange={(value) =>
                handleInputChange("relationship", value)
              }
              disabled={isLoading}
            >
              <SelectTrigger
                className={formErrors.relationship ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_RELATIONSHIPS.map((rel) => (
                  <SelectItem key={rel.value} value={rel.value}>
                    {rel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.relationship && (
              <p className="text-sm text-red-600">{formErrors.relationship}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address (Optional)</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter address"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Additional notes..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_primary"
              checked={formData.is_primary}
              onCheckedChange={(checked) =>
                handleInputChange("is_primary", checked === true)
              }
              disabled={isLoading}
            />
            <Label htmlFor="is_primary">
              Set as primary contact for this lead
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update Contact"
              ) : (
                "Create Contact"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactEditor;
