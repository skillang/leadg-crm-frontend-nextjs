// src/components/contacts/ContactCard.tsx

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Phone,
  Mail,
  MapPin,
  User,
  Eye,
  Edit,
  Trash,
  Star,
  Crown,
} from "lucide-react";
import { Contact } from "@/models/types/contact";
import {
  useDeleteContactMutation,
  useSetPrimaryContactMutation,
} from "@/redux/slices/contactsApi";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/components/common/NotificationSystem";

interface ContactCardProps {
  contact: Contact;
  isSelected?: boolean;
  onSelect?: (contactId: string) => void;
  onEdit?: (contact: Contact) => void;
  onView?: (contact: Contact) => void;
  className?: string;
}

const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  isSelected = false,
  onSelect,
  onEdit,
  onView,
  className,
}) => {
  const { showSuccess, showError, showConfirm } = useNotifications();
  const [deleteContact, { isLoading: isDeleting }] = useDeleteContactMutation();
  const [setPrimaryContact, { isLoading: isSettingPrimary }] =
    useSetPrimaryContactMutation();

  const handleDelete = async () => {
    showConfirm({
      title: "Delete Contact",
      description: `Are you sure you want to delete "${contact.full_name}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteContact(contact.id).unwrap();
          showSuccess(`Contact "${contact.full_name}" deleted successfully`);
        } catch (error) {
          console.error("Failed to delete contact:", error);
          showError("Failed to delete contact. Please try again.");
        }
      },
    });
  };

  const handleSetPrimary = async () => {
    if (contact.is_primary) return;

    try {
      await setPrimaryContact(contact.id).unwrap();
      showSuccess(`${contact.full_name} is now the primary contact`);
    } catch (error) {
      // console.error("Failed to set primary contact:", error);
      showError("Failed to set primary contact, error:" + error?.toString());
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(contact);
    }
  };

  const handleView = () => {
    if (onView) {
      onView(contact);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(contact.id);
    }
  };

  const handleCall = () => {
    if (contact.phone) {
      window.open(`tel:${contact.phone}`, "_self");
    }
  };

  const handleEmail = () => {
    if (contact.email) {
      window.open(`mailto:${contact.email}`, "_self");
    }
  };

  // Get role badge styling
  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case "decision maker":
        return "bg-green-100 text-green-700 border-green-200";
      case "influencer":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "user":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "gatekeeper":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "champion":
        return "bg-pink-100 text-pink-700 border-pink-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md border",
        contact.is_primary
          ? "border-yellow-300 bg-yellow-50"
          : "border-gray-200",
        isSelected && "ring-2 ring-blue-500",
        className
      )}
    >
      <CardContent>
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          {onSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleSelect}
              aria-label="Select contact"
              className="mt-1"
            />
          )}

          {/* Contact Info */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">
                    {contact.full_name ||
                      `${contact.first_name} ${contact.last_name}`}
                  </h3>
                  {contact.is_primary && (
                    <div className="flex items-center gap-1">
                      <Crown className="h-4 w-4 text-yellow-600" />
                      <span className="text-xs text-yellow-700 font-medium">
                        Primary
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={handleView}
                >
                  <Eye className="h-4 w-4 text-gray-600" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={handleEdit}
                  disabled={isDeleting}
                >
                  <Edit className="h-4 w-4 text-gray-600" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash className="h-4 w-4 text-gray-600" />
                </Button>
              </div>
            </div>

            {/* Role and Relationship */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-medium",
                  getRoleBadge(contact.role)
                )}
              >
                {contact.role}
              </Badge>
              <Badge variant="outline" className="text-xs text-gray-600">
                {contact.relationship}
              </Badge>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {/* Phone */}
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">{contact.phone}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  onClick={handleCall}
                  disabled={!contact.phone}
                >
                  <Phone className="h-3 w-3 text-blue-600" />
                </Button>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 truncate">{contact.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  onClick={handleEmail}
                  disabled={!contact.email}
                >
                  <Mail className="h-3 w-3 text-blue-600" />
                </Button>
              </div>
            </div>

            {/* Address */}
            {contact.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <span className="text-gray-700">{contact.address}</span>
              </div>
            )}

            {/* Notes */}
            {contact.notes && (
              <div className="text-sm">
                <span className="text-gray-600 font-medium">Notes:</span>
                <p className="text-gray-700 mt-1">{contact.notes}</p>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Created by {contact.created_by_name}
              </div>

              {!contact.is_primary && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSetPrimary}
                  disabled={isSettingPrimary}
                  className="text-xs"
                >
                  {isSettingPrimary ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <>
                      <Star className="h-3 w-3 mr-1" />
                      Set as Primary
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactCard;
