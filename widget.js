(function() {
    // 1. CONFIGURATION
    const API_URL = "https://spoonai-api.onrender.com"; // Your Render Backend
    const CLIENT_ID = window.SPOONAI_CLIENT_ID || "demo_restaurant"; // Get ID from the website

    // 2. INJECT CSS (The Styles)
    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    // Point this to your GitHub Pages CSS file
    styleLink.href = "https://bjeong212.github.io/spoonai-widget/styles.css"; 
    document.head.appendChild(styleLink);

    // 3. INJECT HTML (The Chat Interface)
    // We insert this into the container div you put on the website
    const container = document.getElementById('spoonai-widget-container');
    if (!container) {
        console.error("SpoonAI Error: Container <div id='spoonai-widget-container'> not found.");
        return;
    }

    container.innerHTML = `
        <button id="spoonai-toggle-btn" class="fixed bottom-4 right-4 bg-zinc-800 text-white p-4 rounded-full shadow-lg hover:bg-black transition-all z-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        </button>

        <div id="spoonai-chat-window" class="fixed bottom-20 right-4 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300 origin-bottom-right opacity-0 scale-95 hidden z-50 flex flex-col max-h-[500px]">
            
            <div class="bg-zinc-800 p-4 text-white flex justify-between items-center shadow-sm">
                <h3 class="font-bold text-lg flex items-center gap-2">
                    <span>🥄</span> Guest Assistant
                </h3>
                <button id="spoonai-close-btn" class="hover:bg-black p-1 rounded transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <div id="spoonai-messages" class="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 h-80 min-h-[300px]">
                </div>

            <div class="p-3 border-t bg-white flex gap-2">
                <input type="text" id="spoonai-input" placeholder="Type a message..." 
                    class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all">
                <button id="spoonai-send-btn" class="bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Send
                </button>
            </div>
        </div>
    `;

    // 4. LOGIC (The Brains)
    const chatWindow = document.getElementById('spoonai-chat-window');
    const toggleBtn = document.getElementById('spoonai-toggle-btn');
    const closeBtn = document.getElementById('spoonai-close-btn');
    const sendBtn = document.getElementById('spoonai-send-btn');
    const inputField = document.getElementById('spoonai-input');
    const messagesContainer = document.getElementById('spoonai-messages');

    let isOpen = false;
    let isTyping = false;
    
    // Session ID Setup
    let sessionId = localStorage.getItem('spoonai_session');
    if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('spoonai_session', sessionId);
    }

    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            chatWindow.classList.remove('hidden');
            // Small delay to allow 'display: block' to apply before opacity transition
            setTimeout(() => {
                chatWindow.classList.remove('opacity-0', 'scale-95');
                chatWindow.classList.add('opacity-100', 'scale-100');
            }, 10);
            
            if (messagesContainer.children.length === 0) {
                // Initial greeting could go here if you wanted to fetch it
                addMessage("Hello! I'm here to help with menus and reservations.", 'bot');
            }
        } else {
            chatWindow.classList.remove('opacity-100', 'scale-100');
            chatWindow.classList.add('opacity-0', 'scale-95');
            setTimeout(() => chatWindow.classList.add('hidden'), 300);
        }
    }

    function addMessage(text, sender) {
        const div = document.createElement('div');
        const isUser = sender === 'user';
        
        div.className = `max-w-[80%] p-3 rounded-lg text-sm ${
            isUser 
                ? 'bg-zinc-800 text-white self-end rounded-br-none ml-auto' 
                : 'bg-gray-200 text-gray-800 self-start rounded-bl-none mr-auto'
        }`;
        
        if (sender === 'bot') {
            div.innerHTML = text; // Allow HTML for links
        } else {
            div.innerText = text; // Secure user text
        }
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function addLoadingIndicator() {
        const div = document.createElement('div');
        div.id = 'spoonai-loading';
        div.className = 'bg-gray-200 text-gray-800 self-start rounded-bl-none p-3 rounded-lg text-sm flex gap-1 w-fit';
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
                body: JSON.stringify({ 
                    message: text, 
                    session_id: sessionId, 
                    client_id: CLIENT_ID // <--- Uses the ID from the window
                })
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

    // Event Listeners
    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);
    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

})();