//Requiring all the essential modules

require("dotenv").config(); //Used for setting up environment variables
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

//setting up express parameters
const app = express();

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

//setting up express session

app.use(session({
    secret: process.env.SECRET_STRING,
    resave: false, //resaves a session even if no changes were made
    saveUninitialized: false, //saves a cookie when it is new but unmodified. false is good for gdpr compliance and logins.
}))

//setting up passport
app.use(passport.initialize());
app.use(passport.session());

//setting up mongo db with mongoose
mongoose.connect(process.env.DB_PATH);

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Starting the server
app.listen(1111, function() {
    console.log("Server started at port 1111");
})

//------------------------------------------------------------Get Requests------------------------------------------------------------

app.get("/", function(req, res) {
    res.render("home");
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.get("/secrets", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res) {
    req.logout(function(err) {
        if (err) {
            console.log(err);
        }
    });
    res.redirect("/");
})

//-----------------------------------------------------------Post Requests------------------------------------------------------------

app.post("/login", function(req, res) {

    let user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.logIn(user, function(err) {
        if (err) {
            console.log(err);
            res.redirect("/login");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });

});

app.post("/register", function(req, res) {

    User.register({ username: req.body.username }, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else if (user) {
            passport.authenticate("local")(req, res, function() {
                /*This function is only triggered if the authentication was successful and we were able to setup 
                the cookie that saved their logged in session so we can check if they are logged in or not. */
                res.redirect("/secrets");
            })
        }
    })

});