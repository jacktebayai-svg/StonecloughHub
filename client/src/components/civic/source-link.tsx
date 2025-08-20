import React from 'react';
import { ExternalLink, FileText, Calendar, MapPin, Clock, CheckCircle } from 'lucide-react';

interface SourceLinkProps {
  sourceUrl: string;
  fileUrl?: string;
  parentPageUrl?: string;
  title?: string;
  type?: 'planning' | 'meeting' | 'spending' | 'budget' | 'document' | 'page';
  dateAdded?: string | Date;
  confidence?: 'low' | 'medium' | 'high';
  location?: string;
  department?: string;
  fileType?: string;
  className?: string;
  showMetadata?: boolean;
  compact?: boolean;
}

/**
 * Enhanced source link component with deep-linking and citation metadata
 * Supports both direct file URLs and parent page URLs for better fact-checking
 */
export const SourceLink: React.FC<SourceLinkProps> = ({
  sourceUrl,
  fileUrl,
  parentPageUrl,
  title,
  type = 'page',
  dateAdded,
  confidence = 'medium',
  location,
  department,
  fileType,
  className = '',
  showMetadata = false,
  compact = false
}) => {
  // Determine the best URL to link to
  const primaryUrl = fileUrl || sourceUrl;
  const secondaryUrl = fileUrl ? (parentPageUrl || sourceUrl) : null;
  
  // Extract domain for display
  const getDomain = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'Invalid URL';
    }
  };

  // Get appropriate icon based on type and file format
  const getIcon = () => {
    if (fileUrl) {
      return <FileText className=\"h-4 w-4\" />;
    }
    
    switch (type) {
      case 'planning':
        return <MapPin className=\"h-4 w-4\" />;
      case 'meeting':
        return <Calendar className=\"h-4 w-4\" />;
      case 'spending':
      case 'budget':
        return <FileText className=\"h-4 w-4\" />;
      default:
        return <ExternalLink className=\"h-4 w-4\" />;
    }
  };

  // Get confidence indicator
  const getConfidenceColor = () => {
    switch (confidence) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Format date
  const formatDate = (date: string | Date): string => {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  // Get file type display
  const getFileTypeDisplay = (url: string): string | null => {
    if (fileType) return fileType.toUpperCase();
    
    const extension = url.split('.').pop()?.toLowerCase();
    if (extension && ['pdf', 'csv', 'xlsx', 'xls', 'doc', 'docx'].includes(extension)) {
      return extension.toUpperCase();
    }
    
    return null;
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 text-sm ${className}`}>
        <a
          href={primaryUrl}
          target=\"_blank\"
          rel=\"noopener noreferrer\"
          className=\"inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline\"
          title={`Source: ${title || getDomain(primaryUrl)}`}
        >
          {getIcon()}
          <span className=\"text-xs\">{getDomain(primaryUrl)}</span>
        </a>
        
        {confidence && (
          <CheckCircle className={`h-3 w-3 ${getConfidenceColor()}`} title={`Confidence: ${confidence}`} />
        )}
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-3 bg-gray-50 ${className}`}>
      {/* Primary source link */}
      <div className=\"flex items-start gap-2\">
        <div className=\"flex-shrink-0 mt-1\">
          {getIcon()}
        </div>
        
        <div className=\"flex-grow min-w-0\">
          <div className=\"flex items-center gap-2 flex-wrap\">
            <a
              href={primaryUrl}
              target=\"_blank\"
              rel=\"noopener noreferrer\"
              className=\"font-medium text-blue-600 hover:text-blue-800 hover:underline break-words\"
              title={`Open source: ${title || primaryUrl}`}
            >
              {title || getDomain(primaryUrl)}
            </a>
            
            {/* File type badge */}
            {getFileTypeDisplay(primaryUrl) && (
              <span className=\"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800\">
                {getFileTypeDisplay(primaryUrl)}
              </span>
            )}
            
            {/* Confidence indicator */}
            <div className=\"flex items-center gap-1\">
              <CheckCircle className={`h-4 w-4 ${getConfidenceColor()}`} />
              <span className={`text-xs ${getConfidenceColor()}`}>
                {confidence} confidence
              </span>
            </div>
          </div>

          {/* Domain and URL preview */}
          <div className=\"text-sm text-gray-600 mt-1\">
            <span className=\"font-mono text-xs bg-gray-100 px-1 rounded\">
              {getDomain(primaryUrl)}
            </span>
          </div>

          {/* Secondary source link (e.g., parent page) */}
          {secondaryUrl && secondaryUrl !== primaryUrl && (
            <div className=\"mt-2 pt-2 border-t border-gray-200\">
              <div className=\"flex items-center gap-1 text-sm text-gray-600\">
                <span>Found on:</span>
                <a
                  href={secondaryUrl}
                  target=\"_blank\"
                  rel=\"noopener noreferrer\"
                  className=\"text-blue-600 hover:text-blue-800 hover:underline\"
                  title={`Parent page: ${secondaryUrl}`}
                >
                  {getDomain(secondaryUrl)}
                </a>
              </div>
            </div>
          )}

          {/* Metadata section */}
          {showMetadata && (
            <div className=\"mt-3 space-y-1 text-sm text-gray-600\">
              {dateAdded && (
                <div className=\"flex items-center gap-1\">
                  <Clock className=\"h-3 w-3\" />
                  <span>Added: {formatDate(dateAdded)}</span>
                </div>
              )}
              
              {location && (
                <div className=\"flex items-center gap-1\">
                  <MapPin className=\"h-3 w-3\" />
                  <span>Location: {location}</span>
                </div>
              )}
              
              {department && (
                <div className=\"flex items-center gap-1\">
                  <span>Department: {department}</span>
                </div>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className=\"mt-3 flex items-center gap-2 text-xs\">
            <button
              onClick={() => navigator.clipboard.writeText(primaryUrl)}
              className=\"text-gray-500 hover:text-gray-700 hover:underline\"
              title=\"Copy URL to clipboard\"
            >
              Copy link
            </button>
            
            {fileUrl && (
              <a
                href={fileUrl}
                download
                className=\"text-gray-500 hover:text-gray-700 hover:underline\"
                title=\"Download file\"
              >
                Download
              </a>
            )}
            
            <button
              onClick={() => window.open(`https://web.archive.org/web/*/${primaryUrl}`, '_blank')}
              className=\"text-gray-500 hover:text-gray-700 hover:underline\"
              title=\"View in Internet Archive\"
            >
              Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Multiple sources component for displaying several sources
 */
interface MultipleSourcesProps {
  sources: Array<{
    sourceUrl: string;
    fileUrl?: string;
    parentPageUrl?: string;
    title?: string;
    type?: SourceLinkProps['type'];
    confidence?: SourceLinkProps['confidence'];
  }>;
  limit?: number;
  compact?: boolean;
  className?: string;
}

export const MultipleSources: React.FC<MultipleSourcesProps> = ({
  sources,
  limit = 3,
  compact = true,
  className = ''
}) => {
  const displaySources = sources.slice(0, limit);
  const remainingCount = sources.length - limit;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className=\"text-sm font-medium text-gray-700 mb-2\">
        Sources ({sources.length}):
      </div>
      
      <div className={compact ? \"space-y-1\" : \"space-y-2\"}>
        {displaySources.map((source, index) => (
          <SourceLink
            key={index}
            {...source}
            compact={compact}
          />
        ))}
      </div>
      
      {remainingCount > 0 && (
        <div className=\"text-xs text-gray-500\">
          + {remainingCount} more source{remainingCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

/**
 * Fact-check banner for highlighting source reliability
 */
interface FactCheckBannerProps {
  confidence: 'high' | 'medium' | 'low';
  sourceCount: number;
  lastVerified?: string | Date;
  className?: string;
}

export const FactCheckBanner: React.FC<FactCheckBannerProps> = ({
  confidence,
  sourceCount,
  lastVerified,
  className = ''
}) => {
  const getBannerStyle = () => {
    switch (confidence) {
      case 'high':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getIcon = () => {
    return <CheckCircle className={`h-4 w-4 ${getConfidenceColor()}`} />;
  };

  const getConfidenceColor = () => {
    switch (confidence) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-red-600';
    }
  };

  const getMessage = () => {
    switch (confidence) {
      case 'high':
        return `Verified information from ${sourceCount} official source${sourceCount !== 1 ? 's' : ''}`;
      case 'medium':
        return `Information from ${sourceCount} source${sourceCount !== 1 ? 's' : ''} - verify independently`;
      case 'low':
        return `Limited verification - ${sourceCount} source${sourceCount !== 1 ? 's' : ''} available`;
    }
  };

  return (
    <div className={`border rounded-lg p-3 ${getBannerStyle()} ${className}`}>
      <div className=\"flex items-center gap-2\">
        {getIcon()}
        <div className=\"flex-grow\">
          <div className=\"font-medium text-sm\">
            {getMessage()}
          </div>
          {lastVerified && (
            <div className=\"text-xs mt-1\">
              Last verified: {new Date(lastVerified).toLocaleDateString('en-GB')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
