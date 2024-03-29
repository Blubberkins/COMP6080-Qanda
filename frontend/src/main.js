import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

// FUNCTIONS

// Shows the page you specify
function showPage(page) {
    // Hide all pages and page elements
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('register-page').style.display = 'none';
    document.getElementById('forum-page').style.display = 'none';
    document.getElementById('create-thread-page').style.display = 'none';
    document.getElementById('thread-page').style.display = 'none';
    document.getElementById('profile-page').style.display = 'none';
    // Hide all page elements
    document.getElementById('error-popup').style.display = 'none';
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('thread-bar').style.display = 'none';
    // Show the specified page
    document.getElementById(page).style.display = '';
}

// Shows the page element you specify without hiding other elements
function showPageElement(element) {
    document.getElementById(element).style.display = '';
}

// Loads the page and its associated page elements for specific pages
function loadPage(page) {
    switch (page) {
        case 'forum-page':
            showPage('forum-page');
            showPageElement('top-bar');
            showPageElement('thread-bar');
            removeDisplayedThreads();
            getThreads(0);
            break;

        case 'create-thread-page':
            showPage('create-thread-page');
            showPageElement('top-bar');
            break;

        case 'thread-page':
            showPage('thread-page');
            showPageElement('top-bar');
            showPageElement('thread-bar');
            removeDisplayedThreads();
            getThreads(0);
            break;

        default:
            showPage(page);
    }
}

