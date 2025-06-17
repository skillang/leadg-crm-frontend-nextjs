"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import {
  IconButton,
  PrimaryActionButton,
  FilterButton,
  ActionButtonGroup,
} from "@/components/ReuableButtonTable";
import {
  CalendarDaysIcon,
  DownloadIcon,
  Grid2X2PlusIcon,
  ListFilterIcon,
  PlusIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

const MyLeadsTopRowComp = () => {
  // Handler functions
  const handleCustomize = () => {
    console.log("Customize clicked");
  };

  const handleFilter = () => {
    console.log("Filter clicked");
  };

  const handleSort = () => {
    console.log("Sort clicked");
  };

  const handleDateFilter = () => {
    console.log("Date filter clicked");
  };

  const handleExportCsv = () => {
    console.log("Export CSV clicked");
  };

  const handleNewLead = () => {
    console.log("New lead clicked");
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Search:", e.target.value);
  };

  return (
    <div className="flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <div className="font-semibold text-2xl">Leads</div>

        <IconButton
          icon={Grid2X2PlusIcon}
          label="Customise"
          onClick={handleCustomize}
        />
      </div>

      {/* Right side */}
      <ActionButtonGroup>
        <Input
          type="text"
          placeholder="Search"
          onChange={handleSearch}
          className="w-64"
        />

        <FilterButton
          icon={ListFilterIcon}
          label="Filter"
          onClick={handleFilter}
          // isActive={true} // Set to true if filter is active
        />

        <FilterButton
          icon={SlidersHorizontalIcon}
          label="Sort"
          onClick={handleSort}
        />

        <FilterButton
          icon={CalendarDaysIcon}
          label="Last 7 days"
          onClick={handleDateFilter}
        />

        <PrimaryActionButton
          icon={DownloadIcon}
          label=".csv"
          variant="blue"
          onClick={handleExportCsv}
        />

        <PrimaryActionButton
          icon={PlusIcon}
          label="New lead"
          variant="blue"
          onClick={handleNewLead}
        />
      </ActionButtonGroup>
    </div>
  );
};

export default MyLeadsTopRowComp;
