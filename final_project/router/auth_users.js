const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = []; // Store registered users


const isValid = (username) => {
  return users.some(user => user.username === username);
};


const authenticatedUser = (username, password) => {
  return users.some(user => user.username === username && user.password === password);
};


regd_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (isValid(username)) {
    return res.status(409).json({ message: "User already exists" });
  }

  users.push({ username, password });
  return res.status(200).json({ message: "User registered successfully" });
});


regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  let accessToken = jwt.sign({ data: username }, 'access', { expiresIn: 60 * 60 });
  req.session.authorization = {
    accessToken
  };

  return res.status(200).json({ message: "User logged in successfully" });
});

regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.user.data;

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (!books[isbn].reviews) {
    books[isbn].reviews = {};
  }

  books[isbn].reviews[username] = review;

  return res.status(200).json({ message: "Review added/updated successfully" });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.user.data; // Extract username from JWT

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (
    books[isbn].reviews &&
    books[isbn].reviews.hasOwnProperty(username)
  ) {
    delete books[isbn].reviews[username];
    return res.status(200).json({ message: "Review deleted successfully" });
  } else {
    return res.status(404).json({ message: "Review not found for this user" });
  }
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
