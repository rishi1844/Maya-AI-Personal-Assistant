const btn = document.querySelector("#listen-btn");
let content = document.querySelector("#content");
const searchContainer = document.querySelector('.search-container');
const searchInput = document.querySelector('.search-bar');
const sendBtn = document.querySelector('.send-btn');
const chatContainer = document.querySelector(".chat-container");
const clearButton = document.getElementById('clearButton');
const copyButton = document.getElementById('copyButton');
const muteButton = document.getElementById('muteButton');

// Login/User Management Elements
const loginModal = document.getElementById('loginModal');
const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const userInfo = document.getElementById('userInfo');
const currentUserSpan = document.getElementById('currentUser');
const sidebarUserSpan = document.getElementById('sidebarUser');
const logoutBtn = document.getElementById('logoutBtn');

// Base URL for backend API
const BACKEND_URL = "https://maya-ai-personal-assistant.onrender.com/generate-content";

let isMuted = false; // Global mute flag
let currentUser = null; // Current logged-in user

// Chat Management Variables
let currentChatId = null;
const userChats = {}; // Store all users' chats: { username: { chatId: {...} } }

// User Authentication Functions
function initializeApp() {
    // Check if user is already logged in
    const savedUser = getUserFromStorage();
    if (savedUser) {
        loginUser(savedUser);
    } else {
        showLoginModal();
    }
}

function showLoginModal() {
    loginModal.style.display = 'flex';
    usernameInput.focus();
}

function hideLoginModal() {
    loginModal.style.display = 'none';
}

function loginUser(username) {
    currentUser = username.trim();
    
    // Initialize user's chat storage if doesn't exist
    if (!userChats[currentUser]) {
        userChats[currentUser] = {};
    }
    
    // Update UI
    currentUserSpan.textContent = `Welcome, ${currentUser}!`;
    sidebarUserSpan.textContent = currentUser;
    userInfo.style.display = 'flex';
    hideLoginModal();
    
    // Save user to storage
    saveUserToStorage(currentUser);
    
    // Load user's chat history
    loadUserChats();
    
    // Initialize with greeting
    wishMe();
}

function logoutUser() {
    // Save current user's chats before logout
    saveUserChatsToStorage();
    
    // Clear current session
    currentUser = null;
    currentChatId = null;
    userChats[currentUser] = {};
    
    // Clear UI
    chatContainer.innerHTML = '';
    document.getElementById('chat-list').innerHTML = '';
    userInfo.style.display = 'none';
    
    // Remove from storage
    removeUserFromStorage();
    
    // Show login modal
    showLoginModal();
}

// Storage Functions (using memory-based storage since localStorage is not available)
let userStorage = {};

function saveUserToStorage(username) {
    userStorage.currentUser = username;
}

function getUserFromStorage() {
    return userStorage.currentUser || null;
}

function removeUserFromStorage() {
    delete userStorage.currentUser;
    delete userStorage.userChats;
}

function saveUserChatsToStorage() {
    if (currentUser) {
        if (!userStorage.userChats) {
            userStorage.userChats = {};
        }
        userStorage.userChats[currentUser] = userChats[currentUser] || {};
    }
}

function loadUserChatsFromStorage() {
    if (currentUser && userStorage.userChats && userStorage.userChats[currentUser]) {
        userChats[currentUser] = userStorage.userChats[currentUser];
    }
}

function loadUserChats() {
    // Load from storage
    loadUserChatsFromStorage();
    
    // Clear and rebuild chat list
    const chatList = document.getElementById('chat-list');
    chatList.innerHTML = '';
    
    // Load user's chats
    const userChatData = userChats[currentUser] || {};
    Object.keys(userChatData).forEach(chatId => {
        const chat = userChatData[chatId];
        createChatListItem(chatId, chat.name);
    });
    
    // If user has chats, load the most recent one
    const chatIds = Object.keys(userChatData);
    if (chatIds.length > 0) {
        const mostRecentChatId = chatIds[chatIds.length - 1];
        switchChat(mostRecentChatId);
    }
}