// General POST request for the specified path and body that returns a promise
function postReq(path, token, body) {
    return new Promise((resolve, reject) => {
        fetch('http://localhost:' + BACKEND_PORT + path, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                'Authorization': token,
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

// General GET request for the specified path, token and queryString that returns a promise
function getReq(path, token, queryString) {
    return new Promise((resolve, reject) => {
        fetch('http://localhost:' + BACKEND_PORT + path + '?' + queryString, {
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
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

// Retrieves the details of a thread as a promise
function getThread(id) {
    // Gets user token
    const userToken = JSON.parse(localStorage.getItem('user')).token;

    // Loads the details of the thread
    return getReq('/thread', userToken, 'id=' + id)
        .then(response => {
            // Separate response info into separate variables
            const threadId = response.id;
            const title = response.title;
            const isPublic = response.isPublic;
            const lock = response.lock;
            const content = response.content;
            const creatorId = response.creatorId;
            const createdAt = response.createdAt;
            const likes = response.likes;
            const watchees = response.watchees;

            // Return an object containing all variables
            return {
                threadId,
                title,
                isPublic,
                lock,
                content,
                creatorId,
                createdAt,
                likes,
                watchees
            };
        })
        .catch(error => {
            throw new Error(error.message);
        });

}

// Loads the thread list from the specified startIndex
function getThreads(startIndex) {
    // Gets user token
    const userToken = JSON.parse(localStorage.getItem('user')).token;

    // Loads the next 5 threads starting from startIndex
    getReq('/threads', userToken, 'start=' + startIndex)
        .then(response => {
            // Map each threadId (returned from /threads) to its thread details (using promise.all, so that threads are mapped asynchronously)
            return Promise.all(response.map(threadId => getThread(threadId)));
        })
        .then(threadDetails => {
            // Retrieve author's name for each thread
            const getUserPromises = threadDetails.map(thread => {
                return getUser(thread.creatorId);
            });

            // Wait for all getUser() promises to resolve
            return Promise.all(getUserPromises)
                .then(authors => {

                    // Render each thread's details in the thread-list element (after all threadDetails and getUser promises have resolved)
                    threadDetails.forEach((thread, index) => {
                        const threadDiv = document.createElement('div');
                        // Adds the css thread-box which visually encapsulates the thread details
                        threadDiv.classList.add('thread-box');

                        // Creates the thread details to display
                        const title = document.createElement('h3');
                        title.innerText = thread.title;

                        const author = document.createElement('p');
                        const authorName = authors[index].name;
                        author.innerText = 'Author: ' + authorName;

                        const postDate = document.createElement('p');
                        const createdAt = thread.createdAt;
                        postDate.innerText = 'Post Date: ' + createdAt.split("T")[0];

                        const likes = document.createElement('p');
                        likes.innerText = 'Likes: ' + thread.likes.length;

                        // Appends thread details to the threadDiv
                        threadDiv.appendChild(title);
                        threadDiv.appendChild(author);
                        threadDiv.appendChild(postDate);
                        threadDiv.appendChild(likes);

                        // Add click event to threadDiv that loads the individual thread page
                        threadDiv.addEventListener('click', () => {
                            loadThreadInfo(thread.threadId);
                            loadPage('thread-page');
                        });

                        // Appends the threadDiv to the list of threads
                        document.getElementById('thread-list').appendChild(threadDiv);
                    });

                    // Hides the 'Load More' button if less than the max number of threads are loaded
                    if (threadDetails.length < 5) {
                        document.getElementById('load-more-threads').style.display = 'none';
                    // Otherwise shows it
                    } else {
                        document.getElementById('load-more-threads').style.display = '';
                    }

                });

        })
        .catch(error => {
            document.getElementById('error-message').textContent = error.message;
            showPageElement('error-popup');
        });
}

// Remove all displayed threads from the thread bar and thread page
function removeDisplayedThreads() {
    const threadList = document.getElementById('thread-list');
    while (threadList.firstChild) {
        threadList.removeChild(threadList.firstChild);
    }
    const threadPage = document.getElementById('thread-page');
    while (threadPage.firstChild) {
        threadPage.removeChild(threadPage.firstChild);
    }
}

// Loads thread info onto the thread-page
function loadThreadInfo(threadId) {
    getThread(threadId)
        .then(thread => {

            // Wait for getUser() promise to resolve
            return getUser(thread.creatorId)
                .then(authorDetails => {

                    const threadDiv = document.createElement('div');

                    // Creates the thread details to display
                    const title = document.createElement('h1');
                    title.innerText = thread.title;

                    const author = document.createElement('p');
                    const authorName = authorDetails.name;
                    author.innerText = 'Author: ' + authorName;

                    const postDate = document.createElement('p');
                    const createdAt = thread.createdAt;
                    postDate.innerText = 'Post Date: ' + createdAt.split("T")[0];

                    const likes = document.createElement('p');
                    likes.innerText = 'Likes: ' + thread.likes.length;

                    const content = document.createElement('p');
                    content.innerText = thread.content;
                    content.style.marginTop = '3em';

                    // Appends thread details to the threadDiv
                    threadDiv.appendChild(title);
                    threadDiv.appendChild(author);
                    threadDiv.appendChild(postDate);
                    threadDiv.appendChild(likes);
                    threadDiv.appendChild(content);

                    // Adds the threadDiv to the thread-page
                    document.getElementById('thread-page').appendChild(threadDiv);

                });

        })
        .catch(error => {
            console.error(error);
            document.getElementById('error-message').textContent = error.message;
            showPageElement('error-popup');
        });
}

// Retrieves user info from their id as a promise
function getUser(id) {
    // Gets user token
    const userToken = JSON.parse(localStorage.getItem('user')).token;

    // Loads the details of the thread
    return getReq('/user', userToken, 'userId=' + id)
        .then(response => {
            // Separate response info into separate variables
            const userId = response.id;
            const email = response.email;
            const name = response.name;
            const image = response.image;
            const isAdmin = response.admin;

            // Return an object containing all variables
            return {
                userId,
                email,
                name,
                image,
                isAdmin
            };
        })
        .catch(error => {
            throw new Error(error.message);
        });

}

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', function() {

    // ON PAGE LOAD EVENTS

    // If localStorage 'user' is not empty (ie. user is already logged in), immediately loads to the forum page
    if (localStorage.getItem('user') !== null) {
        console.log('already logged in, navigated to forum page');
        loadPage('forum-page');
    }

    // DOC ELEMENT EVENTS

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

        postReq('/auth/login', '', body)
            .then(response => {
                // Put user authentication details in localStorage
                localStorage.setItem('user', JSON.stringify(response));
                loadPage('forum-page');
            })
            .catch(error => {
                document.getElementById('error-message').textContent = error.message;
                showPageElement('error-popup');
            });

    });

    // Register Button
    document.getElementById('show-register').addEventListener('click', function() {
        loadPage('register-page');
    });

    // Register Form Submit
    document.getElementById('register-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const email = document.getElementById('register-email').value;
        const name = document.getElementById('register-name').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const body = { "email": email, "name": name, "password": password }

        // Shows error if password and confirm password values do not match
        if (!(password === confirmPassword)) {
            document.getElementById('error-message').textContent = "Passwords do not match";
            showPageElement('error-popup');
            return false;
        }

        postReq('/auth/register', '', body)
            .then(response => {
                // Put user authentication details in localStorage
                localStorage.setItem('user', JSON.stringify(response));
                loadPage('forum-page');
            })
            .catch(error => {
                document.getElementById('error-message').textContent = error.message;
                showPageElement('error-popup');
            });

    });

    // Back to Login Button
    document.getElementById('show-login').addEventListener('click', function() {
        loadPage('login-page');
    });

    // Logout Button
    document.getElementById('logout').addEventListener('click', function() {
        // Clear localStorage (which contains user token/id)
        localStorage.clear();
        // Remove all threads from the threadList
        const threadList = document.getElementById('thread-list');
        while (threadList.firstChild) {
            threadList.removeChild(threadList.firstChild);
        }

        loadPage('login-page');
    });

    // Create Thread Button
    document.getElementById('create-thread').addEventListener('click', function() {
        loadPage('create-thread-page');
    });

    // Home Button
    document.getElementById('home').addEventListener('click', function() {
        loadPage('forum-page');
    });

    // Load More Threads Button
    document.getElementById('load-more-threads').addEventListener('click', function() {
        // Start index is the number of threads already loaded in the thread bar
        const threadList = document.getElementById('thread-list');
        const startIndex = threadList.childElementCount;
        getThreads(startIndex);
    });

    // Create Thread Form Submit
    document.getElementById('create-thread-form').addEventListener('submit', function(event) {
        event.preventDefault();

        // Gets user token
        const userToken = JSON.parse(localStorage.getItem('user')).token;

        const title = document.getElementById('create-thread-title').value;
        const content = document.getElementById('create-thread-content').value;
        // CheckedButton gets the selected radio button
        const checkedButton = document.getElementById('create-thread-visibility').querySelector('input[type="radio"]:checked');
        // The button's value is stored as a boolean (true if public is checked, false if private is checked, or null if none are checked)
        const isPublic = checkedButton ? checkedButton.value === "true" : null;
        const body = { 'title': title, 'content': content, 'isPublic': isPublic };

        // Rejects threads with an empty title
        if (title === '') {
            document.getElementById('error-message').textContent = 'Title cannot be empty';
            showPageElement('error-popup');
            return false;
        }

        postReq('/thread', userToken, body)
            .then(response => {
                loadThreadInfo(response.id);
                loadPage('thread-page');
            })
            .catch(error => {
                document.getElementById('error-message').textContent = error.message;
                showPageElement('error-popup');
            });

    });

});
