const express = require('express')
const app = express()
var cors = require('cors')
var jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())



app.get('/', (req, res) => {
  res.send('This is craftsman server')
})


//verify jwt
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized access' })
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decode) => {
    if (error) {
      return res.status(403).send({ message: 'Access Forbiden' })
    }
    req.decoded = decode;
    next();
  })
  console.log('Inside verify jwt', authHeader)
}

//verify admin
const verifyAdmin = async (req, res, next) => {
  const requester = req.decoded.email;
  const requesterAccount = await userCollection.findOne({ email: requester });
  if (requesterAccount.role === 'admin') {
    next();
  }
  else {
    res.status(403).send({ message: 'forbidden' });
  }
}

const uri = `mongodb+srv://Abid:${process.env.DB_USER_PASSWORD}@cluster0.zhnwx.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    console.log(client)

    const database = client.db("db_craftsman");
    const usersCollection = database.collection("users");
    const productsCollection = database.collection("products");
    const ordersCollection = database.collection("orders");
    const reviewsCollection = database.collection("reviews");

    //all products
    app.get('/products', async (req, res) => {
      const products = await productsCollection.find().toArray();
      res.send(products);
    });
    // last 3 products
    app.get('/recentProducts', async (req, res) => {
      const count = await productsCollection.countDocuments();
      const products = await productsCollection.find().skip(count - 3).limit(3).toArray();
      res.send(products);
    });

    //payment
    app.post('/create-payment-intent', async(req, res) =>{
      const price =  req?.body?.price;
      console.log(price)
      const amount = price*100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount : amount,
        currency: 'usd',
        payment_method_types:['card']
      });
      res.send({clientSecret: paymentIntent.client_secret})
    });

    //find a single product
    app.get('/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const result = await productsCollection.findOne(query)
      res.send(result);
    })

    app.get('/orders', verifyJWT,verifyAdmin, async (req, res) => {
      const products = await ordersCollection.find().toArray();
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

    //delete product
    app.delete('/product/:id',verifyJWT,verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const result = productsCollection.deleteOne(query)
      res.send(result);
    })


    //delete order
    app.delete('/order/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const result = ordersCollection.deleteOne(query)
      res.send(result);
    })


    //Save user
    app.put('/users', async (req, res) => {
      const userEmail = req.body.email;
      const userName = req.body.name;
      const filter = { email: userEmail }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: userName,
          email: userEmail,
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc, options)
      res.send(result)

    })


    //All users
    app.get('/users',verifyJWT,verifyAdmin, async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    })

    //single user
    app.get('/user/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const result = await usersCollection.findOne(query);
      res.send(result);
    })

    //update user data
    app.put('/updateUser/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) }
      const updatedUser = req.body;
      console.log(updatedUser)
      const { name, email, image, country, state, streetAddress, linkedin, twitter } = updatedUser;
      console.log(updatedUser)
      const options = { upsert: true }
      let obj = {};

      const objWithImage = {
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser?.image,
        phoneNo: updatedUser.phoneNo,
        address: {
          country: updatedUser.country,
          state: updatedUser.state,
          streetAddress: updatedUser.streetAddress,
        },
        social: {
          linkedin: updatedUser.linkedin,
          twitter: updatedUser.twitter
        }
      }
      const objWithOutImage = {
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNo: updatedUser.phoneNo,
        address: {
          country: updatedUser.country,
          state: updatedUser.state,
          streetAddress: updatedUser.streetAddress,
        },
        social: {
          linkedin: updatedUser.linkedin,
          twitter: updatedUser.twitter
        }
      }
      if (image) {
        obj = { ...objWithImage }
      } else {
        obj = { ...objWithOutImage }
      }
      const updateddoc = {
        $set: { ...obj }
      }
      const result = await usersCollection.updateOne(filter, updateddoc, options)
      res.send(result)
    })

    //add a order
    app.post('/addOrder', async (req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order)
      res.send(result);
    })

    //my orders
    app.get('/myOrder/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    })
    app.get('/payment/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const result = await ordersCollection.findOne(query);
      res.send(result);
    })

    //add a review
    app.post('/addReview', async (req, res) => {
      const order = req.body;
      const result = await reviewsCollection.insertOne(order)
      res.send(result);
    })





    //user Admin role update
    app.put('/userAdmin',verifyJWT,verifyAdmin, async (req, res) => {
      const userEmail = req.body.email;
      const filter = { email: userEmail }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          email: userEmail,
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc, options)
      res.send(result)

    })

    app.put('/removeAdmin',verifyJWT,verifyAdmin, async (req, res) => {
      const userEmail = req.body.email;
      const filter = { email: userEmail }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          email: userEmail,
          role: null,
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc, options)
      res.send(result)

    })


    //Add (post) a item
    app.post('/addProduct', async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct)
      res.send(result);
    })


    //All reviews
    app.get('/reviews', async (req, res) => {
      const users = await reviewsCollection.find().toArray();
      res.send(users);
    })

  }
  finally {

  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`craftsman app is listening on port ${port}`)
})
