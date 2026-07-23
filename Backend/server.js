require("dotenv").config(); // Load environment variables from .env file
const app = require('./src/app'); // Import the Express app instance
const connectToDB = require('./src/config/database'); // Import the database connection function


connectToDB(); // Connect to the MongoDB database
app.listen(3000, () => {
    console.log('Server is running on port 3000');
})