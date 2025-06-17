"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetLeadDetailsQuery } from "@/redux/slices/leadsApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Building,
  FileText,
  Activity,
  Edit,
  MessageSquare,
  Globe,
  Download,
  ExternalLink,
} from "lucide-react";

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

// Stage color mapping
const getStageColor = (stage: string) => {
  const colors: Record<string, string> = {
    contacted: "bg-orange-100 text-orange-800",
    "first-call": "bg-yellow-100 text-yellow-800",
    qualified: "bg-purple-100 text-purple-800",
    proposal: "bg-indigo-100 text-indigo-800",
    "closed-won": "bg-green-100 text-green-800",
    "closed-lost": "bg-red-100 text-red-800",
  };
  return colors[stage] || "bg-gray-100 text-gray-800";
};

// Activity type icons
const getActivityIcon = (type: string) => {
  const icons: Record<string, any> = {
    call: Phone,
    email: Mail,
    meeting: Calendar,
    note: FileText,
    stage_change: Activity,
    document_upload: FileText,
  };
  return icons[type] || Activity;
};

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function LeadDetailsPage() {
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
            The lead you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Breadcrumb and Back Button */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Button variant="ghost" onClick={handleBack} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span>My leads</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">{leadDetails.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Star className="h-5 w-5 text-gray-400" />
              <h1 className="text-3xl font-bold">{leadDetails.name}</h1>
              <Badge className={`${getStageColor(leadDetails.stage)} text-sm`}>
                {leadDetails.stage}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                High score
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                IELTS ready
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCall}>
            <Phone className="mr-2 h-4 w-4" />
            Call
          </Button>
          <Button variant="outline" onClick={handleEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Name:
                    </label>
                    <p className="text-gray-900">{leadDetails.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Lead ID:
                    </label>
                    <p className="text-gray-900">{leadDetails.leadId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Phone number:
                    </label>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900">{leadDetails.phoneNumber}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600"
                      >
                        Request to view
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Email:
                    </label>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900">{leadDetails.email}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600"
                      >
                        Request to view
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Country of interest:
                    </label>
                    <p className="text-gray-900">
                      {leadDetails.countryOfInterest.join(", ")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Course level:
                    </label>
                    <p className="text-gray-900">{leadDetails.courseLevel}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Source:
                    </label>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900">{leadDetails.source}</p>
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Created on:
                    </label>
                    <p className="text-gray-900">
                      {formatDate(leadDetails.createdOn)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Tags:
                    </label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {leadDetails.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity History */}
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leadDetails.leadHistory.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className="flex gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <IconComponent className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{activity.title}</h4>
                          <span className="text-sm text-gray-500">
                            {formatDateTime(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          by {activity.performedBy}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* Lead Score */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {leadDetails.leadScore}
                </div>
                <p className="text-sm text-gray-500">Out of 100</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${leadDetails.leadScore}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Preferences */}
          {leadDetails.preferences && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Preferred method:
                    </label>
                    <p className="text-gray-900 capitalize">
                      {leadDetails.preferences.communicationMethod}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Best time:
                    </label>
                    <p className="text-gray-900">
                      {leadDetails.preferences.bestTimeToContact}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Timezone:
                    </label>
                    <p className="text-gray-900">
                      {leadDetails.preferences.timezone}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Address */}
          {leadDetails.address && (
            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                  <div>
                    {leadDetails.address.street && (
                      <p>{leadDetails.address.street}</p>
                    )}
                    <p>
                      {leadDetails.address.city &&
                        `${leadDetails.address.city}, `}
                      {leadDetails.address.state &&
                        `${leadDetails.address.state} `}
                      {leadDetails.address.zipCode}
                    </p>
                    <p>{leadDetails.address.country}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {leadDetails.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leadDetails.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(doc.size)} •{" "}
                            {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
