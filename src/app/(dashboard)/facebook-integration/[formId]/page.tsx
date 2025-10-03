// src/app/facebook-forms/[formId]/page.tsx

"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  usePreviewFacebookFormLeadsQuery,
  useGetFacebookFormsQuery,
  formatConfidenceLevel,
  getConfidenceColor,
  formatFormStatus,
  getStatusColor,
} from "@/redux/slices/facebookApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Facebook,
  ArrowLeft,
  Users,
  Search,
  RefreshCw,
  Mail,
  Phone,
  GraduationCap,
  AlertTriangle,
  Eye,
  Import,
  User,
} from "lucide-react";
import { ImportLeadsModal } from "@/components/leads/ImportLeadsModal";

export default function FacebookFormDetailPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [previewLimit, setPreviewLimit] = useState(10);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // RTK Query hooks
  const { data: formsResponse, isLoading: formsLoading } =
    useGetFacebookFormsQuery();

  const {
    data: leadsResponse,
    isLoading: leadsLoading,
    isError: leadsError,
    // error: leadsErrorDetails,
    refetch: refetchLeads,
    isFetching: leadsRefetching,
  } = usePreviewFacebookFormLeadsQuery({
    form_id: formId,
    limit: previewLimit,
  });

  // Extract data
  const forms = formsResponse?.forms || [];
  const currentForm = forms.find((form) => form.id === formId);
  const leads = leadsResponse?.leads || [];

  // Filter leads based on search
  const filteredLeads = leads.filter((lead) =>
    Object.values(lead).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading skeleton for table rows
  const TableSkeleton = () => (
    <>
      {[...Array(5)].map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="h-4 w-[150px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[200px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[120px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[80px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[80px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[120px]" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  // Handle back navigation
  const handleBack = () => {
    router.push("/facebook-integration");
  };

  return (
    <div className="container mx-auto  space-y-4">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Forms
            </Button>
            <div className="h-6 w-px bg-border" />
            <Facebook className="h-6 w-6 text-blue-600" />
            <div>
              <div className="text-2xl font-bold tracking-tight">
                {formsLoading ? (
                  <Skeleton className="h-8 w-[300px]" />
                ) : (
                  currentForm?.name || "Facebook Form Details"
                )}
              </div>
              <div className="text-muted-foreground">
                {formsLoading ? (
                  <Skeleton className="h-4 w-[200px]" />
                ) : (
                  `Form ID: ${formId}`
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchLeads()}
            disabled={leadsRefetching}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${leadsRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2"
            disabled={!currentForm || leadsLoading}
          >
            <Import className="h-4 w-4" />
            Import Leads
          </Button>
        </div>
      </div>

      {/* Form Info Cards */}
      {currentForm && !formsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="">
              <div className="flex items-center gap-2">
                <Facebook className="h-4 w-4 text-blue-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Status</p>
                  <Badge
                    variant="secondary"
                    className={getStatusColor(currentForm.status)}
                  >
                    {formatFormStatus(currentForm.status)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total Leads</p>
                  <p className="text-2xl font-bold">
                    {currentForm.leads_count}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-purple-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Category</p>
                  <Badge variant="outline">
                    {currentForm.suggested_category}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-orange-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Confidence</p>
                  <Badge
                    variant="secondary"
                    className={getConfidenceColor(
                      currentForm.mapping_confidence
                    )}
                  >
                    {formatConfidenceLevel(currentForm.mapping_confidence)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Mapping Details */}
      {currentForm && !formsLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              Category Mapping Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Mapping Reasoning</p>
                <p className="text-sm text-muted-foreground">
                  {currentForm.category_mapping.reasoning}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Matched Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {currentForm.category_mapping.matched_keywords.map(
                    (keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={previewLimit.toString()}
          onValueChange={(value) => setPreviewLimit(parseInt(value))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 leads</SelectItem>
            <SelectItem value="25">25 leads</SelectItem>
            <SelectItem value="50">50 leads</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {leadsError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load lead preview.{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-destructive underline"
              onClick={() => refetchLeads()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Leads Preview Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Lead Preview
              {!leadsLoading && (
                <Badge variant="secondary" className="ml-2">
                  {filteredLeads.length} of {leads.length} leads
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead Info</TableHead>
                  <TableHead>Contact Details</TableHead>
                  <TableHead>Course Interest</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Education</TableHead>
                  <TableHead>Created Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsLoading ? (
                  <TableSkeleton />
                ) : filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-8 w-8" />
                        <p>
                          {searchQuery
                            ? "No leads match your search."
                            : "No leads found in preview."}
                        </p>
                        {searchQuery && (
                          <Button
                            variant="link"
                            className="p-0 h-auto"
                            onClick={() => setSearchQuery("")}
                          >
                            Clear search
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">
                              {lead.name ||
                                lead.raw_field_data?.["full name"] ||
                                "N/A"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            ID: {lead.facebook_lead_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {lead.email || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {lead.phone || "N/A"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {lead.course_interest || "Not specified"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          {lead.city || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {lead.age ||
                            lead.raw_field_data?.["age_information"] ||
                            "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {lead.experience ||
                            lead.raw_field_data?.["years_of_experience_?_"] ||
                            "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {lead.education ||
                            lead.raw_field_data?.[
                              "what_is_your_current__qualification?"
                            ] ||
                            "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-muted-foreground">
                          {formatDate(lead.created_time)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Results Info */}
      {!leadsLoading && filteredLeads.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {filteredLeads.length} of {leads.length} leads
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
          <p>
            Previewing {previewLimit} leads from total{" "}
            {currentForm?.leads_count || 0} leads
          </p>
        </div>
      )}

      {/* Import Modal */}
      <ImportLeadsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        formId={formId}
        formName={currentForm?.name || ""}
        totalLeads={currentForm?.leads_count || 0}
        suggestedCategory={currentForm?.suggested_category || ""}
      />
    </div>
  );
}
