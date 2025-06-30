// src/components/contacts/ContactsContainer.tsx

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Filter, Users, Crown } from "lucide-react";
import { useGetLeadContactsQuery } from "@/redux/slices/contactsApi";
import ContactCard from "./ContactCard";
import ContactEditor from "./ContactEditor";
import { Contact } from "@/models/types/contact";
import { useContactNotifications } from "@/hooks/useNotificationHelpers";

interface ContactsContainerProps {
  leadId: string;
}

const ContactsContainer: React.FC<ContactsContainerProps> = ({ leadId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [viewingContact, setViewingContact] = useState<Contact | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const notifications = useContactNotifications();

  // Fetch contacts for the lead
  const {
    data: contactsResponse,
    isLoading,
    error,
    refetch,
  } = useGetLeadContactsQuery(leadId);

  const contacts = contactsResponse?.data?.contacts || [];
  const primaryContact = contactsResponse?.data?.primary_contact;
  const contactSummary = contactsResponse?.data?.contact_summary;

  // Filter contacts based on search term
  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.full_name.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      contact.phone.toLowerCase().includes(searchLower) ||
      contact.role.toLowerCase().includes(searchLower) ||
      contact.relationship.toLowerCase().includes(searchLower)
    );
  });

  // Handle contact selection
  const handleContactSelect = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map((contact) => contact.id));
    }
  };

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
    // You can implement a view dialog similar to editor if needed
    console.log("Viewing contact:", contact);
  };

  // Handle editor close
  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingContact(undefined);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Contacts</h3>
          <div className="text-sm text-gray-500">
            ({contacts.length} contact{contacts.length !== 1 ? "s" : ""})
          </div>
        </div>
        <Button
          onClick={handleCreateContact}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Summary Cards */}
      {contactSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Total Contacts
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-1">
              {contactSummary.total}
            </div>
          </div>

          {primaryContact && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">
                  Primary Contact
                </span>
              </div>
              <div className="text-lg font-semibold text-yellow-900 mt-1 truncate">
                {primaryContact.full_name}
              </div>
            </div>
          )}

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Most Common Role
              </span>
            </div>
            <div className="text-lg font-semibold text-green-900 mt-1">
              {contactSummary.by_role
                ? Object.entries(contactSummary.by_role).sort(
                    ([, a], [, b]) => b - a
                  )[0]?.[0] || "N/A"
                : "N/A"}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search contacts by name, email, phone, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          {filteredContacts.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedContacts.length === filteredContacts.length}
                onCheckedChange={handleSelectAll}
                aria-label="Select all contacts"
              />
              <span className="text-sm text-gray-600">
                Select All ({selectedContacts.length})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 border rounded-lg p-4">
          <p className="text-sm text-gray-600">
            Advanced filters will be implemented here (role, relationship, etc.)
          </p>
        </div>
      )}

      {/* Contacts List */}
      <div className="space-y-4">
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
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
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
          <>
            {/* Primary Contact First */}
            {primaryContact && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  Primary Contact
                </h4>
                <ContactCard
                  contact={primaryContact}
                  isSelected={selectedContacts.includes(primaryContact.id)}
                  onSelect={handleContactSelect}
                  onEdit={handleEditContact}
                  onView={handleViewContact}
                  className="mb-4"
                />
              </div>
            )}

            {/* Other Contacts */}
            {filteredContacts.filter((contact) => !contact.is_primary).length >
              0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Other Contacts (
                  {
                    filteredContacts.filter((contact) => !contact.is_primary)
                      .length
                  }
                  )
                </h4>
                <div className="space-y-3">
                  {filteredContacts
                    .filter((contact) => !contact.is_primary)
                    .map((contact) => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        isSelected={selectedContacts.includes(contact.id)}
                        onSelect={handleContactSelect}
                        onEdit={handleEditContact}
                        onView={handleViewContact}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              {selectedContacts.length} contact
              {selectedContacts.length !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Export
              </Button>
              <Button variant="outline" size="sm">
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedContacts([])}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Editor Dialog */}
      <ContactEditor
        isOpen={isEditorOpen}
        onClose={handleEditorClose}
        leadId={leadId}
        contact={editingContact}
      />
    </div>
  );
};

export default ContactsContainer;
