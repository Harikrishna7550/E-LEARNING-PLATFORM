const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const { getUsers, deleteUser } = require('../controllers/userController');

router.get('/', auth, authorize('admin', 'instructor'), getUsers);
router.delete('/:id', auth, authorize('admin'), deleteUser);

module.exports = router;
