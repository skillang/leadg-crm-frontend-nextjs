"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetLeadDetailsQuery } from "@/redux/slices/leadsApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Phone, Mail, ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

// Simple Card components
const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`rounded-lg border bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3
    className={`text-lg font-semibold leading-none tracking-tight ${className}`}
  >
    {children}
  </h3>
);

const CardContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

// Tab definitions
const tabs = [
  { id: "timeline", label: "Timeline" },
  { id: "tasks", label: "Tasks & reminders" },
  { id: "notes", label: "Notes" },
  { id: "documents", label: "Documents" },
  { id: "activity", label: "Activity log" },
  { id: "contacts", label: "Contacts" },
];

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function LeadDetailsPage() {
  const [activeTab, setActiveTab] = useState("timeline");
  const params = useParams();
  const router = useRouter();
  const leadId = params?.leadId as string;

  const {
    data: leadDetails,
    isLoading,
    error,
  } = useGetLeadDetailsQuery(leadId);

  const handleBack = () => {
    router.back();
  };

  const handleCall = () => {
    if (leadDetails?.phoneNumber) {
      window.open(`tel:${leadDetails.phoneNumber}`, "_self");
    }
  };

  const handleEmail = () => {
    if (leadDetails?.email) {
      window.open(`mailto:${leadDetails.email}`, "_self");
    }
  };

  const handleWhatsApp = () => {
    if (leadDetails?.contact) {
      const cleanNumber = leadDetails.contact.replace(/[^\d]/g, "");
      window.open(`https://wa.me/${cleanNumber}`, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading lead details...</span>
        </div>
      </div>
    );
  }

  if (error || !leadDetails) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Lead Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The lead you are looking for does not exist or has been removed.
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "timeline":
        return (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Timeline Content</h3>
            <p className="text-gray-600">
              Timeline activities and events will be displayed here...
            </p>
          </div>
        );
      case "tasks":
        return (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Tasks & Reminders Content
            </h3>
            <p className="text-gray-600">
              Tasks and reminders will be displayed here...
            </p>
          </div>
        );
      case "notes":
        return (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Notes Content</h3>
            <p className="text-gray-600">
              Lead notes will be displayed here...
            </p>
          </div>
        );
      case "documents":
        return (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Documents Content</h3>
            <p className="text-gray-600">
              Uploaded documents will be displayed here...
            </p>
          </div>
        );
      case "activity":
        return (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Activity Log Content</h3>
            <p className="text-gray-600">
              Activity log entries will be displayed here...
            </p>
          </div>
        );
      case "contacts":
        return (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Contacts Content</h3>
            <p className="text-gray-600">
              Related contacts will be displayed here...
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto py-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Button variant="ghost" onClick={handleBack} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span>My leads</span>
            <span>/</span>
            <span className="text-blue-600 font-medium">
              {leadDetails.name}
            </span>
          </div>
        </div>

        {/* Lead Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Star className="h-5 w-5 text-gray-400" />
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{leadDetails.name}</h1>
                <Badge className="bg-green-100 text-green-800 text-sm">
                  High Score
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 text-sm">
                  IELTS Ready
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Stage Dropdown */}
              <div className="relative">
                <select className="appearance-none bg-orange-100 text-orange-800 px-3 py-1 rounded text-sm border border-orange-200 pr-8">
                  <option>Contacted</option>
                  <option>First call</option>
                  <option>Qualified</option>
                  <option>Proposal</option>
                  <option>Closed won</option>
                  <option>Closed lost</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Action Buttons */}
              <Button
                onClick={handleCall}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
              <Button
                onClick={handleEmail}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Mail className="mr-2 h-4 w-4" />
                Mail
              </Button>
              <Button
                onClick={handleWhatsApp}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Phone className="mr-2 h-4 w-4" />
                Whatsapp
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Overview (Fixed) */}
          <div className="col-span-12 md:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6 w-1/3">
                        Name:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.name}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Lead ID:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.leadId}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Phone number:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-gray-600 border-gray-300"
                        >
                          Request to view
                        </Button>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Email:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-gray-600 border-gray-300"
                        >
                          Request to view
                        </Button>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Country of interest:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.countryOfInterest.join(", ")}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Course level:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {leadDetails.courseLevel}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Source:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900">
                            {leadDetails.source}
                          </span>
                          <ExternalLink className="h-4 w-4 text-blue-600" />
                        </div>
                      </TableCell>
                    </TableRow>

                    <TableRow className="border-b">
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Created on:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="text-gray-900">
                          {formatDate(leadDetails.createdOn)}
                        </span>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-medium text-gray-500 py-3 px-6">
                        Tags:
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <div className="flex flex-wrap gap-2">
                          {leadDetails.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs bg-gray-100 text-gray-700"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabbed Interface */}
          <div className="col-span-12 md:col-span-7">
            <Card>
              {/* Tab Navigation */}
              <div className="border-b">
                <div className="flex space-x-8 px-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="min-h-[600px]">{renderTabContent()}</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
