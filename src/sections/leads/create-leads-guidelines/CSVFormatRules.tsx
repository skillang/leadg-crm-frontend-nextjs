import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CSVFormatRulesCard = () => {
  return (
    <div>
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            CSV Upload Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Required Columns */}
          <div>
            <h4 className="font-semibold text-sm text-red-600 mb-2">
              🔴 Required Columns (Must Include):
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex flex-wrap items-center gap-1">
                <Badge variant="destructive" className="text-xs">
                  name
                </Badge>
                <Badge variant="destructive" className="text-xs">
                  email
                </Badge>
                <Badge variant="destructive" className="text-xs">
                  contact_number
                </Badge>
              </div>
            </div>
          </div>

          {/* Optional Columns */}
          <div>
            <h4 className="font-semibold text-sm text-green-600 mb-2">
              🟢 Optional Columns:
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex flex-wrap items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  age
                </Badge>
                <Badge variant="outline" className="text-xs">
                  nationality
                </Badge>
                <Badge variant="outline" className="text-xs">
                  current_location
                </Badge>
                <Badge variant="outline" className="text-xs">
                  experience
                </Badge>
                <Badge variant="outline" className="text-xs">
                  country_of_interest
                </Badge>
                <Badge variant="outline" className="text-xs">
                  course_level
                </Badge>
                <Badge variant="outline" className="text-xs">
                  stage
                </Badge>
                <Badge variant="outline" className="text-xs">
                  status
                </Badge>
                <Badge variant="outline" className="text-xs">
                  notes
                </Badge>
                <Badge variant="outline" className="text-xs">
                  tags
                </Badge>
                <Badge variant="outline" className="text-xs">
                  lead_score
                </Badge>

                <Badge variant="outline" className="text-xs">
                  date_of_birth
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CSVFormatRulesCard;
