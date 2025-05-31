const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unothorized access" });
  }
  //verify
  jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
    if (err) {
      return res.status(401).send({ message: "unothorized access found" });
    }
    req.decode = decode;
    next();
  });
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mo9z4qj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const jobsCollection = client.db("careerCode").collection("jobs");
    const applicationCollection = client
      .db("careerCode")
      .collection("application");

    //jwt token api
    app.post("/jwt", async (req, res) => {
      const { email } = req.body;
      const user = { email };
      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      //set cookies
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
      });
      res.send({ success: true });
    });

    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.hr_email = email;
      }
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    //job application
    app.get("/applications", verifyToken, async (req, res) => {
      const email = req.query.email;
      if (email != req.decode.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { applicant: email };
      const result = await applicationCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/applications", async (req, res) => {
      const application = req.body;
      const result = await applicationCollection.insertOne(application);
      res.send(result);
    });

    app.post("/jobs", async (req, res) => {
      const data = req.body;
      const result = await jobsCollection.insertOne(data);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
