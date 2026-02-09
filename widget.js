(function() {
    // --- CONFIGURATION ---
    const API_URL = "https://spoonai-api.onrender.com"; 
    const CLIENT_ID = window.SPOONAI_CLIENT_ID || "demo_restaurant";
    
    // --- STYLES (INJECTED) ---
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        /* Reset for Widget */
        #spoonai-widget-wrapper * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        
        /* Wrapper: Fixed to Bottom Right */
        #spoonai-widget-wrapper {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 10px;
        }

        /* Toggle Button */
        #spoonai-toggle-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #262626; /* Dark Grey */
            color: white;
            border: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: transform 0.2s, background-color 0.2s;
        }
        #spoonai-toggle-btn:hover { background-color: #000; transform: scale(1.05); }
        #spoonai-toggle-btn svg { width: 30px; height: 30px; }

        /* Chat Window */
        #spoonai-chat-window {
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #e5e5e5;
            animation: spoonai-fade-in 0.2s ease-out;
        }
        #spoonai-chat-window.open { display: flex; }

        /* Header */
        .spoonai-header {
            background-color: #262626;
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 600;
        }
        .spoonai-close { background: none; border: none; color: white; cursor: pointer; font-size: 20px; }

        /* Messages Area */
        .spoonai-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background-color: #f9f9f9;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        /* Message Bubbles */
        .spoonai-msg {
            max-width: 85%; /* Slightly wider for lists */
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.5;
        }
        .spoonai-msg-user {
            align-self: flex-end;
            background-color: #262626;
            color: white;
            border-bottom-right-radius: 2px;
        }
        .spoonai-msg-bot {
            align-self: flex-start;
            background-color: #e5e5e5;
            color: #1a1a1a;
            border-bottom-left-radius: 2px;
        }
        
        /* Formatting for Bold and Lists */
        .spoonai-msg-bot b, .spoonai-msg-bot strong { font-weight: 700; color: #000; }
        .spoonai-msg-bot ul { padding-left: 20px; margin: 5px 0; }
        .spoonai-msg-bot li { margin-bottom: 4px; }

        /* Input Area */
        .spoonai-input-area {
            padding: 12px;
            border-top: 1px solid #eee;
            background: white;
            display: flex;
            gap: 8px;
        }
        #spoonai-input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 20px;
            outline: none;
            font-size: 14px;
        }
        #spoonai-input:focus { border-color: #262626; }
        #spoonai-send {
            background: #262626;
            color: white;
            border: none;
            padding: 0 16px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
        }
        #spoonai-send:hover { background: #000; }

        /* Animations */
        @keyframes spoonai-fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Loading Dots */
        .spoonai-loading span {
            display: inline-block; width: 6px; height: 6px; background: #666; border-radius: 50%; margin: 0 2px;
            animation: spoonai-bounce 1.4s infinite ease-in-out both;
        }
        .spoonai-loading span:nth-child(1) { animation-delay: -0.32s; }
        .spoonai-loading span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes spoonai-bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

        .spoonai-legal {
            background-color: #f9f9f9;
            padding: 8px;
            text-align: center;
            font-size: 10px;
            color: #888;
            border-top: 1px solid #eee;
        }
        .spoonai-legal a {
            color: #666;
            text-decoration: none;
        }
        .spoonai-legal a:hover {
            text-decoration: underline;
        }
    `;
    document.head.appendChild(styleSheet);

    // --- HTML INJECTION ---
    
    const container = document.body;

    const wrapper = document.createElement('div');
    wrapper.id = 'spoonai-widget-wrapper';
    container.appendChild(wrapper);

    wrapper.innerHTML = `
        <div id="spoonai-chat-window">
            <div class="spoonai-header">
                <span>Guest Assistant</span>
                <button class="spoonai-close" id="spoonai-close-btn">×</button>
            </div>
            <div class="spoonai-messages" id="spoonai-messages"></div>
            
            <div class="spoonai-input-area">
                <input type="text" id="spoonai-input" placeholder="Type a message...">
                <button id="spoonai-send">Send</button>
            </div>

            <div class="spoonai-legal">
                Powered by 2SyL Neural • <a href="https://docs.google.com/document/d/1t_cm1z7wv6L73I2S7LDPS3iMKim5G2rtj5s8AXIBdzw/edit?usp=sharing" target="_blank">Privacy & Terms</a>
            </div>
        </div>

        <button id="spoonai-toggle-btn">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        </button>
    `;

    // --- LOGIC ---
    const chatWindow = document.getElementById('spoonai-chat-window');
    const toggleBtn = document.getElementById('spoonai-toggle-btn');
    const closeBtn = document.getElementById('spoonai-close-btn');
    const sendBtn = document.getElementById('spoonai-send');
    const inputField = document.getElementById('spoonai-input');
    const messagesDiv = document.getElementById('spoonai-messages');

    let sessionId = localStorage.getItem('spoonai_session');
    if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('spoonai_session', sessionId);
    }
    let isTyping = false;

    // --- HELPER: FORMATTER FUNCTION ---
    function formatMessage(text) {
        // 1. Bold: **text** -> <b>text</b>
        let formatted = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        
        // 2. Bullets: - item -> <br>• item
        // This regex looks for newlines followed by a dash
        formatted = formatted.replace(/\n\s*-\s/g, '<br>• ');
        
        // 3. Newlines: \n -> <br>
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    function toggleChat() {
        chatWindow.classList.toggle('open');
        // Intro Message (Multilingual)
        if (chatWindow.classList.contains('open') && messagesDiv.children.length === 0) {
            addMessage("Hello! How can I help you with our menu or reservations? (I answer in any language 🌎)", 'bot');
        }
    }

    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `spoonai-msg spoonai-msg-${sender}`;
        
        if (sender === 'bot') {
            // Apply formatting for the bot
            div.innerHTML = formatMessage(text);
        } else {
            // No formatting for user (Security)
            div.innerText = text;
        }
        
        messagesDiv.appendChild(div);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function addLoading() {
        const div = document.createElement('div');
        div.id = 'spoonai-loading-indicator';
        div.className = 'spoonai-msg spoonai-msg-bot spoonai-loading';
        div.innerHTML = '<span></span><span></span><span></span>';
        messagesDiv.appendChild(div);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function removeLoading() {
        const el = document.getElementById('spoonai-loading-indicator');
        if (el) el.remove();
    }

    async function sendMessage() {
        const text = inputField.value.trim();
        if (!text || isTyping) return;

        addMessage(text, 'user');
        inputField.value = '';
        isTyping = true;
        addLoading();

        try {
            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    session_id: sessionId,
                    client_id: CLIENT_ID
                })
            });
            const data = await res.json();
            removeLoading();
            if (data.response) addMessage(data.response, 'bot');
            else addMessage("Sorry, I didn't catch that.", 'bot');
        } catch (err) {
            removeLoading();
            addMessage("Connection error. Please try again.", 'bot');
        } finally {
            isTyping = false;
        }
    }

    // Listeners
    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);
    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

})();