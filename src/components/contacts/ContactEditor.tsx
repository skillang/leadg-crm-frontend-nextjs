// src/components/contacts/ContactEditor.tsx

"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  CreateContactRequest,
  UpdateContactRequest,
  CONTACT_ROLES,
  CONTACT_RELATIONSHIPS,
} from "@/models/types/contact";
import {
  useCreateContactMutation,
  useUpdateContactMutation,
} from "@/redux/slices/contactsApi";

interface ContactEditorProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  contact?: Contact; // If provided, we're editing; otherwise creating
}

const ContactEditor: React.FC<ContactEditorProps> = ({
  isOpen,
  onClose,
  leadId,
  contact,
}) => {
  const [createContact, { isLoading: isCreating }] = useCreateContactMutation();
  const [updateContact, { isLoading: isUpdating }] = useUpdateContactMutation();

  const [formData, setFormData] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
    relationship: string;
    is_primary: boolean;
    address: string;
    notes: string;
  }>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "",
    relationship: "",
    is_primary: false,
    address: "",
    notes: "",
  });

  const isEditing = !!contact;
  const isLoading = isCreating || isUpdating;

  // Reset form when contact changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      if (contact) {
        // Editing existing contact
        setFormData({
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          role: contact.role,
          relationship: contact.relationship,
          is_primary: contact.is_primary,
          address: contact.address || "",
          notes: contact.notes || "",
        });
      } else {
        // Creating new contact
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          role: "",
          relationship: "",
          is_primary: false,
          address: "",
          notes: "",
        });
      }
    }
  }, [isOpen, contact]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.first_name.trim() ||
      !formData.last_name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.role ||
      !formData.relationship
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      if (isEditing && contact) {
        // Update existing contact
        const updateData: UpdateContactRequest = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          relationship: formData.relationship,
          is_primary: formData.is_primary,
          address: formData.address,
          notes: formData.notes,
        };

        await updateContact({
          contactId: contact.id,
          contactData: updateData,
        }).unwrap();
      } else {
        // Create new contact
        const createData: CreateContactRequest = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          relationship: formData.relationship,
          is_primary: formData.is_primary,
          address: formData.address,
          notes: formData.notes,
          linked_leads: [leadId],
        };

        await createContact({
          leadId,
          contactData: createData,
        }).unwrap();
      }

      onClose();
    } catch (error) {
      console.error("Failed to save contact:", error);
      alert(
        `Failed to ${
          isEditing ? "update" : "create"
        } contact. Please try again.`
      );
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Contact" : "Create New Contact"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-sm font-medium">
                First Name *
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  handleInputChange("first_name", e.target.value)
                }
                placeholder="Enter first name"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-sm font-medium">
                Last Name *
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                placeholder="Enter last name"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Role and Relationship */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                Role *
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange("role", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship" className="text-sm font-medium">
                Relationship *
              </Label>
              <Select
                value={formData.relationship}
                onValueChange={(value) =>
                  handleInputChange("relationship", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_RELATIONSHIPS.map((relationship) => (
                    <SelectItem
                      key={relationship.value}
                      value={relationship.value}
                    >
                      {relationship.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Primary Contact Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_primary"
              checked={formData.is_primary}
              onCheckedChange={(checked) =>
                handleInputChange("is_primary", !!checked)
              }
              disabled={isLoading}
            />
            <Label htmlFor="is_primary" className="text-sm font-medium">
              Set as primary contact
            </Label>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Address
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter full address"
              className="min-h-[60px] resize-vertical"
              disabled={isLoading}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add any additional notes about this contact..."
              className="min-h-[80px] resize-vertical"
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {isEditing ? "Updating..." : "Creating..."}
                </div>
              ) : isEditing ? (
                "Update Contact"
              ) : (
                "Create Contact"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactEditor;
