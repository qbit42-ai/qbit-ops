import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { CopyButton } from '@/components/CopyButton';
import { UserSelector } from '@/components/knowledgebase/UserSelector';
import { DataspaceWidget } from '@/components/knowledgebase/DataspaceWidget';
import { DatasetWidget } from '@/components/knowledgebase/DatasetWidget';
import { DocumentUpload } from '@/components/knowledgebase/DocumentUpload';
import { DocumentList } from '@/components/knowledgebase/DocumentList';
import { PrimeContextViewer } from '@/components/knowledgebase/PrimeContextViewer';
import { ChatInterface } from '@/components/knowledgebase/ChatInterface';
import { cognifyDataset, getDataset, type Dataset } from '@/utils/gatewayApi';

const KnowledgeBase = () => {
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedDataspaceId, setSelectedDataspaceId] = useState<string | null>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [cognifying, setCognifying] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (selectedUserId) {
      setSelectedDataspaceId(null);
      setSelectedDatasetId(null);
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (selectedDataspaceId) {
      setSelectedDatasetId(null);
    }
  }, [selectedDataspaceId]);

  useEffect(() => {
    if (selectedUserId && selectedDatasetId) {
      fetchDatasetDetails();
    } else {
      setSelectedDataset(null);
    }
  }, [selectedUserId, selectedDatasetId]);

  const fetchDatasetDetails = async () => {
    if (!selectedUserId || !selectedDatasetId) return;
    try {
      const dataset = await getDataset(selectedUserId, selectedDatasetId);
      setSelectedDataset(dataset);
    } catch (error) {
      console.error('Failed to fetch dataset details:', error);
    }
  };

  const handleCognify = async () => {
    if (!selectedUserId || !selectedDatasetId) return;

    if (!confirm('Start cognify process for this dataset?')) {
      return;
    }

    setCognifying(true);
    try {
      await cognifyDataset(selectedUserId, selectedDatasetId);
      
      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const dataset = await getDataset(selectedUserId, selectedDatasetId);
          setSelectedDataset(dataset);
          
          if (dataset.state === 'cognified' || dataset.state === 'ready_to_use') {
            clearInterval(pollInterval);
            setCognifying(false);
            alert('Cognify completed successfully!');
            setRefreshTrigger((prev) => prev + 1);
          }
        } catch (error) {
          console.error('Error polling dataset state:', error);
        }
      }, 2000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setCognifying(false);
      }, 5 * 60 * 1000);
    } catch (error: any) {
      alert(`Failed to start cognify: ${error.response?.data?.error || error.message}`);
      setCognifying(false);
    }
  };

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const canCognify = selectedDataset && selectedDataset.state !== 'cognified' && selectedDataset.state !== 'ready_to_use';

  return (
    <Layout
      navActions={
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          Dashboard
        </Button>
      }
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Knowledge Base</h2>
        <p className="text-gray-600">Manage dataspaces, datasets, and interact with Cognee</p>
      </div>

      <div className="mb-6">
        <UserSelector
          selectedUserId={selectedUserId}
          onSelectUser={(userId) => setSelectedUserId(userId)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Side Panel */}
        <div className="lg:col-span-1 space-y-4">
          <DataspaceWidget
            userId={selectedUserId}
            selectedDataspaceId={selectedDataspaceId}
            onSelectDataspace={setSelectedDataspaceId}
          />
          <DatasetWidget
            userId={selectedUserId}
            dataspaceId={selectedDataspaceId}
            selectedDatasetId={selectedDatasetId}
            onSelectDataset={setSelectedDatasetId}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {selectedDatasetId && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedDataset?.name || 'Selected Dataset'}
                    </h3>
                    {selectedDataset?.state && (
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          selectedDataset.state === 'cognified' || selectedDataset.state === 'ready_to_use'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {selectedDataset.state}
                      </span>
                    )}
                  </div>
                  <CopyButton text={selectedDatasetId} />
                </div>
                {canCognify && (
                  <Button
                    onClick={handleCognify}
                    disabled={cognifying}
                    variant={cognifying ? 'secondary' : 'default'}
                  >
                    {cognifying ? 'Cognifying...' : 'Cognify Dataset'}
                  </Button>
                )}
              </div>

              <DocumentUpload
                userId={selectedUserId}
                datasetId={selectedDatasetId}
                onUploadComplete={handleUploadComplete}
              />

              <DocumentList
                key={refreshTrigger}
                userId={selectedUserId}
                datasetId={selectedDatasetId}
              />

              <PrimeContextViewer userId={selectedUserId} datasetId={selectedDatasetId} />
            </>
          )}

          <ChatInterface userId={selectedUserId} />
        </div>
      </div>
    </Layout>
  );
};

export default KnowledgeBase;

