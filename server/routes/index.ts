import { Router } from 'express';
import { IStorage } from '../storage';
import setupUserDashboardRoutes from './user-dashboard';

export default function setupRoutes(router: Router, storage: IStorage) {
  // User dashboard routes
  setupUserDashboardRoutes(router, storage);
  
  return router;
}