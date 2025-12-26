import axios from 'axios';

// Use VITE_KG_API_URL environment variable (set in .env or .env.local)
// This corresponds to KG_API_URL in the plan, but Vite requires VITE_ prefix for client-side env vars
const GATEWAY_API_BASE_URL = import.meta.env.VITE_KG_API_URL || 'http://localhost:2378/api';

const gatewayApi = axios.create({
  baseURL: GATEWAY_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add x-user-id header to all requests
gatewayApi.interceptors.request.use((config) => {
  // Extract userId from custom _userId property (TypeScript-safe workaround)
  const userId = (config as any)._userId;
  if (userId) {
    config.headers['x-user-id'] = userId;
    delete (config as any)._userId;
  }
  return config;
});

export interface Dataspace {
  _id: string;
  name: string;
  description?: string;
  tags?: string[];
}

export interface Dataset {
  _id: string;
  name: string;
  description?: string;
  type: string;
  state?: string;
  cogneeDatasetId?: string;
  owningDataspaceId?: string;
}

export interface Document {
  document_id: string;
  name: string;
  extension?: string;
  mime_type?: string;
  ingested_at: string;
  entity_types?: string[];
  relationship_types?: string[];
}

export interface SearchResult {
  results: any[];
  query: string;
}

// Dataspace functions
export const listDataspaces = async (userId: string): Promise<Dataspace[]> => {
  const response = await gatewayApi.get('/dataspaces', {
    params: { user_id: userId },
    _userId: userId,
  } as any);
  return response.data;
};

export const createDataspace = async (
  userId: string,
  data: { name: string; description?: string }
): Promise<Dataspace> => {
  const response = await gatewayApi.post('/dataspaces', data, {
    _userId: userId,
  } as any);
  return response.data;
};

export const deleteDataspace = async (userId: string, dataspaceId: string): Promise<void> => {
  await gatewayApi.delete(`/dataspaces/${dataspaceId}`, {
    _userId: userId,
  } as any);
};

// Dataset functions
export const listDatasets = async (userId: string, dataspaceId: string): Promise<Dataset[]> => {
  const response = await gatewayApi.get(`/dataspaces/${dataspaceId}/datasets`, {
    _userId: userId,
  } as any);
  return response.data;
};

export const getAllDatasets = async (userId: string): Promise<Dataset[]> => {
  const response = await gatewayApi.get('/datasets', {
    _userId: userId,
  } as any);
  return response.data;
};

export const createDataset = async (
  userId: string,
  dataspaceId: string,
  data: { name: string; description?: string; type?: string }
): Promise<Dataset> => {
  const response = await gatewayApi.post(`/dataspaces/${dataspaceId}/datasets`, data, {
    _userId: userId,
  } as any);
  const result = response.data;
  // Convert response format to Dataset format
  return {
    _id: result.dataset_id || result._id,
    name: result.name,
    description: result.description,
    type: result.type,
    state: result.state,
    cogneeDatasetId: result.cognee_dataset_id,
  };
};

export const getDataset = async (userId: string, datasetId: string): Promise<Dataset> => {
  const response = await gatewayApi.get(`/datasets/${datasetId}`, {
    _userId: userId,
  } as any);
  return response.data;
};

// Document functions
export const uploadDocument = async (
  userId: string,
  datasetId: string,
  file: File
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await gatewayApi.post(
    `/datasets/${datasetId}/ingest`,
    formData,
    {
      _userId: userId,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } as any
  );
  return response.data;
};

export const listDocuments = async (
  userId: string,
  datasetId: string
): Promise<{ documents: Document[]; document_count: number }> => {
  const response = await gatewayApi.get(`/datasets/${datasetId}/documents`, {
    _userId: userId,
  } as any);
  return response.data;
};

// Cognify function
export const cognifyDataset = async (userId: string, datasetId: string): Promise<any> => {
  const response = await gatewayApi.post(`/datasets/${datasetId}/cognify`, {}, {
    _userId: userId,
  } as any);
  return response.data;
};

// Prime context function
export const getPrimeContext = async (
  userId: string,
  datasetIds: string[]
): Promise<{ context: string; datasets: any[] }> => {
  const response = await gatewayApi.get('/datasets/prime-context', {
    params: { dataset_ids: datasetIds.join(',') },
    _userId: userId,
  } as any);
  return response.data;
};

// Search function
export const search = async (
  userId: string,
  query: string,
  datasetIds?: string[],
  topK?: number
): Promise<SearchResult> => {
  const payload: any = {
    query,
    user_id: userId,
  };
  if (datasetIds && datasetIds.length > 0) {
    payload.dataset_ids = datasetIds;
  }
  if (topK) {
    payload.top_k = topK;
  }
  const response = await gatewayApi.post('/search', payload, {
    _userId: userId,
  } as any);
  return response.data;
};

export default gatewayApi;

