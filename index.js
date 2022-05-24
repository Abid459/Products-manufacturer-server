const express = require('express')
const app = express()
var cors = require('cors')
var jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())



app.get('/', (req, res) => {
    res.send('This is craftsman server')
})



const uri = `mongodb+srv://Abid:${process.env.DB_USER_PASSWORD}@cluster0.zhnwx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        console.log(client)

        const database = client.db("db_craftsman");
        const usersCollection = database.collection("users");
        const productsCollection = database.collection("products");

        //all products
        app.get('/products', async (req, res) => {
            const products = await productsCollection.find().toArray();
            res.send(products);
        });


        //token
        app.post('/login', async (req, res) => {
            const userEmail = req.body;
            console.log(userEmail);
            const accesToken = jwt.sign(userEmail, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '7d'
            })
            console.log(accesToken);
            res.send(accesToken);
        })

        //delete
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = productsCollection.deleteOne(query)
            res.send(result);
        })

    }
    finally {

    }
}

run().catch(console.dir);

app.listen(port, () => {
    console.log(`craftsman app is listening on port ${port}`)
})
