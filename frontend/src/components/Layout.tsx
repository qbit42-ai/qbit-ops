import { ReactNode } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: ReactNode;
  navActions?: ReactNode;
  showEmail?: boolean;
}

export const Layout = ({ children, navActions, showEmail = false }: LayoutProps) => {
  const { logout, admin } = useAdminAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">Qbit Ops</h1>
              {navActions}
            </div>
            <div className="flex items-center space-x-4">
              {showEmail && admin?.email && (
                <span className="text-sm text-gray-600">{admin.email}</span>
              )}
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

