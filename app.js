const express = require('express');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');

//Create connection
const db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '123',
    database : 'nodemysql'
});

//Connect
db.connect((err) =>{
    if(err){
        throw err;
    }
    console.log("MySql Connected...");
});
const app = express();
app.use(express.json());

//API WELCOME
app.get('/api', (req, res) => {
    res.json({
        message:"Welcome to the API"
    });
});

//Create DB
app.get('/createdb', (req, res) => {
    let sql = 'CREATE DATABASE IF NOT EXISTS nodemysql';
    db.query(sql, (err, result) =>{
        if(err) throw err;
        console.log(result);
        res.send('database created...');
    });
});

//CREATE USERS TABLE
app.get('/createuserstable', (req, res) => {
    let sql = 'CREATE TABLE IF NOT EXISTS users(user_id int AUTO_INCREMENT UNIQUE, username VARCHAR(255), email VARCHAR(255) UNIQUE, password VARCHAR(255),  PRIMARY KEY(user_id))';
    db.query(sql, (err, result) =>{
        if(err) throw err;
        console.log(result);
        res.send(`Table 'users' created...`);
    });
});



//CREATE POSTS TABLE
app.get('/createpoststable', (req,res) => {
    // let table = db.query(`SELECT count(*) FROM information_schema.TABLES WHERE table_name = 'posts'`, (err, result, fields) =>{
    //
    // });
    let sql = 'CREATE TABLE posts(id int AUTO_INCREMENT, user_id int, title VARCHAR(255), body VARCHAR(255), PRIMARY KEY(id))';
    db.query(sql, (err, result) => {
        if(err) throw err;
        console.log(result);
        res.status(200).json({msg:'Posts table created...'});
    });
});



//CREATE USER
app.post('/api/register', (req,res) => {
    console.log(req.body);
    const { username, email, password } = req.body;
    const user = {
        username,
        email,
        password
    }
    if(!username || !email || !password) {
        console.log(username);
        return res.status(400).json({msg: "Every field is required!"});
    } else{
        console.log("Trying to insert user:");
        let sql = 'INSERT INTO users SET ?';
        let query = db.query(sql, (err, result) => {
            if(err) {
                console.log("Couldn't register this user")
                return res.status(500).json({msg:`500 Internal Server Error`});
            } else{
                res.status(200).json({msg:"User successfully registered !"});
            }

        });


    }

})

//LOGIN USER
app.post('/api/login', (req,res) => {
    //Temp hardcoded user
    const { email, password } = req.body;
    const user = {
        email,
        password
    }
    let sql = `SELECT user_id FROM users WHERE user.email = ${email} AND user.password = ${password}`;
    let query = db.query(sql, user, (err, result) => {
        if(err) {
            console.log("Couldn't log in this user");
            return res.status(500).json({msg:`500 Internal Server Error`});
        } else{
            jwt.sign({user}, 'secretkey', (err, token) => {
                res.status(200).json({msg:"User sucessfully logged in!",token});
            });
        }

    });

});




//insert post 1
app.post('/addpost', verifyToken, (req, res) => {
    jwt.verify(req.token, 'secretkey', (err, authData) =>{
       if(err) {
           res.status(403).json({msg:err});
       } else {
           res.status(200).json({
               message: 'Post created!',
               body: req.body,
               authData
           });
       }
    });
    let sql = 'INSERT INTO posts SET ?';
    let query = db.query(sql, req.body, (err, result) => {
        if(err) throw err;

    });
});

//Select all posts
app.get('/getposts', (req, res) => {
    let sql = 'SELECT * FROM posts';
    let query = db.query(sql, (err, result) => {
        if(err) throw err;
        res.status(200).json(result);
    });
});

//Select single post
app.get('/getpost/:id', (req, res) => {
    console.log(req.body);
    let sql = `SELECT * FROM posts WHERE id = ${req.params.id}`;
    let query = db.query(sql, (err, result) => {
        if(err) throw err;
        console.log(result, "rezulto");
        res.status(200).json({requestBody: req.body});
    });
});

//Update post
app.patch('/updatepost/:id', (req, res) => {
    let sql = `UPDATE posts SET title = '${req.body.title}' WHERE id = ${req.params.id}`;
    let query = db.query(sql, (err, result) => {
        if(err) throw err;
        res.status(200).json({msg: `Post ${req.params.id} updated`});
    });
});

//Delete post
app.delete('/deletepost/:id', (req, res) => {
    let sql = `DELETE FROM posts  WHERE id = ${req.params.id}`;
    console.log(req.header('dejo'));

    let query = db.query(sql, (err, result) => {
        console.log(result);
        if(err) throw err;
        const {affectedRows} = result
        if(!affectedRows){
            res.send(`Post doesn't exist`);
        } else{
            res.send(`Post ${req.params.id} deleted`);
        }
    });
});

//FORMAT OF TOKEN
//Authorization : Bearer <access_token>

//Verify Token
function verifyToken(req, res, next) {
    //Get auth header value
    const bearerHeader = req.headers['authorization'];
    //check if bearer is undefined
    if(typeof bearerHeader !== 'undefined'){
        //split at the space
        const bearer = bearerHeader.split(' ');
        //Get token from array
        const bearerToken = bearer[1];
        //Set the token
        req.token=bearerToken;
        // Next middleware
        next();
    } else{
        res.status(403).json({msg:"403 Forbidden xdd"});
    }
}



app.listen('3000', () =>{
    console.log('server started on port 3000');
});