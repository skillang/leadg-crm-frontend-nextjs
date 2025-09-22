// src/app/facebook-forms/page.tsx

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Users,
  Calendar,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Eye,
} from "lucide-react";
import StatsCard from "@/components/custom/cards/StatsCard";

const FacebookFormsPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // RTK Query to fetch Facebook forms
  const {
    data: formsResponse,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetFacebookFormsQuery();

  // Extract forms from response
  const forms = formsResponse?.forms || [];

  // Filter forms based on search query
  const filteredForms = forms.filter(
    (form) =>
      form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.suggested_category
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      form.id.includes(searchQuery)
  );

  // Handle row click to navigate to form details
  const handleRowClick = (formId: string) => {
    router.push(`/facebook-integration/${formId}`);
  };

  // Format date for display
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
            <Skeleton className="h-4 w-[250px]" />
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
          <TableCell>
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[60px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[120px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[80px]" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="container mx-auto space-y-4">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Facebook Forms
            </h1>
          </div>
          <p className="text-muted-foreground">
            Manage and import leads from your Facebook ad forms
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Forms"
          value={forms.length}
          isLoading={isLoading}
        />

        <StatsCard
          title="Total Leads"
          value={forms.reduce((total, form) => total + form.leads_count, 0)}
          icon={<Users className="text-green-600" />}
          isLoading={isLoading}
        />

        <StatsCard
          title="Active Forms"
          value={forms.filter((form) => form.status === "ACTIVE").length}
          icon={<Eye className=" text-orange-600" />}
          isLoading={isLoading}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search forms by name, category, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load Facebook forms.{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-destructive underline"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Facebook Forms
              {!isLoading && (
                <Badge variant="secondary" className="ml-2">
                  {filteredForms.length} forms
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
                  <TableHead className="w-[300px]">Form Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Suggested Category</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : filteredForms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <p>
                          {searchQuery
                            ? "No forms match your search."
                            : "No Facebook forms found."}
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
                  filteredForms.map((form) => (
                    <TableRow
                      key={form.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleRowClick(form.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <p className="font-medium">{form.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {form.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getStatusColor(form.status)}
                        >
                          {formatFormStatus(form.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            {form.leads_count}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {form.suggested_category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getConfidenceColor(
                            form.mapping_confidence
                          )}
                        >
                          {formatConfidenceLevel(form.mapping_confidence)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[120px]">
                          {form.category_mapping.matched_keywords
                            .slice(0, 2)
                            .map((keyword, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {keyword}
                              </Badge>
                            ))}
                          {form.category_mapping.matched_keywords.length >
                            2 && (
                            <Badge variant="outline" className="text-xs">
                              +
                              {form.category_mapping.matched_keywords.length -
                                2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(form.created_time)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(form.id);
                          }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
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
      {!isLoading && filteredForms.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {filteredForms.length} of {forms.length} forms
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      )}
    </div>
  );
};

export default FacebookFormsPage;
