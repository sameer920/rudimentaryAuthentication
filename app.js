require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const app = express();

app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(express.static("public"));

mongoose.connect(process.env.DB_PATH);

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const User = mongoose.model("user", userSchema);

app.listen(1111, function() {
    console.log("Server started at port 1111");
})

app.get("/", function(req, res) {
    res.render("home");
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/login", function(req, res) {
    let userName = req.body.username;
    let password = req.body.password;
    console.log(userName);
    console.log(password);
    User.findOne({ username: userName }, function(err, user) {
        if (err) {
            console.log(err);
        } else if (user) {
            bcrypt.compare(password, user.password, function(err, result) {

                if (result) {
                    res.render("secrets");
                }
            });
        }
    });
});

app.post("/register", function(req, res) {

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {

        let newUser = new User({
            username: req.body.username,
            password: hash
        });
        newUser.save(function(err) {
            if (err) {
                console.log(err);
            } else {
                res.render("secrets");
            }
        });
    });
});