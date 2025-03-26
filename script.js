const btn = document.querySelector("#listen-btn");
let content = document.querySelector("#content");
const searchContainer = document.querySelector('.search-container');
const searchInput = document.querySelector('.search-bar');
const sendBtn = document.querySelector('.send-btn');
const chatContainer = document.querySelector(".chat-container");
const clearButton = document.getElementById('clearButton');
const copyButton = document.getElementById('copyButton');
const muteButton = document.getElementById('muteButton');


// Base URL for backend API
const BACKEND_URL = "http://127.0.0.1:5000/generate-content"; // Python backend

let isMuted = false; // Global mute flag

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

        speech.rate = 1;  // Speed of speech
        speech.pitch = 1; // Pitch of voice
        speech.volume = 1; // Volume of voice
        speech.lang = "hi"; // Language (e.g., Hindi)

        speech.onend = () => {
            isSpeaking = false;
            console.log("Finished speaking a chunk.");
            speakChunks(chunks); // Speak the next chunk
        };

        speech.onerror = (error) => {
            isSpeaking = false;
            console.error("Error in speech synthesis:", error);
        };

        window.speechSynthesis.speak(speech);
    }

    // Start speaking all chunks
    speakChunks(textChunks);
}
muteButton.addEventListener('click', () => {
    isMuted = !isMuted; // Toggle mute state

    if (isMuted) {
        muteButton.innerHTML = '<img src="img/mute.png" alt="Mute">';
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause(); // Pause speech synthesis
            isPaused = true; // Mark speech as paused
        }
    } else {
        muteButton.innerHTML = '<img src="img/mute1.png" alt="Unmute">';
        if (isPaused) {
            window.speechSynthesis.resume(); // Resume speech synthesis
            isPaused = false; // Reset paused state
        } else {
            speak("Speech unmuted"); // Speak this if not paused
        }
    }
});

function wishMe() {
    let day = new Date();
    let hours = day.getHours();
    if (hours >= 0 && hours < 12) {
        speak("Good morning Sir");
    } else if (hours >= 12 && hours < 16) {
        speak("Good afternoon Sir");
    } else {
        speak("Good evening Sir");
    }
}

window.addEventListener('load', () => {
    wishMe();
});


// Modular API Call

async function getApi(userMessage, aiChatBox) {
    try {
        // Make the API request
        let response = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMessage }),
        });

        let data = await response.json();

        if (data.response && data.response.introduction) {
            const { introduction, sections } = data.response;
        
            // Format the response for display
            let formattedResponse = `
            <div>
                <strong>
                    <span style="color: #d46a6a; font-size: 1.5rem; font-weight: bold; text-decoration: underline;">Introduction:</span>
                </strong> ${introduction}
            </div>
            `;
        
            if (sections && sections.length > 0) {
                sections.forEach((section) => {
                    // Only add the section if content is available
                    if (section.content) {
                        formattedResponse += `
                        <div>
                            <h3>
                                <span style="color: #4CAF50; font-size: 1.2rem; text-decoration: underline;">${section.title}:</span>
                            </h3>
                            <div>${section.content}</div>
                        </div>
                        `;
                    }
                });
            }
        
            // Update AI chatbox with formatted HTML
            aiChatBox.querySelector(".text").innerHTML = formattedResponse;
        
            // Scroll up old responses
            const chatContainer = document.querySelector(".chat-container");
            chatContainer.scrollTop = chatContainer.scrollHeight - chatContainer.clientHeight;
        
            // Speak only the introduction
            speak(introduction);
        } 
        else {
            aiChatBox.querySelector(".text").textContent = data.response || "No response received.";
            speak(data.response || "No response received.");
        }
        
    } catch (error) {
        console.error("Error fetching API:", error);
        aiChatBox.querySelector(".text").textContent = "Error fetching response.";
        speak("There was an error fetching the response. Please check the connection.");
    }
}