// Event Listeners for Login/Logout
loginBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username && username.length <= 20) {
        loginUser(username);
        usernameInput.value = '';
    } else {
        alert('Please enter a valid username (1-20 characters)');
    }
});

usernameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        loginBtn.click();
    }
});

logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to switch users? Your current session will be saved.')) {
        logoutUser();
    }
});

// Updated Chat Management Functions
function createNewChat(initialMessage = null) {
    if (!currentUser) return null;
    
    const chatId = `chat-${Date.now()}`;
    const chatName = initialMessage ? truncateText(initialMessage, 23) : "New Chat";

    // Initialize user's chats if doesn't exist
    if (!userChats[currentUser]) {
        userChats[currentUser] = {};
    }

    userChats[currentUser][chatId] = {
        name: chatName,
        messages: [],
        createdAt: new Date().toISOString()
    };

    currentChatId = chatId;
    createChatListItem(chatId, chatName);
    
    // Save to storage
    saveUserChatsToStorage();
    
    return chatId;
}

function addMessageToCurrentChat(message, type) {
    if (!currentUser || !currentChatId) {
        createNewChat(message);
    }

    if (userChats[currentUser] && userChats[currentUser][currentChatId]) {
        userChats[currentUser][currentChatId].messages.push({
            text: message,
            type: type, // 'user' or 'assistant'
            timestamp: new Date().toISOString()
        });

        // Update chat name if it's the first user message and chat name is generic
        if (type === 'user' && userChats[currentUser][currentChatId].name === "New Chat") {
            const newName = truncateText(message, 23);
            userChats[currentUser][currentChatId].name = newName;
            updateChatListItemName(currentChatId, newName);
        }
        
        // Save to storage
        saveUserChatsToStorage();
    }
}

function updateChatListItemName(chatId, newName) {
    const chatItem = document.querySelector(`li[data-chat-id="${chatId}"] span`);
    if (chatItem) {
        chatItem.textContent = newName;
    }
}

function switchChat(chatId) {
    if (!currentUser || !userChats[currentUser] || !userChats[currentUser][chatId]) return;
    
    currentChatId = chatId;
    const chat = userChats[currentUser][chatId];
    
    // Clear current chat container
    chatContainer.innerHTML = '';
    
    // Load and display all messages from this chat
    chat.messages.forEach((msg) => {
        const chatBox = createChatBox(msg.text, msg.type === 'user' ? 'user-chat-box' : 'ai-chat-box');
        chatContainer.appendChild(chatBox);
    });
    
    // Auto-scroll to bottom
    autoScroll();
}

function deleteChat(chatId, chatElement) {
    if (!currentUser || !userChats[currentUser]) return;
    
    delete userChats[currentUser][chatId];
    chatElement.remove();
    
    // Save to storage
    saveUserChatsToStorage();

    if (currentChatId === chatId) {
        currentChatId = null;
        chatContainer.innerHTML = '';
        
        // If there are other chats, switch to the most recent one
        const remainingChats = Object.keys(userChats[currentUser]);
        if (remainingChats.length > 0) {
            const mostRecentChatId = remainingChats[remainingChats.length - 1];
            switchChat(mostRecentChatId);
        }
    }
}

function createChatListItem(chatId, chatName) {
    const chatList = document.getElementById("chat-list");
    const li = document.createElement("li");
    li.classList.add("chat-item");
    li.dataset.chatId = chatId;

    const chatNameSpan = document.createElement("span");
    chatNameSpan.textContent = truncateText(chatName, 23);
    chatNameSpan.addEventListener("click", () => switchChat(chatId));

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.innerHTML = `<img src="img/delete.svg" alt="Delete Chat">`;
    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this chat?')) {
            deleteChat(chatId, li);
        }
    });

    li.appendChild(chatNameSpan);
    li.appendChild(deleteBtn);
    chatList.appendChild(li);
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

