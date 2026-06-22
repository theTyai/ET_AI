import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { UserModel } from '../models/User.model';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.middleware';
import { JWTPayload, UserRole, UserPermission } from '@ikip/shared';

const router = Router();

// Helper to map roles to fine-grained permissions
const getPermissionsForRole = (role: UserRole): UserPermission[] => {
  const permissions: Record<UserRole, UserPermission[]> = {
    SuperAdmin: [
      'documents:read', 'documents:write', 'documents:delete',
      'equipment:read', 'equipment:write', 'workorders:read', 'workorders:write',
      'incidents:read', 'incidents:write', 'compliance:read', 'compliance:write',
      'kg:read', 'kg:write'
    ],
    PlantAdmin: [
      'documents:read', 'documents:write', 'documents:delete',
      'equipment:read', 'equipment:write', 'workorders:read', 'workorders:write',
      'incidents:read', 'incidents:write', 'compliance:read', 'compliance:write',
      'kg:read', 'kg:write'
    ],
    Engineer: [
      'documents:read', 'documents:write', 'equipment:read', 'equipment:write',
      'workorders:read', 'workorders:write', 'incidents:read', 'compliance:read',
      'compliance:write', 'kg:read', 'kg:write'
    ],
    Technician: [
      'documents:read', 'equipment:read', 'workorders:read', 'workorders:write',
      'incidents:read', 'incidents:write', 'kg:read'
    ],
    Operator: ['documents:read', 'equipment:read', 'kg:read'],
    Auditor: ['documents:read', 'equipment:read', 'compliance:read', 'kg:read'],
    Viewer: ['documents:read']
  };
  return permissions[role] || [];
};

const generateTokens = (user: any) => {
  const payload: JWTPayload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    plantId: user.plantId.toString(),
    additionalPlants: (user.additionalPlants || []).map((p: any) => p.toString()),
    permissions: getPermissionsForRole(user.role),
  };

  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY as any });
  const refreshToken = jwt.sign({ sub: user._id.toString() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
  });

  return { token, refreshToken };
};

// POST /auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, role, plantId } = req.body;

  try {
    const existing = await UserModel.findOne({ email });
    if (existing) {
      res.status(400).json({ success: false, error: 'User with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new UserModel({
      email,
      passwordHash,
      name,
      role,
      plantId,
    });

    await user.save();

    const { token, refreshToken } = generateTokens(user);
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          plantId: user.plantId,
        },
        token,
        refreshToken,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const matches = await user.comparePassword(password);
    if (!matches) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const { token, refreshToken } = generateTokens(user);
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          plantId: user.plantId,
        },
        token,
        refreshToken,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /auth/me
router.get('/me', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await UserModel.findById(req.user?.sub).populate('plantId', 'name location');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          plantId: user.plantId,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ success: false, error: 'Refresh token is required' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
    const user = await UserModel.findById(decoded.sub);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid refresh token: User not found' });
      return;
    }

    const { token, refreshToken: newRefreshToken } = generateTokens(user);
    res.json({
      success: true,
      data: {
        token,
        refreshToken: newRefreshToken,
      },
    });
  } catch (err) {
    res.status(403).json({ success: false, error: 'Invalid or expired refresh token' });
  }
});

// GET /auth/plants
router.get('/plants', async (req: Request, res: Response): Promise<void> => {
  try {
    const plants = await UserModel.db.model('Plant').find({});
    res.json({ success: true, data: plants });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