// Create Chat Box for User/Assistant Messagesx
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
        "hello": () => displayMessageAndSpeak("Hello Sir, What can I help you with?"),
        "hey": () => displayMessageAndSpeak("Hello Sir, What can I help you with?"),
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
        "main kaun hun": () => displayMessageAndSpeak("Aap mere malik ho, Apka Naam Mr. Rishikant Singh hai."),
        "tum mujhe janti ho": () => displayMessageAndSpeak("Aap mere malik ho, Apka Naam Mr. Rishikant Singh hai."),
        "more about me": () => displayMessageAndSpeak("Okey, aap 22 years ke ho. Aapka ghar bihar ke Ara Jile me hai. Filhaal Aap Chandigarh University me padhte ho. Apka Interest Coding aur Pubg khelne me hai"),
        "mere bare me": () => displayMessageAndSpeak("Okey, aap 22 years ke ho. Aapka ghar bihar ke Ara Jile me hai. Filhaal Aap Chandigarh University me padhte ho. Apka Interest Coding aur Pubg khelne me hai"),
        "apne bare me": () => displayMessageAndSpeak("My mission is to make your life easier, more organized, and more efficient. Whether you need help managing your schedule, answering questions, or simply looking for a recommendation, I’m here to assist. I learn from your preferences to provide personalized, timely support, and I adapt to your needs as we work together. Think of me as your digital companion—always ready to help with tasks, simplify your day, and ensure you stay on track with ease. Let me handle the details so you can focus on what matters most!"),
        "more about you": () => displayMessageAndSpeak("My mission is to make your life easier, more organized, and more efficient. Whether you need help managing your schedule, answering questions, or simply looking for a recommendation, I’m here to assist. I learn from your preferences to provide personalized, timely support, and I adapt to your needs as we work together. Think of me as your digital companion—always ready to help with tasks, simplify your day, and ensure you stay on track with ease. Let me handle the details so you can focus on what matters most!"),
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
        // Display the assistant's message in the chat container
        const assistantChatBox = createChatBox(message, "ai-chat-box");
        chatContainer.appendChild(assistantChatBox);

        // Use the speak function to voice the message
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
    const userMessage = searchInput.value.trim();
    if (userMessage) {
        chatContainer.appendChild(createChatBox(userMessage, "user-chat-box"));
        searchInput.value = "";
        processCommand(userMessage.toLowerCase());
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
        recognition.start();
        btn.innerText = "Listening...👂";
        btn.classList.add("listening");
    });
} else {
    btn.innerText = "Speech Recognition Not Supported";
    btn.disabled = true;
}

function takeCommand(command) {
    const commandMap = {
        "language": () => displayMessageAndSpeak("Mai takriban 7151 bhashayon ko likh ur samajh sakti hoon"),
        "bhasha": () => displayMessageAndSpeak("Mai takriban 7151 bhashayon ko likh ur samajh sakti hoon"),
        "hello": () => displayMessageAndSpeak("Hello Sir, What can I help you with?"),
        "hey": () => displayMessageAndSpeak("Hello Sir, What can I help you with?"),
        "who are you": () => displayMessageAndSpeak("Hi, I am MAYA a super intelligent virtual assistant, created by Mr. Rishikant Singh. To ease the life of human beings."),
        "what is your name": () => displayMessageAndSpeak("Hi, I am MAYA a super intelligent virtual assistant, created by Mr. Rishikant Singh. To ease the life of human beings."),
        "tum kaun ho": () => speak("नमस्ते, मैं MAYA एक सुपर इंटेलिजेंट वर्चुअल असिस्टेंट हूं, जिसे श्रीमान ऋषिकांत सिंह जी ने बनाया है। मनुष्य के जीवन को आसान बनाने के लिए।"),
        "tumhe kisane banaaya hai": () => speak("नमस्ते, मैं MAYA एक सुपर इंटेलिजेंट वर्चुअल असिस्टेंट हूं, जिसे श्रीमान ऋषिकांत सिंह जी ने बनाया है। मनुष्य के जीवन को आसान बनाने के लिए।"),
        "what's your name": () => speak("Hi, I am MAYA a super intelligent virtual assistant, created by Mr. Rishikant Singh. To ease the life of human beings."),
        "birthday": () => displayMessageAndSpeak("12 November ko apka birthday hai"),
        "tum mujhe janti ho": () => displayMessageAndSpeak("Aap mere malik ho, Apka Naam Mr. Rishikant Singh hai."),
        "main kaun hun": () => speak("Aap mere malik ho, Apka Naam Mr. Rishikant Singh hai."),
        "do you know": () => speak("Ha, mai Janti hu. Aap mere Creater ho. Apka Naam Rishikant hai."),
        "more about me": () => speak("Okey, aap 22 years ke ho. Aapka ghar bihar ke Ara Jile me hai. Filhaal Aap Chandigarh University me padhte ho. Apka Interest Coding ur Pubg khelne me hai"),
        "mere bare me": () => speak("Okey, aap 22 years ke ho. Aapka ghar bihar ke Ara Jile me hai. Filhaal Aap Chandigarh University me padhte ho. Apka Interest Coding aur Pubg khelne me hai"),
        "apne bare me": () => speak("My mission is to make your life easier, more organized, and more efficient. Whether you need help managing your schedule, answering questions, or simply looking for a recommendation, I’m here to assist. I learn from your preferences to provide personalized, timely support, and I adapt to your needs as we work together. Think of me as your digital companion—always ready to help with tasks, simplify your day, and ensure you stay on track with ease. Let me handle the details so you can focus on what matters most!"),
        "more about you": () => speak("My mission is to make your life easier, more organized, and more efficient. Whether you need help managing your schedule, answering questions, or simply looking for a recommendation, I’m here to assist. I learn from your preferences to provide personalized, timely support, and I adapt to your needs as we work together. Think of me as your digital companion—always ready to help with tasks, simplify your day, and ensure you stay on track with ease. Let me handle the details so you can focus on what matters most!"),
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
            displayMessageAndSpeak(`Abhi ka samay hai ${time}`);
        },
        "samay batao": () => {
            let time = new Date().toLocaleString(undefined, {hour:"numeric", minute:"numeric"});
            displayMessageAndSpeak(`Abhi ka samay hai ${time}`);
        },
    };

    // Utility function to display and speak a message
    function displayMessageAndSpeak(message) {
        // Display the assistant's message in the chat container
        const assistantChatBox = createChatBox(message, "ai-chat-box");
        chatContainer.appendChild(assistantChatBox);

        // Use the speak function to voice the message
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

    setTimeout(() => {
        chatContainer.classList.add('dark'); // Add the 'dark' class to chat container
    }, 100);
}

