import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './ChatBot.css';

// ── FAQ Knowledge Base ─────────────────────────────────────────────
const FAQ = [
    {
        keywords: ['hello', 'hi', 'hey', 'namaste', 'greet', 'start', 'help'],
        answer: "👋 Hello! I'm CivicBot, your assistant for the CivicConnect portal. You can ask me about:\n• Filing complaints\n• Tracking complaint status\n• Credibility scores\n• Community voting\n• Officer notices\n• Escalation process\n\nWhat would you like to know?"
    },
    {
        keywords: ['file', 'submit', 'new complaint', 'create complaint', 'report', 'raise', 'how to complain'],
        answer: "📝 **How to file a complaint:**\n1. Click **'New Complaint'** in the sidebar\n2. Enter a title and description of the issue\n3. Select the **category** (Water Supply, Roads, etc.)\n4. Provide the **specific location** of the problem\n5. Click **'Submit Complaint'**\n\nYour complaint will automatically be assigned to the officer responsible for your area and department. ✅"
    },
    {
        keywords: ['track', 'status', 'my complaint', 'progress', 'update', 'follow'],
        answer: "🔍 **Tracking your complaint:**\n1. Click **'My Complaints'** in the sidebar\n2. You'll see all your complaints with their current status\n3. Click **'View Details'** on any complaint to see:\n   • Status timeline (Submitted → Assigned → In Progress → Resolved)\n   • Officer feedback/remarks\n   • Assigned officer details\n\n**Status meanings:**\n🔵 SUBMITTED — Waiting for review\n📌 ASSIGNED — Assigned to an officer\n🔧 IN PROGRESS — Officer is working on it\n✅ RESOLVED — Issue fixed!\n❌ REJECTED — Complaint was not valid"
    },
    {
        keywords: ['credibility', 'score', 'points', 'reputation', 'rating', 'trust'],
        answer: "⭐ **Credibility Score:**\nYour score reflects how trustworthy your complaints are. Here's how points are earned:\n\n✅ Complaint resolved → **+10 points**\n👍 Your complaint gets upvoted → **+5 points**\n🗳️ You upvote someone's complaint → **+1 point**\n❌ Complaint rejected / false info → **−10 points**\n\nThere's no upper limit — the more valid, useful complaints you file, the higher your score grows!"
    },
    {
        keywords: ['vote', 'upvote', 'community', 'feed', 'support', 'thumbs'],
        answer: "👍 **Community Voting:**\nGo to **'Community Feed'** in the sidebar to see all complaints from your area.\n\n• Click the **△ (upvote)** button on any complaint you think is valid and worth solving\n• You earn **+1 credibility** for each vote you cast\n• The complaint author earns **+5 credibility** when their complaint is upvoted\n• Highly voted complaints get elevated to **HIGH** or **CRITICAL** impact level, pushing officers to resolve them faster\n\n⚠️ You cannot vote on your own complaints."
    },
    {
        keywords: ['notice', 'announcement', 'notification', 'alert', 'publish', 'bulletin'],
        answer: "📢 **Official Notices:**\nField officers publish notices to inform citizens about:\n• Scheduled maintenance (water shutdowns, road closures)\n• Urgent alerts\n• Community events\n\n**Where to see them:**\n• Scroll down on your **Dashboard** — the '📢 Official Notices for Your Area' section shows all active notices\n• Click **'Notices'** in the sidebar to jump there directly\n\nNotices from your ward AND parent areas (city, district) are all visible to you."
    },
    {
        keywords: ['escalation', 'escalate', 'overdue', 'level 2', 'level 3', 'district', 'higher authority', 'not resolved'],
        answer: "⚠️ **Complaint Escalation:**\nIf a complaint is not resolved within the SLA deadline:\n\n🔁 It is automatically **escalated** to a higher-level officer:\n• **Level 1** → Local field officer (first responder)\n• **Level 2** → Division / Block authority\n• **Level 3** → District authority\n\nEscalation happens automatically — you don't need to do anything. Your complaint's status will show **OVERDUE** until it's resolved."
    },
    {
        keywords: ['department', 'category', 'water', 'electricity', 'road', 'sanitation', 'health', 'education', 'transport'],
        answer: "🏛️ **Complaint Categories (Departments):**\n• 💧 Water Supply\n• ⚡ Electricity\n• 🛣️ Roads & Infrastructure\n• 🗑️ Sanitation & Waste\n• 🏥 Public Health\n• 🏫 Education\n• 🚌 Transportation\n• 🌳 Parks & Recreation\n• 🔒 Public Safety\n• 📋 Other\n\nYour complaint is automatically routed to the officer handling that department in your area."
    },
    {
        keywords: ['officer', 'admin', 'field officer', 'contact', 'who', 'assigned'],
        answer: "👮 **About Officers:**\nOfficers are government field workers who manage complaints in specific areas and departments.\n\n• **Level 1** officers manage day-to-day complaints in your ward/block\n• **Level 2** officers oversee a district/division\n• **Level 3** officers are district-level authorities\n\nYou can see which officer is handling your complaint by clicking **'View Details'** on any complaint. Their name and department are shown in the complaint detail page."
    },
    {
        keywords: ['register', 'sign up', 'account', 'create account', 'join'],
        answer: "🔐 **Registering on CivicConnect:**\n1. Go to the **Login page** and click 'Register'\n2. Choose your role — **Citizen** or **Officer (Admin)**\n3. As a Citizen: select your **State → District → City → Ward** during registration\n4. Your complaints will automatically be linked to your registered area\n\n👮 Officers register with their department and assigned geographic units."
    },
    {
        keywords: ['password', 'login', 'sign in', 'forgot', 'reset'],
        answer: "🔑 **Login:**\nUse your registered email and password to log in at the CivicConnect login page.\n\nIf you have trouble logging in:\n• Make sure you're using the correct email\n• Passwords are case-sensitive\n• If you see an 'unauthorized' error, try logging out and logging back in to refresh your session."
    },
    {
        keywords: ['sla', 'deadline', 'time limit', 'how long', 'when resolved', 'resolution time'],
        answer: "⏱️ **Resolution Deadlines (SLA):**\nEach complaint has a deadline based on its category:\n\n• Most complaints: **7 days** to resolve\n• High-impact complaints (many votes): resolved faster\n• If unresolved by the deadline → automatically escalated to a higher officer\n\nYou can see the SLA deadline in the **complaint detail page**. If it's shown in red, the complaint is overdue."
    },
    {
        keywords: ['impact', 'priority', 'critical', 'high priority'],
        answer: "🎯 **Impact Levels:**\nComplaints are rated by community votes:\n\n🟢 **LOW** — 0–4 votes\n🔵 **MODERATE** — 5–9 votes\n🟡 **HIGH** — 10–19 votes\n🔴 **CRITICAL** — 20+ votes\n\nHigher impact complaints are given higher priority by officers and are escalated faster if unresolved."
    },
    {
        keywords: ['what is', 'what can', 'about', 'civicconnect', 'portal', 'app', 'purpose'],
        answer: "🏛️ **About CivicConnect:**\nCivicConnect is a civic complaint governance portal connecting citizens with government field officers.\n\n**For Citizens:**\n✅ File complaints about civic issues in your area\n✅ Track complaint status in real time\n✅ Vote on community complaints\n✅ See official notices from officers\n\n**For Government Officers:**\n✅ View and manage complaints in their assigned department + area\n✅ Update complaint status and provide feedback\n✅ Post notices for citizens\n\nComplaints auto-escalate to higher officers if not resolved on time."
    }
];

