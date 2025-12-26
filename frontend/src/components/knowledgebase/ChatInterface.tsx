import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { search, getAllDatasets, type Dataset } from '@/utils/gatewayApi';

interface ChatInterfaceProps {
  userId: string | null;
}

export const ChatInterface = ({ userId }: ChatInterfaceProps) => {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(10);
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<string[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchDatasets();
    } else {
      setDatasets([]);
      setSelectedDatasetIds([]);
    }
  }, [userId]);

  const fetchDatasets = async () => {
    if (!userId) return;
    try {
      const data = await getAllDatasets(userId);
      // Only show cognified datasets
      const cognifiedDatasets = data.filter(
        (ds) =>
          (ds.state === 'cognified' || ds.state === 'ready_to_use') &&
          ds.cogneeDatasetId &&
          !ds.cogneeDatasetId.startsWith('temp-')
      );
      setDatasets(cognifiedDatasets);
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
    }
  };

  const handleSendQuery = async () => {
    if (!userId || !query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Map MongoDB IDs to Cognee dataset IDs
      const cogneeDatasetIds = datasets
        .filter((ds) => selectedDatasetIds.includes(ds._id))
        .map((ds) => ds.cogneeDatasetId)
        .filter((id): id is string => !!id);

      const searchResult = await search(userId, query.trim(), cogneeDatasetIds, topK);
      setResult(searchResult);
    } catch (error: any) {
      setError(error.response?.data?.error || error.message || 'Failed to execute query');
    } finally {
      setLoading(false);
    }
  };

  const toggleDataset = (datasetId: string) => {
    setSelectedDatasetIds((prev) =>
      prev.includes(datasetId)
        ? prev.filter((id) => id !== datasetId)
        : [...prev, datasetId]
    );
  };

  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chat with Cognee</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Select a user to chat with Cognee</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat with Cognee</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Query</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your question here..."
            className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSendQuery();
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Select Datasets</label>
          {datasets.length === 0 ? (
            <p className="text-sm text-gray-500">
              No cognified datasets available. Cognify some datasets first.
            </p>
          ) : (
            <div className="max-h-32 overflow-y-auto space-y-2 border rounded p-2">
              {datasets.map((dataset) => {
                const datasetId = dataset._id;
                return (
                  <label
                    key={datasetId}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDatasetIds.includes(datasetId)}
                      onChange={() => toggleDataset(datasetId)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">
                      {dataset.name} ({dataset.state})
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Top K:</label>
          <Input
            type="number"
            value={topK}
            onChange={(e) => setTopK(parseInt(e.target.value) || 10)}
            min={1}
            max={100}
            className="w-20"
          />
          <Button onClick={handleSendQuery} disabled={loading || !query.trim()} className="flex-1">
            {loading ? 'Sending...' : 'Send Query'}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            Error: {error}
          </div>
        )}

        {result && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Results:</div>
            <pre className="bg-gray-50 p-4 rounded border text-xs overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

