import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileType } from "lucide-react";

const HeaderMappingRulesCard = () => {
  return (
    <div>
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileType className="h-4 w-4 text-purple-500" />
            Header Mapping Guide
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            System automatically maps these column names
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Name Mappings */}
          <div>
            <h5 className="font-medium text-xs mb-1">📝 Name Field:</h5>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>✓ name, full name, fullname</div>
              <div>✓ lead name, customer name, student name</div>
              <div>✓ CANDIDATE NAME, Name</div>
            </div>
          </div>

          {/* Email Mappings */}
          <div>
            <h5 className="font-medium text-xs mb-1">📧 Email Field:</h5>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>✓ email, email address, e-mail</div>
              <div>✓ mail, email id, Mail ID, Mail id</div>
            </div>
          </div>

          {/* Phone Mappings */}
          <div>
            <h5 className="font-medium text-xs mb-1">📞 Contact Field:</h5>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>✓ contact_number, contact number</div>
              <div>✓ phone, phone number, mobile</div>
              <div>✓ mobile number, telephone, tel</div>
              <div>✓ PHONE NUMBER, Phone Number</div>
            </div>
          </div>

          {/* Country Mappings */}
          <div>
            <h5 className="font-medium text-xs mb-1">🌍 Country Field:</h5>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>✓ country_of_interest, country of interest</div>
              <div>✓ preferred country, destination country</div>
              <div>✓ target country, country, Interested Country</div>
            </div>
          </div>

          {/* Course Level Mappings */}
          <div>
            <h5 className="font-medium text-xs mb-1">🎓 Course Level:</h5>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>✓ course_level, course level</div>
              <div>✓ education level, degree level, study level</div>
            </div>
          </div>

          {/* Stage & Status Mappings */}
          <div>
            <h5 className="font-medium text-xs mb-1">📊 Stage & Status:</h5>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>✓ stage, lead stage, current stage</div>
              <div>✓ opportunity stage, sales stage, pipeline stage</div>
              <div>✓ status, lead status, current status</div>
              <div>✓ Status, STATUS</div>
            </div>
          </div>

          {/* Experience Mappings */}
          <div>
            <h5 className="font-medium text-xs mb-1">💼 Experience:</h5>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>✓ experience, years of experience</div>
              <div>✓ total experience</div>
              <div className="text-blue-600 font-medium">
                Valid values: fresher, 1_to_3_years, 3_to_5_years,
                5_to_10_years, 10+_years
              </div>
            </div>
          </div>

          {/* Notes Mappings */}
          <div>
            <h5 className="font-medium text-xs mb-1">📝 Notes Field:</h5>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>✓ notes, note, comment, comments</div>
              <div>✓ remarks, description, areas of interest</div>
              <div>✓ other details</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HeaderMappingRulesCard;
