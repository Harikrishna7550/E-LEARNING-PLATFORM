const User = require('../models/User');

const findUserByEmail = async (email) => {
  return User.findOne({ email });
};

const findUserById = async (id) => {
  return User.findById(id);
};

const createUser = async (userData) => {
  return User.create(userData);
};

const saveUser = async (user) => {
  return user.save();
};

const getAllUsers = async () => {
  return User.find().select('-password');
};

const deleteUserById = async (id) => {
  return User.findByIdAndDelete(id);
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  saveUser,
  getAllUsers,
  deleteUserById,
};