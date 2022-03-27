const express = require('express');
const app = express();
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const Schema = mongoose.Schema
const URI = 'mongodb+srv://prathameshn:h747hx84JlL91dJg@cluster0.dzvhc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true });
const Port = 5000;
let User = new Schema({
    username: String,
});
let Users = new Schema({
    _id: String,
    username: String
});
let Exercises = new Schema({
    _id: String,
    username: String,
    description: String,
    duration: Number,
    date: String,
});
let Logs = new Schema({
    _id: String,
    username: String,
    count: Number,
    log: [{
        description: String,
        duration: Number,
        date: String,
        _id: false
    }]
});
let Person = mongoose.model('Person', User)
let users = mongoose.model('users', Users)
let exercises = mongoose.model('exercise', Exercises)
let LOGS = mongoose.model('LOGS', Logs)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
});


app.post("/api/users", bodyParser.urlencoded({ extended: false }), (req, res) => {
    let UserName = new Person({ username: req.body.username });
    UserName.save();
    let User = new users({ _id: UserName.id.toString(), username: UserName.username });
    User.save()
    res.json(User)
}).get("/api/users", (req, res) => {
    users.find({}, (error, data) => {
        if (error) return console.log(error)
        res.json(data);
    });
});


app.post("/api/users/:_id/exercises", bodyParser.urlencoded({ extended: false }), (req, res) => {
    let s = req.params._id;
    let date = new Date(req.body.date);
    if (date == "Invalid Date") date = new Date();
    users.findOne({ _id: s }, (err, found) => {
        if (err) return console.err(err)
        exercises.findOne({ _id: found.id }, { __v: false }, function (err, personFound) {
            if (err) return console.log(err);
            if (personFound) {
                exercises.findOneAndUpdate({ _id: found.id }, { username: found.username, description: req.body.description, duration: req.body.duration, date: date.toDateString() }, { new: true }, (err, done) => {
                    if (err) return console.log(err);
                    res.json(
                        { _id: done.id, username: done.username, description: done.description, duration: done.duration, date: done.date }
                    )
                    LOGS.findById({ _id: found.id }, (err, done) => {
                        if (err) return console.log(err);
                        done.count += 1
                        done.log.push({
                            description: req.body.description,
                            duration: req.body.duration,
                            date: date.toDateString()
                        })

                        done.save((err, updateperson) => {
                            if (err) return console.log(err)
                        })
                    })
                })

            }
            else {
                let Exercises = new exercises({ _id: found.id, username: found.username, description: req.body.description, duration: req.body.duration, date: date.toDateString() })
                Exercises.save()
                res.json(
                    Exercises
                )
                let logs = new LOGS({
                    _id: found.id,
                    username: found.username,
                    count: 1,
                    log: [{
                        description: req.body.description,
                        duration: req.body.duration,
                        date: date.toDateString()
                    }]
                })
                logs.save();
            }
        })

    })
});

app.get('/api/users/:id/logs', (req, res) => {
    LOGS.findOne({ _id: req.params.id }, { __v: false }, (err, found) => {
        var from = req.query.from
        var to = req.query.to
        let d1=new Date(from)
        let d2=new Date(to)
        let limit = Number(req.query.limit)
        if (err) return console.log(err)
        if (d1 != "Invalid Date") {
            limit = isNaN(limit) ? Infinity : limit
            if (d2 != "Invalid Date" && isNaN(limit) || d2 != "Invalid Date" && !isNaN(limit)) {
                limit = isNaN(limit) ? Infinity : limit
                let len = found.log.length;
                let array = [];
                for (let i = 0; i < len; i++) {
                    let da = found.log[i]
                    if ((new Date(da.date) >= d1 && new Date(da.date) <= d2)) {
                        if (array.length < limit)
                            array.push(da)
                    }

                }
                return res.json({
                    _id: found.id, username: found.username, from: from, to: to, count: array.length,
                    log: array
                })

            }
            if (to == "Invalid Date" && !isNaN(limit) || to == "Invalid Date" && isNaN(limit)) {
                isNaN(limit) ? Infinity : limit
                let len = found.log.length;
                let array = [];
                for (let i = 0; i < len; i++) {
                    let da = found.log[i]
                    if ( da.date >= d1 && da.date<= d2){
                        if (array.length < limit)
                            array.push(da)
                    }

                }
                return res.json({ _id: found.id, username: found.username, from: from, count: found.count, log: found.log })


            }
            else {
                let len = found.log.length;
                let array = [];
                for (let i = 0; i < len; i++) {
                    let da = found.log[i]
                    if (new Date(da.date) >= d1) {
                        if (array.length < limit)
                            array.push(da)
                    }

                }
                return res.json({ _id: found.id, username: found.username, from: from, count: array.length, log: array })
            }

        }
        if(!isNaN(limit)){
            let len = found.log.length;
            let array = [];
            for (let i = 0; i < len; i++) {
                let da = found.log[i]
                    if (array.length < limit)
                        array.push(da)
            }
            return res.json({ _id: found.id, username: found.username,  count: array.length, log: array })
        }
        else {
            return res.json(found)
        }
    })
})

app.listen(Port, () => {
    console.log(`localhost:${Port}`);
});
