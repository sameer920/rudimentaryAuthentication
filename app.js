//Requiring all the essential modules

require("dotenv").config(); //Used for setting up environment variables
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

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
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user", userSchema);

passport.use(User.createStrategy());

//from the passport doucmentation:
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});

passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});


passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL
    },
    function(accessToken, refreshToken, profile, cb) {

        User.findOne({ googleId: profile._json.sub }, function(err, user) {
            if (err) {
                console.log(err);
                return cb(err);
            } else {
                if (user) {
                    return cb(err, user);

                } else {
                    let newUser = new User({
                        googleId: profile._json.sub,
                        username: profile._json.email
                    });
                    newUser.save();
                    return cb(err, newUser);
                    /* We add newUser in the call back because findOne resulted in NULL, 
                    as the user did not exist in our database. Passing NULL causes the system to think that the user
                    is still unauthorized, which leads them to the login page */
                }
            }
        })

    }));

//Starting the server
app.listen(1111, function() {
    console.log("Server started at port 1111");
})

//------------------------------------------------------------Get Requests------------------------------------------------------------

app.get("/", function(req, res) {
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function(req, res) {
        //authentication was successful, redirect to secrets page
        res.redirect("/secrets");
    }
);

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