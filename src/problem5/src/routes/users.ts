import { Router } from 'express';
import UserController from '../controllers/UserController';
import { 
  validate, 
  createUserSchema, 
  updateUserSchema, 
  querySchema, 
  idSchema 
} from '../middleware/validation';

const router = Router();

// User routes
router.post(
  '/',
  validate(createUserSchema, 'body'),
  UserController.create.bind(UserController)
);

router.get(
  '/',
  validate(querySchema, 'query'),
  UserController.getAll.bind(UserController)
);

router.get(
  '/:id',
  validate(idSchema, 'params'),
  UserController.getById.bind(UserController)
);

router.put(
  '/:id',
  validate(idSchema, 'params'),
  validate(updateUserSchema, 'body'),
  UserController.update.bind(UserController)
);

router.delete(
  '/:id',
  validate(idSchema, 'params'),
  UserController.delete.bind(UserController)
);

export default router;