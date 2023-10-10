const express = require('express');
require('dotenv').config();
const app = express();
const port = 3000;
//midleware
var cors = require('cors');
app.use(cors());
app.use(express.json());//req.body undifined solved


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://final-project:VdIuKaYSMu8psdSt@cluster0.fmco2ha.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const database = client.db('DoctorsPortal');
        const appointmentCollection = database.collection('appointmentOption');
        const bookingCollection = database.collection('bookingCollection');
        const usersCollection = database.collection('usersCollection');
        const doctorCollection = database.collection('doctorCollection');

        app.get('/appointmentOption', async (req, res) => {
            const date = req.query.date;
            //console.log(date);
            const query = {};
            const options = await appointmentCollection.find(query).toArray();
            const bookingQuery = { appoientmentDate: date };
            const alreadyBooked = await bookingCollection.find(bookingQuery).toArray();

            options.forEach(option => {
                const bookedOption = alreadyBooked.filter(booked => booked.treatment === option.name);

                const bookedSlots = bookedOption.map(booked => booked.slot);

                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot));

                option.slots = remainingSlots;
            })

            res.send(options)
        })

        // GET SPECIALITY OPTION FOR ADD DOCTOR COMPONENT
        app.get('/appointmentSpecility', async (req, res) => {
            const query = {};
            const result = await appointmentCollection.find(query).project({ name: 1 }).toArray();
            res.send(result);
        })

        // DOCTOR DATA POST TO DATABASE FOR MANAGE DOCTOR PAGE
        app.post('/doctors', async (req, res) => {
            const doctor = req.body;
            const result = await doctorCollection.insertOne(doctor);
            res.send(result)
        })

        // GET DOCTOR DATA FROM DATABASE FOR MANAGE DOCTOR PAGE
        app.get('/doctors', async (req, res) => {
            const query = {};
            const result = await doctorCollection.find(query).toArray();
            res.send(result)
        })

        // DELETE DOCTOR
        app.delete('/doctors/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await doctorCollection.deleteOne(filter);
            res.send(result)
        })

        //
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const query = {
                appoientmentDate: booking.appoientmentDate,
                email: booking.email,
                treatment: booking.treatment
            }
            //console.log(query);

            const alreadyBooked = await bookingCollection.find(query).toArray();
            if (alreadyBooked.length) {
                const message = `You already booked by name of ${booking.patient}`;
                return res.send({ acknowledged: false, message })
            }

            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })

        // opo
        app.get('/booking', async (req, res) => {
            const email = req.query.email;
            //console.log(email);
            const query = { email: email };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings)
        })

        // POST USER DATA TO DATABASE
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })

        // GETING USER DATA FROM DATABASE
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users)
        })

        // CHECK ADMIN VIA EMAIL
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' })
        })

        // MAKE ADMIN
        app.put('/users/admin:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);

            res.send(result)
        })

        // REMOVE ADMIN
        app.patch('/users/:id', async (req, res) => {
            const id = req.params.id;
            const updatedDoc = req.body;
            console.log(updatedDoc, id);
            const result = await usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedDoc });
            // console.log(usersCollection)
            res.send(result)
        })




    } finally {

        //await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello Doctor !')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})