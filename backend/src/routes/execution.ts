import { Router } from 'express';
import { executionController } from '../controllers/executionController';
import { authenticate } from '../middleware/auth';
import { wrap } from '../utils/http';

export const executionRouter = Router();

executionRouter.use(authenticate);

executionRouter.get('/', wrap(executionController.list));
executionRouter.get('/:id', wrap(executionController.getById));