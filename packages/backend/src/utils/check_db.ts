import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import PlantModel from '../models/Plant.model';
import UserModel from '../models/User.model';

const run = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
    });
    console.log('MongoDB Connected');

    // Make sure plants exist
    let plants = await PlantModel.find({});
    if (plants.length === 0) {
      console.log('No plants found. Seeding default plants...');
      const defaultPlants = [
        { plantId: 'unit3', name: 'Refinery Unit-3', location: 'Mumbai, MH', industry: 'Refinery' },
        { plantId: 'unit1', name: 'Petrochemical Unit-1', location: 'Vadodara, GJ', industry: 'Petrochemical' },
        { plantId: 'term2', name: 'Storage Terminal-2', location: 'Visakhapatnam, AP', industry: 'Storage' }
      ];
      plants = await PlantModel.insertMany(defaultPlants);
      console.log('Created plants:', plants);
    } else {
      console.log('Existing plants:', plants.length);
    }

    const unit3 = plants.find(p => p.plantId === 'unit3');
    if (!unit3) throw new Error('Unit-3 plant not found');

    const users = await UserModel.find({});
    if (users.length === 0) {
      console.log('No users found. Seeding default users...');
      const passHash = await bcrypt.hash('password123', 10);
      
      const defaultUsers = [
        {
          email: 'admin@plant.in',
          passwordHash: passHash,
          name: 'Super Admin',
          role: 'SuperAdmin',
          plantId: unit3._id,
        },
        {
          email: 'engineer@plant.in',
          passwordHash: passHash,
          name: 'Plant Engineer',
          role: 'Engineer',
          plantId: unit3._id,
        },
        {
          email: 'operator@plant.in',
          passwordHash: passHash,
          name: 'Plant Operator',
          role: 'Operator',
          plantId: unit3._id,
        }
      ];

      const createdUsers = await UserModel.insertMany(defaultUsers);
      console.log('Created users:', createdUsers.map(u => ({ email: u.email, role: u.role })));
    } else {
      console.log('Existing users:', users.length);
    }

  } catch (err) {
    console.error('Error checking/seeding DB:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
};

run();
