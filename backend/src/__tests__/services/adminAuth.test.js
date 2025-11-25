const { loginAdmin } = require('../../services/adminAuth');
const Admin = require('../../models/Admin');
const mongoose = require('mongoose');

// Mock environment variables
process.env.ADMIN_JWT_SECRET = 'test-admin-secret';

// Mock Admin model
jest.mock('../../models/Admin');

describe('Admin Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginAdmin', () => {
    it('should login admin with valid credentials', async () => {
      const mockAdmin = {
        _id: new mongoose.Types.ObjectId(),
        email: 'admin@test.com',
        password: 'hashedPassword',
        role: 'admin',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };

      Admin.findOne = jest.fn().mockResolvedValue(mockAdmin);

      const result = await loginAdmin('admin@test.com', 'password123');

      expect(result.token).toBeDefined();
      expect(result.admin.email).toBe('admin@test.com');
      expect(mockAdmin.comparePassword).toHaveBeenCalledWith('password123');
    });

    it('should throw error with invalid credentials', async () => {
      Admin.findOne = jest.fn().mockResolvedValue(null);

      await expect(loginAdmin('admin@test.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });
});
