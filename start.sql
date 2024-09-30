CREATE DATABASE user_progress;

USE user_progress;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    color VARCHAR(255) NOT NULL
);