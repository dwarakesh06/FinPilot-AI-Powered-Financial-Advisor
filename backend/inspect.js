const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const inspect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_expense_tracker');
    console.log('Connected to DB');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check users collection indexes
    try {
      const indexes = await mongoose.connection.db.collection('users').indexes();
      console.log('Indexes on users collection:', JSON.stringify(indexes, null, 2));
    } catch (e) {
      console.log('Error getting indexes on users collection:', e.message);
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error(error);
  }
};

inspect();
