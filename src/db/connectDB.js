import mongoose from 'mongoose';
import { DB_NAME } from "../constants.js";

// Define an asynchronous function to connect to the MongoDB database
const connectDB = async () => {
  try {
    // Try to establish a connection using mongoose
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      'MONGODB Conncetion SUCCESSFULL ! MongoDB Host : ',
      connectionInstance.connection.host
    );


  } catch (error) {
    console.log(`MONGODB Conncetion FAILED : ${error.message}`);
    // Exit the process with failure status
    process.exit(1);
  }
};

export default connectDB;