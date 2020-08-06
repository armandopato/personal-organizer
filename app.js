require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const ejs = require("ejs");
const session = require("express-session");
const { SpendingItem, SpendingList, ToDoItem, ToDoList, GenericItem, GenericList, User, List } = require("./db.js");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// Home route
app.get("/", (req, res) =>
{
    if (req.isAuthenticated())
    {
        res.redirect("/home");
    }
    else
    {
        res.render("index");
    }
});

// Log in 
app.get("/login", (req, res) =>
{
    if (req.isAuthenticated())
    {
        res.redirect("/home");
    }
    else
    {
        res.render("login");
    }
});
app.post("/login", (req, res) => 
{
    const user = new User({ username: req.body.username, password: req.body.password });
    req.logIn(user, function (err)
    {
        if (err)
        {
            res.redirect("/login");
        }
        else
        {
            passport.authenticate("local")(req, res, function ()
            {
                res.redirect("/home");
            });
        }
    });
});


// Sign up
app.get("/signup", (req, res) =>
{
    if (req.isAuthenticated())
    {
        res.redirect("/home");
    }
    else
    {
        res.render("signup");
    }
});
app.post("/signup", (req, res) =>
{
    User.register(
        {
            username: req.body.username, fName: req.body.fName, lName: req.body.lName, nickname: req.body.nickname
        }, req.body.password, (err, user) =>
    {
        if (err)
        {
            console.log(err);
            res.redirect("/signup");
        }
        else
        {
            req.logIn(user, function (err)
            {
                if (err)
                {
                    res.redirect("/login");
                }
                else
                {
                    passport.authenticate("local")(req, res, function ()
                    {
                        res.redirect("/home");
                    });
                }
            });
        }
    });
});

app.get("/home", (req, res) =>
{
    if (req.isAuthenticated())
    {
        User.findOne({ username: req.user.username }, (err, found) =>
        {
            if (!err && found)
            {
                let fetchedLists = [];
                found.lists.forEach((list) =>
                {
                    let fetchedListItem = null;
                    switch (list.type)
                    {
                        case "spendings":
                            fetchedListItem = { content: found.spendingLists.id(list.objectId) };
                            break;

                        case "toDo":
                            fetchedListItem = { content: found.toDoLists.id(list.objectId) };
                            let currDate = new Date();
                            fetchedListItem.content.items.forEach(function (item)
                            {
                                item.passed = (currDate > item.deadline) ? true : false;
                            });
                            break;

                        case "generic":
                            fetchedListItem = { content: found.genericLists.id(list.objectId) };
                            break;
                    }
                    fetchedListItem.id = list.id;
                    fetchedListItem.type = list.type;
                    fetchedListItem.name = list.name;
                    fetchedLists.push(fetchedListItem);
                });

                res.render("homeUser", {
                    name: found.fName,
                    nickname: found.nickname,
                    lists: fetchedLists
                });
            }
            else
            {
                res.render("/");
            }
        });
    }
    else
    {
        res.redirect("/login");
    }
});

// Log out
app.get("/logout", function (req, res)
{
    req.logOut();
    res.redirect("/");
});

// API

app.post("/api/create", (req, res) =>
{
    if (req.isAuthenticated())
    {
        User.findOne({ username: req.user.username }, (err, found) =>
        {
            if (!err && found)
            {
                let newList = null;
                let type = null;

                switch (req.body.listType)
                {
                    case "spendings":

                        type = "spendings";
                        newList = new SpendingList(
                            {
                                currentBalance: 0
                            }
                        );
                        found.spendingLists.push(newList);
                        break;


                    case "toDo":

                        type = "toDo";
                        newList = new ToDoList();
                        found.toDoLists.push(newList);
                        break;


                    case "generic":

                        type = "generic";
                        newList = new GenericList();
                        found.genericLists.push(newList);
                        break;

                    default:
                        console.log("Error in list's type.");
                }


                if (newList !== null && type !== null)
                {
                    let list = new List({
                        name: req.body.listName,
                        type: type,
                        objectId: newList.id
                    });
                    found.lists.push(list);
                    found.save();
                    console.log("Successfully created new list.");
                    res.send(list);
                }
            }
            else
            {
                res.status(404).send();
                console.log("Error while creating new list.");
            }
        });
    }
    else
    {
        res.status(400).send();
    }
});

