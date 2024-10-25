# MongoDB URI / KnifeMxtiyYT

## [Easy YouTube Tutorial](https://youtu.be/BY5paXi4NF8)

## (1): Set Up MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create an account.

## (2): Create a Cluster
1. Click on “Build a Cluster.”
2. Choose the free tier and set your configurations.
3. Wait for the cluster to provision.

## (3): Configure Network Access
1. Navigate to "Network Access."
2. Add IP Address `0.0.0.0/0` to allow access from anywhere.

## (4): Create a Database User
1. Go to “Database Access.”
2. Click on “Add New Database User.”
3. Set username, password, and privileges.

## (5): Get the Connection String
1. Navigate to “Clusters.”
2. Click “Connect” and then “Connect your application.”
3. Modify the connection string with your credentials.

## (6): Use the Connection URI (Example)
1. Setup the MongoDB URI in the config file
   ```javascript
   export const MONGO_URI = "mongodb+srv://myUser:myPassword@cluster0.mongodb.net/myDatabase?retryWrites=true&w=majority";
