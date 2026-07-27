"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { FileText } from "lucide-react";
import { Card } from "@/design-system";
import { EcourtFile } from "@/app/organization/types/ecourtTypes";
import { DownloadButton } from "./parts";

interface JudgmentTabProps {
  files: EcourtFile[];
  downloading: Record<string, boolean>;
  onDownload: (orderUrl: string, filename: string) => void;
}

export function JudgmentTab({ files, downloading, onDownload }: JudgmentTabProps) {
  return (
    <>
      {files.map((file, idx) => (
        <React.Fragment key={idx}>
          <Card pad>
            <div className="jfile" style={{ border: 0, padding: 0 }}>
              <span className="fi">
                <FileText aria-hidden />
              </span>
              <div className="jt">
                <b>{file.pdfFile}</b>
              </div>
              <DownloadButton loading={!!downloading[file.pdfFile]} onClick={() => onDownload(file.pdfFile, file.pdfFile)}>
                Download PDF
              </DownloadButton>
              <DownloadButton loading={!!downloading[file.markdownFile]} onClick={() => onDownload(file.markdownFile, file.markdownFile)}>
                .md
              </DownloadButton>
            </div>
          </Card>
          {file.markdownContent && (
            <Card pad>
              <div className="prose-md">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {file.markdownContent}
                </ReactMarkdown>
              </div>
            </Card>
          )}
        </React.Fragment>
      ))}
    </>
  );
}
