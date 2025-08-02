// src/components/contacts/ContactViewModal.tsx

"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Phone, Mail, Users } from "lucide-react";
import { Contact } from "@/models/types/contact";

interface ContactViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact;
  onEdit?: (contact: Contact) => void;
}

const ContactViewModal: React.FC<ContactViewModalProps> = ({
  isOpen,
  onClose,
  contact,
  onEdit,
}) => {
  if (!contact) return null;

  // Generate contact ID
  const generateContactId = (contact: Contact) => {
    const timestamp = new Date(contact.created_at).getTime();
    const shortId = timestamp.toString().slice(-4);
    return `CT-${shortId}`;
  };

  // Generate avatar initials for owner
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 30) return `${diffInDays} days ago`;

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths === 1) return "1 month ago";
    if (diffInMonths < 12) return `${diffInMonths} months ago`;

    const diffInYears = Math.floor(diffInMonths / 12);
    return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(contact);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-medium text-gray-900">
              Contact information
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Data Table Content */}
        <div>
          <Table>
            <TableBody>
              {/* Name */}
              <TableRow className="">
                <TableCell className="font-medium text-gray-500 w-1/3">
                  Name:
                </TableCell>
                <TableCell className="">
                  <span className="text-gray-900">{contact.full_name}</span>
                </TableCell>
              </TableRow>

              {/* Contact ID */}
              <TableRow className="">
                <TableCell className="font-medium text-gray-500 ">
                  Contact ID:
                </TableCell>
                <TableCell className="">
                  <span className="text-gray-900">
                    {generateContactId(contact)}
                  </span>
                </TableCell>
              </TableRow>

              {/* Role */}
              <TableRow className="">
                <TableCell className="font-medium text-gray-500 ">
                  Role:
                </TableCell>
                <TableCell className="">
                  <span className="text-gray-900">{contact.role}</span>
                </TableCell>
              </TableRow>

              {/* Phone */}
              <TableRow className="">
                <TableCell className="font-medium text-gray-500 ">
                  Phone:
                </TableCell>
                <TableCell className="">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900">{contact.phone}</span>
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                </TableCell>
              </TableRow>

              {/* Email */}
              <TableRow className="">
                <TableCell className="font-medium text-gray-500 ">
                  Email:
                </TableCell>
                <TableCell className="">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900">{contact.email}</span>
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                </TableCell>
              </TableRow>

              {/* Owner */}
              <TableRow className="">
                <TableCell className="font-medium text-gray-500 ">
                  Owner:
                </TableCell>
                <TableCell className="">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-700">
                        {getInitials(contact.created_by_name)}
                      </span>
                    </div>
                    <span className="text-gray-900">
                      {contact.created_by_name}
                    </span>
                  </div>
                </TableCell>
              </TableRow>

              {/* Linked leads */}
              <TableRow className="">
                <TableCell className="font-medium text-gray-500 ">
                  Linked leads:
                </TableCell>
                <TableCell className="">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-600">
                      {contact.linked_leads?.length || 1} people
                    </span>
                  </div>
                </TableCell>
              </TableRow>

              {/* Department */}
              {/* <TableRow className="">
                <TableCell className="font-medium text-gray-500 ">
                  Department:
                </TableCell>
                <TableCell className="">
                  <span className="text-gray-900">Sales</span>
                </TableCell>
              </TableRow> */}

              {/* Last activity */}
              <TableRow>
                <TableCell className="font-medium text-gray-500 ">
                  Last activity:
                </TableCell>
                <TableCell className="">
                  <span className="text-gray-900">
                    {formatRelativeTime(contact.updated_at)}
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Edit Button */}
          <div className="pt-3 justify-end flex">
            <Button onClick={handleEdit} className="w-auto" size="lg">
              Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactViewModal;
