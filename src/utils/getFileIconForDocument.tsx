// src/utils/getFileIconForDocument.tsx
import React from "react";
import { FileText } from "lucide-react";
import Image from "next/image";

export const getFileIconForDocument = (
  mimeType: string,
  width: number = 16,
  height: number = 16
): React.ReactElement => {
  if (mimeType.includes("pdf")) {
    return (
      <Image
        src="/assets/icons/documents/pdf-icon.svg"
        alt="PDF icon"
        width={width}
        height={height}
      />
    );
  } else if (mimeType.includes("image")) {
    return (
      <Image
        src="/assets/icons/documents/image-icon.svg"
        alt="Image icon"
        width={width}
        height={height}
      />
    );
  } else if (mimeType.includes("word") || mimeType.includes("document")) {
    return (
      <Image
        src="/assets/icons/documents/word-doc-icon.svg"
        alt="Word document icon"
        width={width}
        height={height}
      />
    );
  } else {
    return <FileText className="text-gray-600" width={width} height={height} />;
  }
};