app.delete("/api/delete", (req, res) =>
{
    if (req.isAuthenticated())
    {
        User.findOne({ username: req.user.username }, (err, found) =>
        {
            if (!err && found)
            {
                let listToDelete = found.lists.id(req.body.id);
                let listObjectId = listToDelete.objectId;
                let type = listToDelete.type;
                listToDelete.remove();

                let actualList;

                switch (type)
                {
                    case "spendings":
                        actualList = found.spendingLists.id(listObjectId);
                        break;

                    case "toDo":
                        actualList = found.toDoLists.id(listObjectId);
                        break;

                    case "generic":
                        actualList = found.genericLists.id(listObjectId);
                        break;
                }

                actualList.remove();
                found.save();
                console.log("Successfully deleted list.");
                res.send("Success!");
            }
            else
            {
                res.status(404).send();
                console.log("Error while deleting list.");
            }
        });
    }
    else
    {
        res.status(400).send();
    }
});

app.delete("/api/delete/item", (req, res) =>
{
    if (req.isAuthenticated())
    {
        User.findOne({ username: req.user.username }, (err, found) =>
        {
            if (!err && found)
            {
                let list = found.lists.id(req.body.listId);
                let listObjectId = list.objectId;
                let actualList;

                switch (list.type)
                {
                    case "spendings":
                        actualList = found.spendingLists.id(listObjectId);
                        break;

                    case "toDo":
                        actualList = found.toDoLists.id(listObjectId);
                        break;

                    case "generic":
                        actualList = found.genericLists.id(listObjectId);
                        break;
                }

                actualList.items.id(req.body.itemId).remove();
                found.save();
                console.log("Successfully deleted list.");
                res.send("Success!");
            }
            else
            {
                res.status(404).send();
                console.log("Error while deleting item.");
            }
        });
    }
    else
    {
        res.status(400).send();
    }
});

app.patch("/api/balance", (req, res) =>
{
    if (req.isAuthenticated())
    {
        User.findOne({ username: req.user.username }, (err, found) =>
        {
            if (!err && found)
            {
                let listId = found.lists.id(req.body.id).objectId;
                let list = found.spendingLists.id(listId);
                list.currentBalance = req.body.newBalance;
                found.save();
                res.send({ newBalance: list.currentBalance });
            }
            else
            {
                res.status(404).send();
                console.log("Error while updating balance.");
            }
        });
    }
    else
    {
        res.status(400).send();
    }
});


app.post("/api/create/spendings/item", (req, res) =>
{
    if (req.isAuthenticated())
    {
        User.findOne({ username: req.user.username }, (err, found) =>
        {
            if (!err && found)
            {
                let list = found.lists.id(req.body.id);
                let objectId = list.objectId;
                let actualList = found.spendingLists.id(objectId);
                let newItem = new SpendingItem({ type: req.body.type, value: req.body.value, description: req.body.description });

                if (newItem.type === "expense")
                {
                    actualList.currentBalance -= newItem.value;
                }
                else
                {
                    actualList.currentBalance += newItem.value;
                }

                actualList.items.push(newItem);
                found.save();
                console.log("Successfully created new item.");

                res.send({ content: newItem, newBalance: actualList.currentBalance });

            }
            else
            {
                res.status(404).send();
                console.log("Error while creating new spending item.");
            }
        });
    }
    else
    {
        res.status(400).send();
    }
});


app.post("/api/create/toDo/item", (req, res) =>
{
    if (req.isAuthenticated())
    {
        User.findOne({ username: req.user.username }, (err, found) =>
        {
            if (!err && found)
            {
                let date = req.body.date;
                let time = req.body.time;
                let dateObj = new Date(date + ' ' + time);

                let currDate = new Date();
                let passed = false;
                if (currDate > dateObj)
                {
                    passed = true;
                }

                let list = found.lists.id(req.body.id);
                let objectId = list.objectId;
                let actualList = found.toDoLists.id(objectId);
                let newItem = new ToDoItem({ activity: req.body.activity, deadline: dateObj });

                actualList.items.push(newItem);
                found.save();
                console.log("Successfully created new item.");

                res.send({ passed, date: date + ' ' + time, time: time, activity: newItem.activity, id: newItem.id });

            }
            else
            {
                res.status(404).send();
                console.log("Error while creating new spending item.");
            }
        });
    }
    else
    {
        res.status(400).send();
    }
});

app.post("/api/create/generic/item", (req, res) =>
{
    if (req.isAuthenticated())
    {
        User.findOne({ username: req.user.username }, (err, found) =>
        {
            if (!err && found)
            {
                let list = found.lists.id(req.body.id);
                let objectId = list.objectId;
                let actualList = found.genericLists.id(objectId);
                let newItem = new GenericItem({ description: req.body.description });

                actualList.items.push(newItem);
                found.save();
                console.log("Successfully created new item.");

                res.send(newItem);
            }
            else
            {
                res.status(404).send();
                console.log("Error while creating new generic item.");
            }
        });
    }
    else
    {
        res.status(400).send();
    }
});

app.listen(process.env.PORT || 3000, () => { console.log("Server running."); });