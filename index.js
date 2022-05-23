const express = require('express')
const app = express()
var cors = require('cors')
var jwt = require('jsonwebtoken');
require('dotenv').config()

const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())



app.get('/', (req, res) => {
    res.send('This is craftsman server')
})


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://Abid:${process.env.DB_USER_PASSWORD}@cluster0.zhnwx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        console.log(client)

        const database = client.db("db_craftsman");
        const usersCollection = database.collection("users");
        const productsCollection = database.collection("products");


        app.get('/products', async (req, res) => {
            const products = await productsCollection.find().toArray();
            res.send(products);
        });

    }
    finally {

    }
}

run().catch(console.dir);

app.listen(port, () => {
    console.log(`craftsman app is listening on port ${port}`)
})
