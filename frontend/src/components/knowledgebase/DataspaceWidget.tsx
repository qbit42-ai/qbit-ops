import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { listDataspaces, createDataspace, deleteDataspace, type Dataspace } from '@/utils/gatewayApi';

interface DataspaceWidgetProps {
  userId: string | null;
  selectedDataspaceId: string | null;
  onSelectDataspace: (dataspaceId: string | null) => void;
}

export const DataspaceWidget = ({
  userId,
  selectedDataspaceId,
  onSelectDataspace,
}: DataspaceWidgetProps) => {
  const [dataspaces, setDataspaces] = useState<Dataspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDataspaceName, setNewDataspaceName] = useState('');
  const [newDataspaceDescription, setNewDataspaceDescription] = useState('');

  useEffect(() => {
    if (userId) {
      fetchDataspaces();
    } else {
      setDataspaces([]);
      onSelectDataspace(null);
    }
  }, [userId]);

  const fetchDataspaces = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await listDataspaces(userId);
      setDataspaces(data);
    } catch (error) {
      console.error('Failed to fetch dataspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDataspace = async () => {
    if (!userId || !newDataspaceName.trim()) return;
    try {
      const newDataspace = await createDataspace(userId, {
        name: newDataspaceName.trim(),
        description: newDataspaceDescription.trim() || undefined,
      });
      setDataspaces([...dataspaces, newDataspace]);
      setNewDataspaceName('');
      setNewDataspaceDescription('');
      setShowCreateForm(false);
      onSelectDataspace(newDataspace._id);
    } catch (error: any) {
      alert(`Failed to create dataspace: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDeleteDataspace = async (dataspaceId: string) => {
    if (!userId) return;
    if (!confirm('Are you sure you want to delete this dataspace? This will delete all associated datasets.')) {
      return;
    }
    try {
      await deleteDataspace(userId, dataspaceId);
      setDataspaces(dataspaces.filter((d) => d._id !== dataspaceId));
      if (selectedDataspaceId === dataspaceId) {
        onSelectDataspace(null);
      }
    } catch (error: any) {
      alert(`Failed to delete dataspace: ${error.response?.data?.error || error.message}`);
    }
  };

  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dataspaces</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Select a user to view dataspaces</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Dataspaces</CardTitle>
          <Button size="sm" onClick={fetchDataspaces} disabled={loading}>
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
              {dataspaces.length === 0 ? (
                <p className="text-sm text-gray-500">No dataspaces found</p>
              ) : (
                dataspaces.map((dataspace) => (
                  <div
                    key={dataspace._id}
                    className={`p-2 rounded border cursor-pointer ${
                      selectedDataspaceId === dataspace._id
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => onSelectDataspace(dataspace._id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{dataspace.name}</div>
                        {dataspace.description && (
                          <div className="text-xs text-gray-500 mt-1">{dataspace.description}</div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDataspace(dataspace._id);
                        }}
                        className="ml-2"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {!showCreateForm ? (
              <Button size="sm" onClick={() => setShowCreateForm(true)} className="w-full">
                + Create Dataspace
              </Button>
            ) : (
              <div className="space-y-2 p-3 border rounded bg-gray-50">
                <Input
                  placeholder="Dataspace name"
                  value={newDataspaceName}
                  onChange={(e) => setNewDataspaceName(e.target.value)}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newDataspaceDescription}
                  onChange={(e) => setNewDataspaceDescription(e.target.value)}
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleCreateDataspace} className="flex-1">
                    Create
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewDataspaceName('');
                      setNewDataspaceDescription('');
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

