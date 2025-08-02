// src/utils/getFileIconForDocument.tsx

import React from "react";
import { FileText } from "lucide-react";

/**
 * Returns the appropriate file icon based on MIME type
 * @param mimeType - The MIME type of the document
 * @param size - Size of the icon (default: "h-6 w-6")
 * @returns React.ReactElement - The file icon component
 */
export const getFileIconForDocument = (
  mimeType: string,
  size: string = "h-6 w-6"
): React.ReactElement => {
  if (mimeType.includes("pdf")) {
    return (
      <img
        src="/assets/icons/documents/pdf-icon.svg"
        alt="PDF icon"
        className={size}
      />
    );
  } else if (mimeType.includes("image")) {
    return (
      <img
        src="/assets/icons/documents/image-icon.svg"
        alt="Image icon"
        className={size}
      />
    );
  } else if (mimeType.includes("word") || mimeType.includes("document")) {
    return (
      <img
        src="/assets/icons/documents/word-doc-icon.svg"
        alt="Word document icon"
        className={size}
      />
    );
  } else {
    return <FileText className={`${size} text-gray-600`} />;
  }
};
