import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

// Object to store the current user's information
let currentUser = {};

// FUNCTIONS

// Shows the page you specify
function showPage(page) {
    // Hide all pages and popups
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('register-page').style.display = 'none';
    document.getElementById('forum-page').style.display = 'none';
    document.getElementById('profile-page').style.display = 'none';
    document.getElementById('error-popup').style.display = 'none';
    // Show the specified page
    document.getElementById(page).style.display = '';
}

// Shows the popup you specify
function showPopup(popup) {
    // Show the specified popup
    document.getElementById(popup).style.display = '';
}

// General POST request for the specified path and body that returns a promise
function postReq(path, body) {
    return new Promise((resolve, reject) => {
        fetch('http://localhost:' + BACKEND_PORT + path, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify(body)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            } else {
                resolve(data);
            }
        })
        .catch(error => {
            console.error(error);
            reject(error);
        });
    });
}

// Login functionality
function login() {
    // Make AJAX request to login endpoint
    // On success, store user info in currentUser and show forum view
}

// Registration functionality
function register() {
    // Make AJAX request to registration endpoint
    // On success, store user info in currentUser and show forum view
}

// Forum functionality
function loadThreads() {
    // Make AJAX request to get threads
    // On success, update the DOM with the thread info
}

function createThread() {
    // Make AJAX request to create a new thread
    // On success, update the DOM with the new thread
}

// Profile functionality
function loadProfile() {
    // Update the DOM with the info from currentUser
}

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', function() {

    // Close Error Button
    document.getElementById('close-error').addEventListener('click', function() {
        document.getElementById('error-popup').style.display = 'none';
    });

    // Login Form Submit
    document.getElementById('login-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const body = { "email": email, "password": password }

        postReq('/auth/login', body)
            .then(response => {
                currentUser = response;
                console.log(currentUser);
                showPage('forum-page');
            })
            .catch(error => {
                document.getElementById('error-message').textContent = error.message;
                showPage('forum-page');
                showPopup('error-popup');
            });
        
    });

    // Register Button
    document.getElementById('show-register').addEventListener('click', function() {
        showPage('register-page');
    });

    // Register Form Submit
    document.getElementById('register-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const email = document.getElementById('register-email').value;
        const name = document.getElementById('register-name').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const body = { "email": email, "name": name, "password": password }

        if (!password === confirmPassword) {
            document.getElementById('error-message').textContent = "Passwords do not match";
            showPopup('error-popup');
            return false;
        }

        postReq('/auth/register', body)
            .then(response => {
                currentUser = response;
                console.log(currentUser);
                showPage('forum-page');
            })
            .catch(error => {
                document.getElementById('error-message').textContent = error.message;
                showPopup('error-popup');
            });

    });

    // Back to Login Button
    document.getElementById('show-login').addEventListener('click', function() {
        showPage('login-page');
    });

    // Logout Button
    document.getElementById('logout').addEventListener('click', function() {
        currentUser = {};
        showPage('login-page');
    });

});
