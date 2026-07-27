'use client';

interface VersionDisplayProps {
  className?: string;
}

export default function VersionDisplay({ className = '' }: VersionDisplayProps) {
  // Only show version in non-production environments
  const showVersion = process.env.NEXT_PUBLIC_SHOW_VERSION === 'true';
  
  if (!showVersion) {
    return null;
  }

  const awsBuildId = process.env.AWS_BUILD_ID || process.env.BUILD_ID || 'unknown';
  const awsCommitId = process.env.AWS_COMMIT_ID || process.env.COMMIT_HASH || 'unknown';
  
  // Remove leading zeros from AWS_BUILD_ID and get first 6 characters of commit ID
  const trimmedBuildId = awsBuildId.replace(/^0+/, '') || '0'; // Keep at least one zero if all zeros
  const shortCommitId = awsCommitId.substring(0, 6);
  
  return (
    <div className={`text-xs font-mono ${className}`}>
      <span className="inline-flex items-center gap-1">
        <span>App Info :</span>
        <span>{trimmedBuildId}-{shortCommitId}</span>
      </span>
    </div>
  );
}