function speak(text) {
    // Helper function to split text into manageable chunks
    function splitTextIntoChunks(text, chunkSize) {
        const chunks = [];
        let currentPosition = 0;

        while (currentPosition < text.length) {
            chunks.push(text.slice(currentPosition, currentPosition + chunkSize));
            currentPosition += chunkSize;
        }

        return chunks;
    }

    // Stop any ongoing speech synthesis
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    const chunkSize = 200; // Limit chunk size for compatibility
    const textChunks = splitTextIntoChunks(text, chunkSize);
    let isSpeaking = false;

    function speakChunks(chunks) {
        if (isMuted) {
            console.log("Speech is muted.");
            return;
        }

        if (chunks.length === 0) {
            console.log("Speech synthesis completed.");
            return;
        }

        if (isSpeaking) {
            console.log("Already speaking, waiting for the current chunk to finish.");
            return;
        }

        isSpeaking = true;

        const currentChunk = chunks.shift();
        const speech = new SpeechSynthesisUtterance(currentChunk);

        speech.rate = 1;
        speech.pitch = 1;
        speech.volume = 1;
        speech.lang = "hi";

        speech.onend = () => {
            isSpeaking = false;
            console.log("Finished speaking a chunk.");
            speakChunks(chunks);
        };

        speech.onerror = (error) => {
            isSpeaking = false;
            console.error("Error in speech synthesis:", error);
        };

        window.speechSynthesis.speak(speech);
    }

    speakChunks(textChunks);
}

muteButton.addEventListener('click', () => {
    isMuted = !isMuted;

    if (isMuted) {
        muteButton.innerHTML = '<img src="img/mute.png" alt="Mute">';
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            isPaused = true;
        }
    } else {
        muteButton.innerHTML = '<img src="img/mute1.png" alt="Unmute">';
        if (isPaused) {
            window.speechSynthesis.resume();
            isPaused = false;
        } else {
            speak("Speech unmuted");
        }
    }
});

function wishMe() {
    if (!currentUser) return;
    
    let day = new Date();
    let hours = day.getHours();
    let greeting = "";
    
    if (hours >= 0 && hours < 12) {
        greeting = `Good morning ${currentUser}`;
    } else if (hours >= 12 && hours < 16) {
        greeting = `Good afternoon ${currentUser}`;
    } else {
        greeting = `Good evening ${currentUser}`;
    }
    
    speak(greeting);
}

// Initialize app when page loads
window.addEventListener('load', () => {
    initializeApp();
});

// Modular API Call
async function getApi(userMessage, aiChatBox) {
    try {
        // Check for YouTube commands
        if (userMessage.toLowerCase().includes("youtube")) {
            handleYouTubeCommand(userMessage);
            aiChatBox.innerHTML = "";
            aiChatBox.style.background = "transparent"; 
            return;
        }

        // Make the API request
        let response = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMessage }),
        });

        let data = await response.json();
        console.log("API Response:", data.response);

        if (data.response) {
            let textContent = data.response.introduction || data.response;
            aiChatBox.querySelector(".text").textContent = textContent;
            
            // Add assistant message to chat history
            addMessageToCurrentChat(textContent, 'assistant');
            
            autoScroll();
            speakLimited(textContent);
        } else {
            const errorMsg = "No response received.";
            aiChatBox.querySelector(".text").textContent = errorMsg;
            addMessageToCurrentChat(errorMsg, 'assistant');
            speakLimited(errorMsg);
        }
    } catch (error) {
        console.error("Error fetching API:", error);
        const errorMsg = "Error fetching response.";
        aiChatBox.querySelector(".text").textContent = errorMsg;
        addMessageToCurrentChat(errorMsg, 'assistant');
        speakLimited("There was an error fetching the response. Please check the connection.");
    }
}

