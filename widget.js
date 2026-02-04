document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const API_URL = "http://127.0.0.1:5000"; // Point to your local Flask backend
    
    // DOM Elements
    const chatWindow = document.getElementById('spoonai-chat-window');
    const toggleBtn = document.getElementById('spoonai-toggle-btn');
    const closeBtn = document.getElementById('spoonai-close-btn');
    const sendBtn = document.getElementById('spoonai-send-btn');
    const inputField = document.getElementById('spoonai-input');
    const messagesContainer = document.getElementById('spoonai-messages');

    // State
    let isOpen = false;
    let isTyping = false;
    
    // Session Management (Generate simple random ID if not exists)
    let sessionId = localStorage.getItem('spoonai_session');
    if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('spoonai_session', sessionId);
    }

    // --- Functions ---

    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            chatWindow.classList.remove('hidden', 'opacity-0', 'scale-95');
            chatWindow.classList.add('opacity-100', 'scale-100');
            // Check if chat is empty, if so, load greeting
            if (messagesContainer.children.length === 0) {
                fetchGreeting();
            }
        } else {
            chatWindow.classList.add('opacity-0', 'scale-95');
            setTimeout(() => chatWindow.classList.add('hidden'), 300); // Wait for transition
        }
    }

    function addMessage(text, sender) {
        const div = document.createElement('div');
        const isUser = sender === 'user';
        
        div.className = `max-w-[80%] p-3 rounded-lg text-sm ${
            isUser 
                ? 'bg-amber-600 text-white self-end rounded-br-none' 
                : 'bg-gray-200 text-gray-800 self-start rounded-bl-none'
        }`;
        // div.innerText = text;
        if (sender === 'bot') {
    // Allow HTML for the bot so links work
        div.innerHTML = text;
        } else {
            // Keep user input as text to prevent XSS attacks
            div.innerText = text;
        }
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto scroll
    }

    function addLoadingIndicator() {
        const div = document.createElement('div');
        div.id = 'spoonai-loading';
        div.className = 'bg-gray-200 text-gray-800 self-start rounded-bl-none p-3 rounded-lg text-sm flex gap-1';
        div.innerHTML = `
            <span class="animate-bounce">●</span>
            <span class="animate-bounce delay-100">●</span>
            <span class="animate-bounce delay-200">●</span>
        `;
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeLoadingIndicator() {
        const loading = document.getElementById('spoonai-loading');
        if (loading) loading.remove();
    }



    async function fetchGreeting() {
        addLoadingIndicator();
        try {
            const res = await fetch(`${API_URL}/greeting`);
            const data = await res.json();
            removeLoadingIndicator();
            addMessage(data.message, 'bot');
        } catch (error) {
            removeLoadingIndicator();
            console.error("API Error:", error);
            addMessage("Hello! I'm ready to help.", 'bot');
        }
    }

    async function sendMessage() {
        const text = inputField.value.trim();
        if (!text || isTyping) return;

        addMessage(text, 'user');
        inputField.value = '';
        isTyping = true;
        addLoadingIndicator();

        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, session_id: sessionId, client_id: client_id })
            });
            
            const data = await response.json();
            removeLoadingIndicator();
            
            if (data.response) {
                addMessage(data.response, 'bot');
            } else {
                addMessage("Sorry, I didn't catch that.", 'bot');
            }

        } catch (error) {
            removeLoadingIndicator();
            console.error("API Error:", error);
            addMessage("Oops! Connection error.", 'bot');
        } finally {
            isTyping = false;
        }
    }

    // --- Event Listeners ---

    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);
    
    sendBtn.addEventListener('click', sendMessage);
    
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
});