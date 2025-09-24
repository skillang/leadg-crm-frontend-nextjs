import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const ImportantNotesCard = () => {
  return (
    <div>
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            Auto-Generation Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="p-2 bg-green-50 border border-green-200 rounded">
            <div className="font-medium text-green-800">
              ✅ Smart Email Generation:
            </div>
            <div className="text-green-700">
              Missing or invalid emails will be auto-generated as
              notvalidxx123@gmail.com to prevent validation errors. Original
              values are saved in notes.
            </div>
          </div>

          <div className="p-2 bg-blue-50 border border-blue-200 rounded">
            <div className="font-medium text-blue-800">
              📱 Smart Phone Generation:
            </div>
            <div className="text-blue-700">
              Missing or invalid phone numbers will be auto-generated as unique
              10-digit numbers starting with 9. Original values are preserved in
              notes.
            </div>
          </div>

          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
            <div className="font-medium text-yellow-800">
              ⚠️ Auto-Assignment:
            </div>
            <div className="text-yellow-700">
              If stage/status columns are missing or contain invalid values,
              default values will be automatically assigned.
            </div>
          </div>

          <div className="p-2 bg-purple-50 border border-purple-200 rounded">
            <div className="font-medium text-purple-800">
              💡 Data Processing:
            </div>
            <div className="text-purple-700">
              Unmapped columns will be added to the notes field for reference.
              Invalid age/experience values are moved to notes instead of
              causing errors.
            </div>
          </div>

          <div className="p-2 bg-indigo-50 border border-indigo-200 rounded">
            <div className="font-medium text-indigo-800">✅ Tags Format:</div>
            <div className="text-indigo-700">
              Separate multiple tags with semicolons (;). Example:
              urgent;qualified;follow-up
            </div>
          </div>

          <div className="p-2 bg-pink-50 border border-pink-200 rounded">
            <div className="font-medium text-pink-800">📊 Lead Score:</div>
            <div className="text-pink-700">
              Must be a number between 0-100. Invalid scores will cause
              validation errors.
            </div>
          </div>

          <div className="p-2 bg-gray-50 border border-gray-200 rounded">
            <div className="font-medium text-gray-800">
              🔍 Duplicate Detection:
            </div>
            <div className="text-gray-700">
              Backend detects duplicates based on email and phone number.
              Auto-generated values ensure unique entries while preserving
              original data.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportantNotesCard;
