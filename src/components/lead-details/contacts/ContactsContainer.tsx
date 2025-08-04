// src/components/contacts/ContactsContainer.tsx

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, User, Eye, Edit, Trash } from "lucide-react";
import {
  useGetLeadContactsQuery,
  useDeleteContactMutation,
} from "@/redux/slices/contactsApi";
import ContactEditor from "./ContactEditor";
import ContactViewModal from "./ContactViewModal";
import { Contact } from "@/models/types/contact";
import { useNotifications } from "@/components/common/NotificationSystem";

interface ContactsContainerProps {
  leadId: string;
}

const ContactsContainer: React.FC<ContactsContainerProps> = ({ leadId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [viewingContact, setViewingContact] = useState<Contact | undefined>();
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { showError, showConfirm, showWarning } = useNotifications();

  // Add delete mutation
  const [deleteContact, { isLoading: isDeleting }] = useDeleteContactMutation();

  // Fetch contacts for the lead
  const {
    data: contactsResponse,
    isLoading,
    error,
    refetch,
  } = useGetLeadContactsQuery(leadId);

  const contacts = contactsResponse?.data?.contacts || [];

  // Filter contacts based on search term
  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.full_name.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      contact.phone.toLowerCase().includes(searchLower) ||
      contact.role.toLowerCase().includes(searchLower)
    );
  });

  // Handle create new contact
  const handleCreateContact = () => {
    setEditingContact(undefined);
    setIsEditorOpen(true);
  };

  // Handle edit contact
  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditorOpen(true);
  };

  // Handle view contact
  const handleViewContact = (contact: Contact) => {
    setViewingContact(contact);
    setIsViewModalOpen(true);
  };

  // Handle edit from view modal
  const handleEditFromViewModal = (contact: Contact) => {
    setIsViewModalOpen(false);
    setViewingContact(undefined);
    setEditingContact(contact);
    setIsEditorOpen(true);
  };

  // Handle editor close
  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingContact(undefined);
  };

  // Handle view modal close
  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setViewingContact(undefined);
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "parent":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "counselor":
        return "bg-green-100 text-green-700 border-green-200";
      case "referee":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "student":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "agent":
        return "bg-pink-100 text-pink-700 border-pink-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Generate avatar initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading contacts...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Failed to load contacts</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and New Contact Button */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Role Filter - Optional */}
        <Button variant="outline" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          Role
        </Button>

        {/* New Contact Button */}
        <Button onClick={handleCreateContact} className="gap-2">
          <Plus className="h-4 w-4" />
          New contact
        </Button>
      </div>

      {/* Contacts List */}
      <div className="space-y-3">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            {searchTerm ? (
              <div>
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No contacts found
                </h3>
                <p className="text-gray-600 mb-4">
                  No contacts match your search criteria.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm("")}
                  size="sm"
                >
                  Clear Search
                </Button>
              </div>
            ) : (
              <div>
                <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No contacts yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start by adding your first contact for this lead.
                </p>
                <Button onClick={handleCreateContact}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Contact
                </Button>
              </div>
            )}
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-teal-700">
                    {getInitials(contact.full_name)}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-medium text-gray-900 truncate">
                    {contact.full_name}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getRoleBadgeColor(contact.role)}`}
                  >
                    {contact.role}
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={() => handleViewContact(contact)}
                >
                  <Eye className="h-4 w-4 text-gray-600" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={() => handleEditContact(contact)}
                >
                  <Edit className="h-4 w-4 text-gray-600" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={() => {
                    showConfirm({
                      title: "Delete Contact",
                      description: `Are you sure you want to delete "${contact.full_name}"? This action cannot be undone.`,
                      confirmText: "Delete",
                      variant: "destructive",
                      onConfirm: async () => {
                        try {
                          await deleteContact(contact.id).unwrap();
                          showWarning(
                            `Contact "${contact.full_name}" deleted successfully`,
                            "Contact Deleted !"
                          );
                        } catch (error) {
                          console.error("Failed to delete contact:", error);
                          showError(
                            "Failed to delete contact.",
                            "Please try again."
                          );
                        }
                      },
                    });
                  }}
                  disabled={isDeleting}
                >
                  <Trash className="h-4 w-4 text-gray-600" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contact Editor Dialog */}
      <ContactEditor
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
        leadId={leadId}
        contact={editingContact}
      />

      {/* Contact View Modal */}
      <ContactViewModal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        contact={viewingContact}
        onEdit={handleEditFromViewModal}
      />
    </div>
  );
};

export default ContactsContainer;
