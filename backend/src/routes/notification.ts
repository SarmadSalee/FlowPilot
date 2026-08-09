import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { wrap } from '../utils/http';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/', wrap(notificationController.list));
notificationRouter.get('/unread-count', wrap(notificationController.unreadCount));
notificationRouter.post('/:id/read', wrap(notificationController.markRead));
notificationRouter.post('/read-all', wrap(notificationController.markAllRead));