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
  CreateContactRequest,
} from "@/models/types/contact";
import {
  useCreateContactMutation,
  useUpdateContactMutation,
} from "@/redux/slices/contactsApi";
// import { useAppSelector } from "@/redux/hooks";
import { useNotifications } from "@/components/common/NotificationSystem";

// Type definitions
interface ContactFormData {
  first_name: string; // Changed from 'name'
  last_name: string; // New field
  email: string;
  phone: string;
  role: string;
  relationship: string;
  address: string;
  notes: string;
  is_primary: boolean;
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
  const { showSuccess } = useNotifications();

  const [formData, setFormData] = useState<ContactFormData>({
    first_name: "",
    last_name: "",
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
          first_name: contact.first_name,
          last_name: contact.last_name || "",
          email: contact.email,
          phone: contact.phone || "",
          role: contact.role || "",
          relationship: contact.relationship || "",
          address: contact.address || "",
          notes: contact.notes || "",
          is_primary: contact.is_primary,
        });
      } else {
        setFormData({
          first_name: "",
          last_name: "",
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

    if (!formData.first_name.trim())
      errors.first_name = "First name is required";
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
        const updateData: UpdateContactRequest = {
          first_name: formData.first_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          relationship: formData.relationship,
          is_primary: formData.is_primary,
          address: formData.address.trim(),
          notes: formData.notes.trim(),
        };

        // Only include last_name if it's not empty
        if (formData.last_name.trim()) {
          updateData.last_name = formData.last_name.trim();
        }

        await updateContact({
          contactId: contact.id,
          contactData: updateData,
        }).unwrap();
        showSuccess(
          `Contact "${formData.first_name} ${formData.last_name}" updated successfully!`
        );
      } else {
        const createData: CreateContactRequest = {
          first_name: formData.first_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          relationship: formData.relationship,
          is_primary: formData.is_primary,
          address: formData.address.trim(),
          notes: formData.notes.trim(),
          linked_leads: [leadId],
        };

        // Only include last_name if it's not empty
        if (formData.last_name.trim()) {
          createData.last_name = formData.last_name.trim();
        }

        await createContact({ leadId, contactData: createData }).unwrap();
        showSuccess(
          `Contact "${formData.first_name} ${
            formData.last_name || ""
          }" created successfully!`
        );
      }

      onClose();
    } catch (error) {
      // Error handling remains the same
      console.log("error:", error);
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
          <div className="flex justify-between gap-3">
            <div className="space-y-2 flex-1">
              <Label htmlFor="first_name">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  handleInputChange("first_name", e.target.value)
                }
                placeholder="Enter first name"
                disabled={isLoading}
                className={formErrors.first_name ? "border-red-500" : ""}
              />
              {formErrors.first_name && (
                <p className="text-sm text-red-600">{formErrors.first_name}</p>
              )}
            </div>

            <div className="space-y-2 flex-1">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                placeholder="Enter last name"
                disabled={isLoading}
              />
              {/* No error validation for last_name */}
            </div>
          </div>

          <div className="flex justify-between">
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

            <div className="">
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
          </div>

          <div className="flex justify-between">
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
                <p className="text-sm text-red-600">
                  {formErrors.relationship}
                </p>
              )}
            </div>
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
