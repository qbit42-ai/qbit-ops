import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { listDatasets, createDataset, type Dataset } from '@/utils/gatewayApi';

interface DatasetWidgetProps {
  userId: string | null;
  dataspaceId: string | null;
  selectedDatasetId: string | null;
  onSelectDataset: (datasetId: string | null) => void;
}

export const DatasetWidget = ({
  userId,
  dataspaceId,
  selectedDatasetId,
  onSelectDataset,
}: DatasetWidgetProps) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newDatasetDescription, setNewDatasetDescription] = useState('');
  const [newDatasetType, setNewDatasetType] = useState('documents');

  useEffect(() => {
    if (userId && dataspaceId) {
      fetchDatasets();
    } else {
      setDatasets([]);
      onSelectDataset(null);
    }
  }, [userId, dataspaceId]);

  const fetchDatasets = async () => {
    if (!userId || !dataspaceId) return;
    setLoading(true);
    try {
      const data = await listDatasets(userId, dataspaceId);
      setDatasets(data);
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDataset = async () => {
    if (!userId || !dataspaceId || !newDatasetName.trim()) return;
    try {
      const newDataset = await createDataset(userId, dataspaceId, {
        name: newDatasetName.trim(),
        description: newDatasetDescription.trim() || undefined,
        type: newDatasetType,
      });
      setDatasets([...datasets, newDataset]);
      setNewDatasetName('');
      setNewDatasetDescription('');
      setShowCreateForm(false);
      onSelectDataset(newDataset._id);
    } catch (error: any) {
      alert(`Failed to create dataset: ${error.response?.data?.error || error.message}`);
    }
  };

  const getStateBadge = (state?: string) => {
    if (!state) return null;
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      cognified: 'bg-green-100 text-green-800',
      ready_to_use: 'bg-blue-100 text-blue-800',
    };
    return (
      <span
        className={`text-xs px-2 py-1 rounded ${
          colors[state] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {state}
      </span>
    );
  };

  if (!userId || !dataspaceId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Datasets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Select a dataspace to view datasets</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Datasets</CardTitle>
          <Button size="sm" onClick={fetchDatasets} disabled={loading}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {datasets.length === 0 ? (
                <p className="text-sm text-gray-500">No datasets found</p>
              ) : (
                datasets.map((dataset) => {
                  const datasetId = dataset._id;
                  return (
                    <div
                      key={datasetId}
                      className={`p-2 rounded border cursor-pointer ${
                        selectedDatasetId === datasetId
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => onSelectDataset(datasetId)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{dataset.name}</div>
                          {dataset.description && (
                            <div className="text-xs text-gray-500 mt-1">{dataset.description}</div>
                          )}
                          <div className="mt-1">{getStateBadge(dataset.state)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {!showCreateForm ? (
              <Button size="sm" onClick={() => setShowCreateForm(true)} className="w-full">
                + Create Dataset
              </Button>
            ) : (
              <div className="space-y-2 p-3 border rounded bg-gray-50">
                <Input
                  placeholder="Dataset name"
                  value={newDatasetName}
                  onChange={(e) => setNewDatasetName(e.target.value)}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newDatasetDescription}
                  onChange={(e) => setNewDatasetDescription(e.target.value)}
                />
                <select
                  value={newDatasetType}
                  onChange={(e) => setNewDatasetType(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="documents">Documents</option>
                  <option value="database">Database</option>
                  <option value="api">API</option>
                </select>
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleCreateDataset} className="flex-1">
                    Create
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewDatasetName('');
                      setNewDatasetDescription('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

