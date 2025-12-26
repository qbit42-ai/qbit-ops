import { useState, useEffect } from 'react';
import api from '@/utils/api';

interface User {
  _id: string;
  email: string;
  username?: string;
  name?: string;
}

interface UserSelectorProps {
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
}

export const UserSelector = ({ selectedUserId, onSelectUser }: UserSelectorProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users', {
        params: { limit: 1000 },
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
      <select
        value={selectedUserId || ''}
        onChange={(e) => onSelectUser(e.target.value)}
        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        disabled={loading}
      >
        <option value="">-- Select a user --</option>
        {users.map((user) => (
          <option key={user._id} value={user._id}>
            {user.email} {user.name ? `(${user.name})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