function handleYouTubeCommand(command) {
    let searchQuery = command
        .toLowerCase()
        .replace(/\b(play|youtube|pr|pe|in|on)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
    
    if (searchQuery) {
        let youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
        window.open(youtubeUrl, "_blank");

        const responseMsg = `Searching ${searchQuery} on youtube`;
        addMessageToCurrentChat(responseMsg, 'assistant');
        speakLimited(responseMsg);
    } else {
        const responseMsg = "Please specify what to search on YouTube.";
        addMessageToCurrentChat(responseMsg, 'assistant');
        speakLimited(responseMsg);
    }
}

function speakLimited(text, sentenceLimit = 3) {
    if (isMuted) return;
    
    text = text.replace(/\*{3}/g, " ").replace(/\*{2}/g, " ").replace(/\*/g, " ");
    
    const sentences = text.match(/[^.!?]+[.!?]/g) || [text];
    const limitedText = sentences.slice(0, sentenceLimit).join(" ");
    
    window.speechSynthesis.cancel();
    
    const speech = new SpeechSynthesisUtterance(limitedText);
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;
    speech.lang = "hi";
    
    window.speechSynthesis.speak(speech);
}

function autoScroll() {
    const chatContainer = document.querySelector(".chat-container");
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Create Chat Box for User/Assistant Messages
function createChatBox(message, className) {
    let div = document.createElement('div');
    div.classList.add(className);
    div.innerHTML = `<div class="text">${message}</div>`;
    return div;
}

let shrinkTimeout;

searchContainer.addEventListener('mouseleave', function () {
    shrinkTimeout = setTimeout(function () {
        if (searchInput.value === '') {
            searchContainer.classList.remove('expanded');
        }
    }, 5000);
});

searchContainer.addEventListener('mouseenter', function () {
    clearTimeout(shrinkTimeout);
    searchContainer.classList.add('expanded');
});

// Command Processing with a Command Map
function processCommand(command) {
    const commandMap = {
        "hello": () => displayMessageAndSpeak(`Hello ${currentUser}, What can I help you with?`),
        "hey": () => displayMessageAndSpeak(`Hello ${currentUser}, What can I help you with?`),
        "who are you": () => displayMessageAndSpeak("Hi, I am MAYA a super intelligent virtual assistant, created by Mr. Rishikant Singh. To ease the life of human beings."),
        "what is your name": () => displayMessageAndSpeak("Hi, I am MAYA a super intelligent virtual assistant, created by Mr. Rishikant Singh. To ease the life of human beings."),
        "tum kaun ho": () => displayMessageAndSpeak("नमस्ते, मैं MAYA एक सुपर इंटेलिजेंट वर्चुअल असिस्टेंट हूं, जिसे श्रीमान ऋषिकांत सिंह जी ने बनाया है। मनुष्य के जीवन को आसान बनाने के लिए।"),
        "what's your name": () => displayMessageAndSpeak("Hi, I am MAYA a super intelligent virtual assistant, created by Mr. Rishikant Singh. To ease the life of human beings."),
        "date": () => {
            let date = new Date().toLocaleString(undefined, {day:"numeric", month:"short"});
            displayMessageAndSpeak(date)
        },
        "din batao": () => {
            let date = new Date().toLocaleString(undefined, {day:"numeric", month:"short"});
            displayMessageAndSpeak(date)
        },
        "language": () => displayMessageAndSpeak("Mai takriban 7151 bhashayon ko likh ur samajh sakti hoon"),
        "bhasha": () => displayMessageAndSpeak("Mai takriban 7151 bhashayon ko likh ur samajh sakti hoon"),
        "birthday": () => displayMessageAndSpeak("12 November ko apka birthday hai"),
        "do you know": () => displayMessageAndSpeak("Ha, mai Janti hu. Aap mere Creater ho. Apka Naam Rishikant hai."),
        "main kaun hun": () => displayMessageAndSpeak(`Aap mere malik ho, Apka Naam ${currentUser} hai.`),
        "tum mujhe janti ho": () => displayMessageAndSpeak(`Aap mere malik ho, Apka Naam ${currentUser} hai.`),
        "more about me": () => displayMessageAndSpeak("Okey, aap 22 years ke ho. Aapka ghar bihar ke Ara Jile me hai. Filhaal Aap Chandigarh University me padhte ho. Apka Interest Coding aur Pubg khelne me hai"),
        "mere bare me": () => displayMessageAndSpeak("Okey, aap 22 years ke ho. Aapka ghar bihar ke Ara Jile me hai. Filhaal Aap Chandigarh University me padhte ho. Apka Interest Coding aur Pubg khelne me hai"),
        "apne bare me": () => displayMessageAndSpeak("My mission is to make your life easier, more organized, and more efficient. Whether you need help managing your schedule, answering questions, or simply looking for a recommendation, I'm here to assist. I learn from your preferences to provide personalized, timely support, and I adapt to your needs as we work together. Think of me as your digital companion—always ready to help with tasks, simplify your day, and ensure you stay on track with ease. Let me handle the details so you can focus on what matters most!"),
        "more about you": () => displayMessageAndSpeak("My mission is to make your life easier, more organized, and more efficient. Whether you need help managing your schedule, answering questions, or simply looking for a recommendation, I'm here to assist. I learn from your preferences to provide personalized, timely support, and I adapt to your needs as we work together. Think of me as your digital companion—always ready to help with tasks, simplify your day, and ensure you stay on track with ease. Let me handle the details so you can focus on what matters most!"),
        "open youtube": () => {
            displayMessageAndSpeak("Opening YouTube...");
            window.open("https://www.youtube.com", "_blank");
        },
        "open google": () => {
            displayMessageAndSpeak("Opening Google...");
            window.open("https://www.google.com", "_blank");
        },
        "open instagram": () => {
            displayMessageAndSpeak("Opening instagram...");
            window.open("https://www.instagram.com", "_blank");
        },
        "open facebook": () => {
            displayMessageAndSpeak("Opening facebook...");
            window.open("https://www.facebook.com", "_blank");
        },
        "open whatsapp": () => {
            displayMessageAndSpeak("Opening whatsapp...");
            window.open("WhatsApp://");
        },
        "open calculator": () => {
            displayMessageAndSpeak("Opening calculator...");
            window.open("Calculator://");
        },
        "time": () => {
            let time = new Date().toLocaleString(undefined, {hour:"numeric", minute:"numeric"});
            displayMessageAndSpeak(`The current time is ${time}`);
        },
        "samay batao": () => {
            let time = new Date().toLocaleString(undefined, {hour:"numeric", minute:"numeric"});
            displayMessageAndSpeak(`Abhi ka samay hai ${time}`);
        },
    };

    // Utility function to display and speak a message
    function displayMessageAndSpeak(message) {
        const assistantChatBox = createChatBox(message, "ai-chat-box");
        chatContainer.appendChild(assistantChatBox);
        
        // Add to chat history
        addMessageToCurrentChat(message, 'assistant');
        
        speak(message);
    }

    // Match command or fallback to API call
    let matchedCommand = Object.keys(commandMap).find(key => command.includes(key));
    if (matchedCommand) {
        commandMap[matchedCommand]();
    } else {
        let aiChatBox = createChatBox("Loading...", "ai-chat-box");
        chatContainer.appendChild(aiChatBox);
        getApi(command, aiChatBox);
    }
}

// Send Message Handler
function sendMessage() {
    if (!currentUser) {
        alert('Please login first!');
        return;
    }
    
    const userMessage = searchInput.value.trim();
    if (userMessage) {
        // Create new chat if none exists
        if (!currentChatId) {
            createNewChat(userMessage);
        }
        
        // Add user message to chat
        chatContainer.appendChild(createChatBox(userMessage, "user-chat-box"));
        addMessageToCurrentChat(userMessage, 'user');
        
        searchInput.value = "";
        processCommand(userMessage.toLowerCase());
        
        // Add dark style to chat container
        setTimeout(() => {
            chatContainer.classList.add('dark');
        }, 100);
    }
}

// Button Events
sendBtn.addEventListener("click", sendMessage);
searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

// Speech Recognition Integration
let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    let recognition = new SpeechRecognition();
    recognition.onresult = (event) => {
        let transcript = event.results[event.resultIndex][0].transcript;
        content.innerText = transcript;
        takeCommand(transcript.toLowerCase());
    };

    recognition.onend = () => {
        btn.innerText = "";
        const img = document.createElement("img");
        img.src = "img/mic.svg";
        btn.appendChild(img);
        const text = document.createTextNode(" Start Listening");
        btn.appendChild(text);
        btn.classList.remove("listening");
    };

    btn.addEventListener("click", () => {
        if (!currentUser) {
            alert('Please login first!');
            return;
        }
        recognition.start();
        btn.innerText = "Listening...👂";
        btn.classList.add("listening");
    });
} else {
    btn.innerText = "Speech Recognition Not Supported";
    btn.disabled = true;
}

function takeCommand(command) {
    if (!currentUser) return;
    
    // Create new chat if none exists for voice commands
    if (!currentChatId) {
        createNewChat(command);
    }
    
    // Add user voice command to chat history
    const userChatBox = createChatBox(command, "user-chat-box");
    chatContainer.appendChild(userChatBox);
    addMessageToCurrentChat(command, 'user');

    const commandMap = {
        "language": () => displayMessageAndSpeak("Mai takriban 7151 bhashayon ko likh ur samajh sakti hoon"),
        "bhasha": () => displayMessageAndSpeak("Mai takriban 7151 bhashayon ko likh ur samajh sakti hoon"),
        "hello": () => displayMessageAndSpeak(`Hello ${currentUser}, What can I help you with?`),
        "hey": () => displayMessageAndSpeak(`Hello ${currentUser}, What can I help you with?`),
        "who are you": () => displayMessageAndSpeak("Hi, I am MAYA a super intelligent virtual assistant, created by Mr. Rishikant Singh. To ease the life of human beings."),
        "what is your name": () => displayMessageAndSpeak("Hi, I am MAYA a super intelligent virtual assistant, created by Mr. Rishikant Singh. To ease the life of human beings."),
        "tum kaun ho": () => speak("नमस्ते, मैं MAYA एक सुपर इंटेलिजेंट वर्चुअल असिस्टेंट हूं, जिसे श्रीमान ऋषिकांत सिंह जी ने बनाया है। मनुष्य के जीवन को आसान बनाने के लिए।"),
        "tumhe kisane banaaya hai": () => speak("नमस्ते, मैं MAYA एक सुपर इंटेलिजेंट वर्चुअल असिस्टेंट हूं, जिसे श्रीमान ऋषिकांत सिंह जी ने बनाया है। मनुष्य के जीवन को आसान बनाने के लिए।"),
        "what's your name": () => speak("Hi, I am MAYA a super intelligent virtual assistant, created by Mr. Rishikant Singh. To ease the life of human beings."),
        "birthday": () => displayMessageAndSpeak("12 November ko apka birthday hai"),
        "tum mujhe janti ho": () => displayMessageAndSpeak(`Aap mere malik ho, Apka Naam ${currentUser} hai.`),
        "main kaun hun": () => speak(`Aap mere malik ho, Apka Naam ${currentUser} hai.`),
        "do you know": () => speak("Ha, mai Janti hu. Aap mere Creater ho. Apka Naam Rishikant hai."),
        "more about me": () => speak("Okey, aap 22 years ke ho.Aapka ghar bihar ke Ara Jile me hai. Filhaal Aap Chandigarh University me padhte ho. Apka Interest Coding ur Pubg khelne me hai"),
        "mere bare me": () => speak("Okey, aap 22 years ke ho. Aapka ghar bihar ke Ara Jile me hai. Filhaal Aap Chandigarh University me padhte ho. Apka Interest Coding aur Pubg khelne me hai"),
        "apne bare me": () => speak("My mission is to make your life easier, more organized, and more efficient. Whether you need help managing your schedule, answering questions, or simply looking for a recommendation, I'm here to assist. I learn from your preferences to provide personalized, timely support, and I adapt to your needs as we work together. Think of me as your digital companion—always ready to help with tasks, simplify your day, and ensure you stay on track with ease. Let me handle the details so you can focus on what matters most!"),
        "more about you": () => speak("My mission is to make your life easier, more organized, and more efficient. Whether you need help managing your schedule, answering questions, or simply looking for a recommendation, I'm here to assist. I learn from your preferences to provide personalized, timely support, and I adapt to your needs as we work together. Think of me as your digital companion—always ready to help with tasks, simplify your day, and ensure you stay on track with ease. Let me handle the details so you can focus on what matters most!"),
        "date": () => {
            let date = new Date().toLocaleString(undefined, {day:"numeric", month:"short"});
            displayMessageAndSpeak(date)
        },
        "din batao": () => {
            let date = new Date().toLocaleString(undefined, {day:"numeric", month:"short"});
            displayMessageAndSpeak(date)
        },
        "open youtube": () => {
            displayMessageAndSpeak("Opening YouTube...");
            window.open("https://www.youtube.com", "_blank");
        },
        "open google": () => {
            displayMessageAndSpeak("Opening Google...");
            window.open("https://www.google.com", "_blank");
        },
        "open instagram": () => {
            displayMessageAndSpeak("Opening instagram...");
            window.open("https://www.instagram.com", "_blank");
        },
        "open facebook": () => {
            displayMessageAndSpeak("Opening facebook...");
            window.open("https://www.facebook.com", "_blank");
        },
        "open whatsapp": () => {
            displayMessageAndSpeak("Opening whatsapp...");
            window.open("WhatsApp://");
        },
        "open calculator": () => {
            displayMessageAndSpeak("Opening calculator...");
            window.open("Calculator://");
        },
        "time": () => {
            let time = new Date().toLocaleString(undefined, {hour:"numeric", minute:"numeric"});
            displayMessageAndSpeak(`The current time is ${time}`);
        },
        "samay batao": () => {
            let time = new Date().toLocaleString(undefined, {hour:"numeric", minute:"numeric"});
            displayMessageAndSpeak(`Abhi ka samay hai ${time}`);
        },
    };

    // Utility function to display and speak a message for voice commands
    function displayMessageAndSpeak(message) {
        const assistantChatBox = createChatBox(message, "ai-chat-box");
        chatContainer.appendChild(assistantChatBox);
        
        // Add to chat history
        addMessageToCurrentChat(message, 'assistant');
        
        speak(message);
        autoScroll();
    }

    // Match command or fallback to API call
    let matchedCommand = Object.keys(commandMap).find(key => command.includes(key));
    if (matchedCommand) {
        commandMap[matchedCommand]();
    } else if (command.includes("youtube") || command.includes("play")) {
        handleYouTubeCommand(command);
    } else {
        let aiChatBox = createChatBox("Loading...", "ai-chat-box");
        chatContainer.appendChild(aiChatBox);
        getApi(command, aiChatBox);
    }
    
    autoScroll();
}

// Clear Button Functionality
clearButton.addEventListener('click', () => {
    if (!currentUser) {
        alert('Please login first!');
        return;
    }
    
    if (confirm('Are you sure you want to clear the current chat?')) {
        chatContainer.innerHTML = '';
        
        // Create new chat for next message
        currentChatId = null;
        
        // Auto-scroll after clearing
        autoScroll();
    }
});

// Copy Button Functionality
copyButton.addEventListener('click', () => {
    const lastAiMessage = [...chatContainer.querySelectorAll('.ai-chat-box .text')].pop();
    if (lastAiMessage) {
        const textToCopy = lastAiMessage.textContent;
        
        // Try to use the modern clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                showNotification('Response copied to clipboard!');
            }).catch(() => {
                // Fallback to older method
                fallbackCopyTextToClipboard(textToCopy);
            });
        } else {
            // Fallback for older browsers or non-secure contexts
            fallbackCopyTextToClipboard(textToCopy);
        }
    } else {
        showNotification('No response to copy!');
    }
});

