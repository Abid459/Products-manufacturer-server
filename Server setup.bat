@echo off  
call npm install express --save 
call npm init -y
call npm i cors 
call npm i mongodb
call npm i jsonwebtoken
call npm i dotenv
call git init
echo .env node_modules > .gitignore
echo const express = require('express');const app = express(); var cors = require('cors');var jwt = require('jsonwebtoken');require('dotenv').config();const port = preocess.env.PORT 5000;
