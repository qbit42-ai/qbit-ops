import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { listDocuments, type Document } from '@/utils/gatewayApi';

interface DocumentListProps {
  userId: string | null;
  datasetId: string | null;
}

export const DocumentList = ({ userId, datasetId }: DocumentListProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && datasetId) {
      fetchDocuments();
    } else {
      setDocuments([]);
    }
  }, [userId, datasetId]);

  const fetchDocuments = async () => {
    if (!userId || !datasetId) return;
    setLoading(true);
    try {
      const data = await listDocuments(userId, datasetId);
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userId || !datasetId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Select a user and dataset to view documents</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Documents ({documents.length})</CardTitle>
          <button
            onClick={fetchDocuments}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-500">Loading documents...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-gray-500">No documents found. Upload some files to get started.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {documents.map((doc) => (
              <div
                key={doc.document_id}
                className="p-3 bg-gray-50 rounded border border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{doc.name || 'Unnamed Document'}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {doc.extension && `Type: ${doc.extension} • `}
                      {doc.mime_type && `MIME: ${doc.mime_type} • `}
                      Uploaded: {new Date(doc.ingested_at).toLocaleString()}
                    </div>
                    {doc.entity_types && doc.entity_types.length > 0 && (
                      <div className="text-xs text-gray-600 mt-2">
                        Entities: {doc.entity_types.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