// Quick suggestion chips
const SUGGESTIONS = [
    'How do I file a complaint?',
    'How do I track my complaint?',
    'What is a credibility score?',
    'How does community voting work?',
    'What are official notices?',
    'How does escalation work?',
];

// Match user input to FAQ
function getBotResponse(input) {
    const lower = input.toLowerCase().trim();
    for (const faq of FAQ) {
        if (faq.keywords.some(kw => lower.includes(kw))) {
            return faq.answer;
        }
    }
    return "🤔 I'm not sure about that. Try asking about:\n• Filing complaints\n• Complaint status & tracking\n• Credibility scores\n• Community voting\n• Escalation process\n• Official notices\n\nOr type **'help'** to see all topics.";
}

// Render answer text with basic markdown (bold, newlines, bullets)
function RenderAnswer({ text }) {
    const lines = text.split('\n');
    return (
        <div className="bot-answer">
            {lines.map((line, i) => {
                // Bold: **text**
                const parts = line.split(/\*\*(.*?)\*\*/g);
                return (
                    <span key={i} className="answer-line">
                        {parts.map((part, j) =>
                            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                        )}
                        {i < lines.length - 1 && <br />}
                    </span>
                );
            })}
        </div>
    );
}

// ── ChatBot Component ──────────────────────────────────────────────
const ChatBot = () => {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: `👋 Hi ${user?.name?.split(' ')[0] || 'there'}! I'm **CivicBot**. Ask me anything about CivicConnect or click a suggestion below.`
        }
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // Hooks must always be called unconditionally (Rules of Hooks)
    useEffect(() => {
        if (open) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            inputRef.current?.focus();
        }
    }, [messages, open]);

    // Only show for citizens — placed AFTER all hooks
    if (user?.role !== 'CITIZEN') return null;

    const sendMessage = (text) => {
        const userText = (text || input).trim();
        if (!userText) return;

        const userMsg = { id: Date.now(), type: 'user', text: userText };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setTyping(true);

        // Simulate slight delay for natural feel
        setTimeout(() => {
            const answer = getBotResponse(userText);
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: answer }]);
            setTyping(false);
        }, 600);
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* ── Chat window ─────────────────────────── */}
            {open && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <div className="chatbot-avatar">🤖</div>
                            <div>
                                <div className="chatbot-name">CivicBot</div>
                                <div className="chatbot-status">● Online</div>
                            </div>
                        </div>
                        <button className="chatbot-close" onClick={() => setOpen(false)}>✕</button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`chat-bubble-wrap ${msg.type}`}>
                                {msg.type === 'bot' && <div className="bot-icon">🤖</div>}
                                <div className={`chat-bubble ${msg.type}`}>
                                    <RenderAnswer text={msg.text} />
                                </div>
                            </div>
                        ))}

                        {typing && (
                            <div className="chat-bubble-wrap bot">
                                <div className="bot-icon">🤖</div>
                                <div className="chat-bubble bot typing-bubble">
                                    <span className="dot" /><span className="dot" /><span className="dot" />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Suggestion chips — always visible */}
                    <div className="chatbot-suggestions">
                        {SUGGESTIONS.map((s, i) => (
                            <button
                                key={i}
                                className="suggestion-chip"
                                onClick={() => sendMessage(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <div className="chatbot-input-row">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Ask anything about CivicConnect..."
                            className="chatbot-input"
                        />
                        <button
                            className="chatbot-send"
                            onClick={() => sendMessage()}
                            disabled={!input.trim()}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}

            {/* ── Floating trigger button ──────────────── */}
            <button
                className={`chatbot-fab ${open ? 'open' : ''}`}
                onClick={() => setOpen(o => !o)}
                title="Ask CivicBot"
            >
                {open ? '✕' : '💬'}
                {!open && <span className="fab-label">Help</span>}
            </button>
        </>
    );
};

export default ChatBot;