// Fallback copy method for older browsers
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Response copied to clipboard!');
        } else {
            showNotification('Failed to copy response!');
        }
    } catch (err) {
        showNotification('Copy not supported by browser!');
    }
    
    document.body.removeChild(textArea);
}

// Show notification function
function showNotification(message) {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 500);
    }, 3000);
}

// Sidebar Toggle Functionality
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');

hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// Close sidebar when clicking outside
document.addEventListener('click', (event) => {
    if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
        sidebar.classList.remove('open');
    }
});

// New Chat Button Functionality
document.addEventListener('click', (event) => {
    if (event.target.closest('.new-chat-btn')) {
        if (!currentUser) {
            alert('Please login first!');
            return;
        }
        
        // Clear current chat and create new one
        chatContainer.innerHTML = '';
        currentChatId = null;
        
        // Close sidebar
        sidebar.classList.remove('open');
        
        // Auto-scroll
        autoScroll();
    }
});

// Clear All History Button Functionality
document.addEventListener('click', (event) => {
    if (event.target.closest('.clear-all-btn')) {
        if (!currentUser) {
            alert('Please login first!');
            return;
        }
        
        if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
            // Clear all chats for current user
            userChats[currentUser] = {};
            
            // Clear UI
            document.getElementById('chat-list').innerHTML = '';
            chatContainer.innerHTML = '';
            currentChatId = null;
            
            // Save to storage
            saveUserChatsToStorage();
            
            // Close sidebar
            sidebar.classList.remove('open');
            
            showNotification('All chat history cleared!');
        }
    }
});

