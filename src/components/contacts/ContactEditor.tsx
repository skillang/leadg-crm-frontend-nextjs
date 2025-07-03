// src/components/contacts/ContactEditor.tsx - Updated to match UI design

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  CONTACT_ROLES,
} from "@/models/types/contact";
import {
  useCreateContactMutation,
  useUpdateContactMutation,
} from "@/redux/slices/contactsApi";
import { useGetMyLeadsQuery } from "@/redux/slices/leadsApi";
import { useAppSelector } from "@/redux/hooks";

// Type definitions for better type safety
interface ContactFormData {
  name: string;
  contact_id: string;
  role: string;
  phone: string;
  email: string;
  owner: string;
  linked_leads: string[];
  department: string;
}

type FormFieldValue = string | string[];

interface ValidationError {
  loc: string[];
  msg: string;
  type: string;
}

interface ApiErrorResponse {
  data?: {
    detail?: string | ValidationError[];
    message?: string;
  };
  message?: string;
  status?: number;
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

  // Fetch user's leads for the linked leads dropdown
  const { data: myLeads = [], isLoading: leadsLoading } = useGetMyLeadsQuery();
  const currentUser = useAppSelector((state) => state.auth.user);

  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    contact_id: "",
    role: "",
    phone: "",
    email: "",
    owner: "",
    linked_leads: [],
    department: "Sales",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>("");

  const isEditing = !!contact;
  const isLoading = isCreating || isUpdating;

  // Generate contact ID
  const generateContactId = () => {
    const timestamp = Date.now();
    const shortId = timestamp.toString().slice(-4);
    return `CT-${shortId}`;
  };

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Reset form when contact changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormErrors({});
      setApiError("");

      if (contact) {
        // Editing existing contact
        setFormData({
          name: contact.full_name,
          contact_id: `CT-${contact.created_at.slice(-4)}`,
          role: contact.role,
          phone: contact.phone,
          email: contact.email,
          owner: contact.created_by_name,
          linked_leads: contact.linked_leads || [leadId],
          department: "Sales",
        });
      } else {
        // Creating new contact
        setFormData({
          name: "",
          contact_id: generateContactId(),
          role: "",
          phone: "",
          email: "",
          owner: currentUser
            ? `${currentUser.first_name} ${currentUser.last_name}`
            : "",
          linked_leads: [leadId],
          department: "Sales",
        });
      }
    }
  }, [isOpen, contact, leadId, currentUser]);

  // FIXED: Properly typed handleInputChange function
  const handleInputChange = (
    field: keyof ContactFormData,
    value: FormFieldValue
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Client-side validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email format is invalid";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    }

    if (!formData.role) {
      errors.role = "Role is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && contact) {
        // Update existing contact
        const nameParts = formData.name.split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ");

        const updateData: UpdateContactRequest = {
          first_name: firstName,
          last_name: lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          relationship: "Student", // Default relationship
          linked_leads: formData.linked_leads,
        };

        await updateContact({
          contactId: contact.id,
          contactData: updateData,
        }).unwrap();
      } else {
        // Create new contact
        const nameParts = formData.name.split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ");

        const createData: CreateContactRequest = {
          first_name: firstName,
          last_name: lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          relationship: "Student", // Default relationship
          linked_leads: formData.linked_leads,
        };

        await createContact({
          leadId,
          contactData: createData,
        }).unwrap();
      }

      onClose();
    } catch (error) {
      // FIXED: Properly typed error handling
      console.error("Failed to save contact:", error);

      const apiError = error as ApiErrorResponse;
      let errorMessage = "Failed to save contact. Please try again.";

      if (apiError?.data) {
        if (Array.isArray(apiError.data.detail)) {
          const validationErrors: Record<string, string> = {};
          // FIXED: Properly typed validation error handling
          apiError.data.detail.forEach((err: ValidationError) => {
            if (err.loc && err.loc.length > 1) {
              const field = err.loc[err.loc.length - 1];
              validationErrors[field] = err.msg;
            }
          });

          if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            return;
          }

          // FIXED: Properly typed error mapping
          errorMessage = apiError.data.detail
            .map((err: ValidationError) => err.msg)
            .join(", ");
        } else if (typeof apiError.data.detail === "string") {
          errorMessage = apiError.data.detail;
        }
      }

      setApiError(errorMessage);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">
            {isEditing ? "Edit contact" : "Add new contact"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update contact information and settings."
              : "Add a new contact for this lead."}
          </DialogDescription>
        </DialogHeader>

        {/* API Error Display */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600">{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name
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

          {/* Contact ID and Role */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_id" className="text-sm font-medium">
                Contact ID
              </Label>
              <Input
                id="contact_id"
                value={formData.contact_id}
                disabled={true}
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                Role
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
          </div>

          {/* Phone and Email */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone
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
              <Label htmlFor="email" className="text-sm font-medium">
                Email
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
          </div>

          {/* Owner and Linked Leads */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner" className="text-sm font-medium">
                Owner <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.owner}
                onValueChange={(value) => handleInputChange("owner", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select owner">
                    {formData.owner && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                            {getUserInitials(formData.owner)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{formData.owner}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {currentUser && (
                    <SelectItem
                      value={`${currentUser.first_name} ${currentUser.last_name}`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                            {getUserInitials(
                              `${currentUser.first_name} ${currentUser.last_name}`
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {currentUser.first_name} {currentUser.last_name}
                        </span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linked_leads" className="text-sm font-medium">
                Linked leads
              </Label>
              <Select
                value={formData.linked_leads[0] || ""}
                onValueChange={(value) =>
                  handleInputChange("linked_leads", [value])
                }
                disabled={isLoading || leadsLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={leadsLoading ? "Loading..." : "Select leads"}
                  >
                    {formData.linked_leads.length > 0 && (
                      <span>
                        {myLeads.find(
                          (lead) => lead.id === formData.linked_leads[0]
                        )?.name ||
                          `${formData.linked_leads.length} lead${
                            formData.linked_leads.length !== 1 ? "s" : ""
                          }`}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {myLeads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      <div className="flex items-center gap-2">
                        <span>{lead.name}</span>
                        <span className="text-xs text-gray-500">
                          ({lead.id})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department" className="text-sm font-medium">
              Department
            </Label>
            <Select
              value={formData.department}
              onValueChange={(value) => handleInputChange("department", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Support">Support</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700"
            >
              Reset changes
            </Button>
            <div className="flex gap-3">
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {isEditing ? "Saving..." : "Creating..."}
                  </div>
                ) : isEditing ? (
                  "Save changes"
                ) : (
                  "Create contact"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactEditor;
