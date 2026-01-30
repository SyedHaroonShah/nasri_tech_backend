import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Admin } from '../models/admin.model.js';
import { DB_NAME } from '../constants.js';

dotenv.config({
  path: './.env',
});

mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

await Admin.create({
  fullName: 'Super Admin',
  email: 'admin@nasritech.com',
  phoneNumber: '03000000000',
  password: 'Admin@123',
  role: 'super_admin',
});

console.log('Admin created');
process.exit();
