const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");

/*          Schemas             */

// Spendings
const SpendingItemSchema = new mongoose.Schema({
    type: String,
    value: Number,
    description: String
});

const SpendingListSchema = new mongoose.Schema({
    currentBalance: Number,
    items: [SpendingItemSchema]
});

// To Do
const ToDoItemSchema = new mongoose.Schema({
    activity: String,
    deadline: Date
});

const ToDoListSchema = new mongoose.Schema({
    items: [ToDoItemSchema]
});

// Generic
const GenericItemSchema = new mongoose.Schema({
    description: String
});


const GenericListSchema = new mongoose.Schema({
    items: [GenericItemSchema]
});

// List
const ListSchema = new mongoose.Schema({
    name: String,
    type: String,
    objectId: mongoose.ObjectId
});

// User
const UserSchema = new mongoose.Schema({
    email: String,
    fName: String,
    lName: String,
    nickname: String,
    lists: [ListSchema],
    spendingLists: [SpendingListSchema],
    toDoLists: [ToDoListSchema],
    genericLists: [GenericListSchema]
});

UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);

/*          Models             */

// Spendings
const SpendingItem = new mongoose.model("SpendingItem", SpendingItemSchema);
const SpendingList = new mongoose.model("SpendingList", SpendingListSchema);

// To Do
const ToDoItem = new mongoose.model("ToDoItem", ToDoItemSchema);
const ToDoList = new mongoose.model("ToDoList", ToDoListSchema);

// Generic
const GenericItem = new mongoose.model("GenericItem", GenericItemSchema);
const GenericList = new mongoose.model("GenericList", GenericListSchema);

// User
const User = new mongoose.model("User", UserSchema);
const List = new mongoose.model("List", ListSchema);

module.exports = {SpendingItem, SpendingList, ToDoItem, ToDoList, GenericItem, GenericList, User, List};