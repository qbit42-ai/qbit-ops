import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPrimeContext } from '@/utils/gatewayApi';

interface PrimeContextViewerProps {
  userId: string | null;
  datasetId: string | null;
}

export const PrimeContextViewer = ({ userId, datasetId }: PrimeContextViewerProps) => {
  const [context, setContext] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (userId && datasetId) {
      fetchPrimeContext();
    } else {
      setContext('');
    }
  }, [userId, datasetId]);

  const fetchPrimeContext = async () => {
    if (!userId || !datasetId) return;
    setLoading(true);
    try {
      const data = await getPrimeContext(userId, [datasetId]);
      setContext(data.context || 'No context available');
    } catch (error: any) {
      console.error('Failed to fetch prime context:', error);
      setContext(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!userId || !datasetId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prime Context</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Select a user and dataset to view prime context</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Prime Context Prompt</CardTitle>
          <Button size="sm" onClick={fetchPrimeContext} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-500">Loading context...</p>
        ) : context ? (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 mb-2">
              This is the context string that would be included in the LLM system prompt for this dataset.
            </div>
            <div className="relative">
              <pre
                className={`bg-gray-50 p-4 rounded border text-xs overflow-auto ${
                  expanded ? 'max-h-96' : 'max-h-32'
                }`}
              >
                {context}
              </pre>
              {context.length > 200 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExpanded(!expanded)}
                  className="mt-2"
                >
                  {expanded ? 'Show Less' : 'Show More'}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No context available</p>
        )}
      </CardContent>
    </Card>
  );
};

