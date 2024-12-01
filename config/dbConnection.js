const mongoose = require("mongoose")
const { MongoClient } = require("mongodb");

const connectDb = async () =>{
    try{

        const connect = await MongoClient.connect(process.env.MONGODB_CONNECTION);

        console.log("Connected to MongoDB");
        const dbName = "Transaction_DB"
        // Access the database
        const db = connect.db(dbName);
        // Return the collection object
        return db.collection("transaction");

    }catch(err){
        console.log(err);
        process.exit(1);
    }
}

module.exports = connectDb