// Notification Utility
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerText = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 1000);
}

// Clear and Copy Handlers
clearButton.addEventListener('click', () => {
    chatContainer.innerHTML = ''; // Clear all content inside the container
    chatContainer.classList.remove('dark'); // Reset background to normal
    showNotification("Content cleared!");
});

copyButton.addEventListener('click', () => {
    // Select the last AI response element inside the chat container
    const lastResponse = chatContainer.querySelector('.ai-chat-box:last-of-type .text');

    if (lastResponse) {
        const responseText = lastResponse.innerText;

        // Copy the last response text to the clipboard
        navigator.clipboard.writeText(responseText)
            .then(() => showNotification("Last response copied to clipboard!"))
            .catch(() => showNotification("Failed to copy content!"));
    } else {
        showNotification("No response to copy!");
    }
});

function displayMessageAndSpeak(message) {
    // Add the dark style to the chat container
    chatContainer.classList.add("dark");

    // Create and style the assistant's response box
    const assistantChatBox = createChatBox(message, "ai-chat-box dark-response");
    chatContainer.appendChild(assistantChatBox);

    // Use the speak function to voice the message
    speak(message);

    // Ensure the latest message is visible
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Optionally remove the dark style after some time
    setTimeout(() => {
        chatContainer.classList.remove("dark");
    }, 3000); // Adjust timeout as needed
}

document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById("hamburger");
    const sidebar = document.getElementById("sidebar");
    const chatList = document.getElementById("chat-list");
    const newChatBtn = document.querySelector(".new-chat-btn");
    const searchInput = document.querySelector(".search-bar");
    const contentOutput = document.getElementById("content-output");

    let currentChatId = null; // To track the current chat
    const chats = {}; // Store chats and their messages

    // Toggle sidebar visibility
    hamburger.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent the click from propagating to the document
        sidebar.classList.toggle("open");
    });

    // Close sidebar when clicking outside of it, except when clicking on the search bar or inside the sidebar itself
    document.addEventListener("click", (e) => {
        if (!sidebar.contains(e.target) && !hamburger.contains(e.target) && !searchInput.contains(e.target)) {
            sidebar.classList.remove("open");
        }
    });

    // Prevent sidebar from closing when clicking inside the search bar
    searchInput.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent the document click listener from firing
    });

    // Create a new chat
    newChatBtn.addEventListener("click", () => {
        const chatId = `chat-${Date.now()}`; // Unique ID for each chat
        const chatName = `New Chat`;

        // Add chat to chats object
        chats[chatId] = {
            name: chatName,
            messages: [],
        };

        // Update current chat
        currentChatId = chatId;

        // Add chat to the sidebar
        createChatListItem(chatId, chatName);

        // Update content-output
        switchChat(chatId);
    });

    // Switch between chats
    function switchChat(chatId) {
        currentChatId = chatId;
        const chat = chats[chatId];

        // Clear and update content-output
        chat.messages.forEach((msg) => {
            const p = document.createElement("p");
            p.textContent = msg;
            contentOutput.appendChild(p);
        });
    }

    // Delete a chat
    function deleteChat(chatId, chatElement) {
        // Remove from chats object
        delete chats[chatId];

        // Remove from sidebar
        chatElement.remove();

        // If the current chat is being deleted, reset content
        if (currentChatId === chatId) {
            currentChatId = null;
            contentOutput.innerHTML = "";
        }
    }

    // Handle search bar input to update chat heading
    searchInput.addEventListener("input", () => {
        const searchQuery = searchInput.value.trim();
        if (searchQuery && currentChatId) {
            // Update the heading of the current chat
            chats[currentChatId].name = searchQuery;

            // Update the chat name in the sidebar (truncate to 23 characters)
            const truncatedName = truncateText(searchQuery, 23);
            const chatItem = document.querySelector(`li[data-chat-id="${currentChatId}"] span`);
            if (chatItem) {
                chatItem.textContent = truncatedName;
            }
        }
    });

    // Helper function to create a chat list item in the sidebar
    function createChatListItem(chatId, chatName) {
        const li = document.createElement("li");
        li.classList.add("chat-item");
        li.dataset.chatId = chatId;

        // Chat name element
        const chatNameSpan = document.createElement("span");
        chatNameSpan.textContent = truncateText(chatName, 23);
        chatNameSpan.addEventListener("click", () => switchChat(chatId));

        // Delete button element
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.innerHTML = `<img src="img/delete.svg" alt="Delete Chat">`;
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent triggering the chat switch
            deleteChat(chatId, li);
        });

        li.appendChild(chatNameSpan);
        li.appendChild(deleteBtn);
        chatList.appendChild(li);
    }

    // Helper function to truncate text with ellipsis
    function truncateText(text, maxLength) {
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    }
});