// Enhanced keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + Enter to send message
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
    
    // Escape to close sidebar
    if (event.key === 'Escape') {
        sidebar.classList.remove('open');
    }
    
    // Focus search input with Ctrl/Cmd + K
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        searchInput.focus();
    }
});

// Auto-save chat data periodically
setInterval(() => {
    if (currentUser) {
        saveUserChatsToStorage();
    }
}, 30000); // Save every 30 seconds

// Handle page unload to save data
window.addEventListener('beforeunload', () => {
    if (currentUser) {
        saveUserChatsToStorage();
    }
});

// Initialize search container behavior
searchInput.addEventListener('focus', () => {
    searchContainer.classList.add('expanded');
});

searchInput.addEventListener('blur', () => {
    if (searchInput.value === '') {
        setTimeout(() => {
            searchContainer.classList.remove('expanded');
        }, 200);
    }
});

// Handle search input changes
searchInput.addEventListener('input', () => {
    if (searchInput.value.trim() !== '') {
        searchContainer.classList.add('expanded');
    }
});

// Additional sidebar header styling
const sidebarHeader = document.querySelector('.sidebar-header');
if (sidebarHeader) {
    const clearAllBtn = document.createElement('button');
    clearAllBtn.className = 'clear-all-btn';
    clearAllBtn.innerHTML = '<span>🗑️ Clear All History</span>';
    clearAllBtn.title = 'Clear All Chat History';
    
    // Add to sidebar if not already present
    if (!document.querySelector('.clear-all-btn')) {
        sidebar.appendChild(clearAllBtn);
    }
}

