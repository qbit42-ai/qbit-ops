import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import api from '@/utils/api';

const UserDetail = () => {
  const { id } = useParams();
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/users/${id}`);
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmulate = async () => {
    if (!confirm(`Are you sure you want to login as ${user?.email}?`)) {
      return;
    }

    setMinting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/tokens/emulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        credentials: 'include',
        body: JSON.stringify({ userId: id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to emulate user');
      }

      const data = await response.json();
      
      // Open redirect URL in a new tab
      if (data.redirectUrl) {
        window.open(data.redirectUrl, '_blank');
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (error) {
      console.error('Failed to emulate user:', error);
      alert(error instanceof Error ? error.message : 'Failed to emulate user. Please try again.');
    } finally {
      setMinting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">User not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">Qbit Ops</h1>
              <Button variant="ghost" onClick={() => navigate('/users')}>
                Back to Users
              </Button>
            </div>
            <div className="flex items-center">
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-lg">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-lg">{user.name || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Username</label>
              <p className="text-lg">{user.username || '-'}</p>
            </div>
            {user.organisations && user.organisations.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Organisations</label>
                <ul className="mt-2 space-y-2">
                  {user.organisations.map((org: any) => (
                    <li key={org.organisationId} className="p-2 bg-gray-50 rounded">
                      {org.name} ({org.roleId})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="pt-4 border-t">
              <Button onClick={handleEmulate} disabled={minting} className="w-full">
                {minting ? 'Logging in...' : 'Login as User'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserDetail;
