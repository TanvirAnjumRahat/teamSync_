import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../config/firebase';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role?: string;
    displayName?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No Bearer token found');
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log(`🔑 Token received: ${token.substring(0, 30)}...`);

    try {
      const decodedToken = await auth.verifyIdToken(token);
      console.log(`✅ Token verified for user: ${decodedToken.uid}`);

      // Get user role from Firestore
      try {
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();

        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          displayName: decodedToken.name || '',
          role: userDoc.exists ? userDoc.data()?.role || 'DEVELOPER' : 'DEVELOPER',
        };
      } catch (firestoreError) {
        console.error('Firestore error fetching user:', firestoreError);
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          displayName: decodedToken.name || '',
          role: 'DEVELOPER',
        };
      }

      next();
    } catch (verifyError) {
      console.error('❌ Token verification failed:', verifyError);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('❌ Auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

export const requireAdmin = requireRole(['ADMIN']);
export const requireManager = requireRole(['ADMIN', 'PROJECT_MANAGER']);
export const verifyToken = authenticate;