// Enhanced error handling for API calls
window.addEventListener('online', () => {
    showNotification('Connection restored!');
});

window.addEventListener('offline', () => {
    showNotification('Connection lost. Some features may not work.');
});

// Additional utility functions
function getCurrentTimestamp() {
    return new Date().toLocaleString();
}

function formatChatName(message) {
    // Remove extra spaces and limit length
    return message.trim().replace(/\s+/g, ' ').substring(0, 30);
}

// Enhanced auto-scroll with smooth behavior
function smoothAutoScroll() {
    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
    });
}

// Update autoScroll calls to use smooth scrolling where appropriate
function autoScroll() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Console welcome message
console.log('%c🤖 MAYA Virtual Assistant Initialized Successfully! 🤖', 
    'color: #00ff41; font-size: 16px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);');
console.log('%cWelcome to MAYA - Your Personal AI Assistant', 
    'color: #007bff; font-size: 14px; font-weight: bold;');

// Performance optimization - debounce speech recognition
let speechTimeout;
function debouncedSpeech(text) {
    clearTimeout(speechTimeout);
    speechTimeout = setTimeout(() => {
        speak(text);
    }, 100);
}

// Enhanced mobile support
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

if (isMobileDevice()) {
    // Adjust for mobile
    searchContainer.style.position = 'fixed';
    searchContainer.style.bottom = '10px';
}

// Error boundary for critical functions
function safeExecute(fn, fallback = () => {}) {
    try {
        return fn();
    } catch (error) {
        console.error('Error in function execution:', error);
        fallback();
        return null;
    }
}
