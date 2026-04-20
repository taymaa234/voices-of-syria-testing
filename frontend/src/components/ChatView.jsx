import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiArrowLeft, FiCpu } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { askChatbot } from '../api/chatService';
import styles from './ChatView.module.css';

const WELCOME = 'أهلاً بك! أنا مساعدك الذكي في منصة "أصوات سوريا". كيف يمكنني مساعدتك اليوم؟';

const ChatView = () => {
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: WELCOME }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 200);
    }, []);

    const handleSend = () => {
        if (!input.trim() || isTyping) return;

        const userMsg = { role: 'user', content: input };
        const currentHistory = [...messages];

        setMessages([...currentHistory, userMsg, { role: 'assistant', content: '' }]);
        setInput('');
        setIsTyping(true);

        askChatbot(
            input,
            currentHistory,
            (chunk) => {
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                        ...updated[updated.length - 1],
                        content: updated[updated.length - 1].content + chunk,
                    };
                    return updated;
                });
            },
            () => setIsTyping(false),
            (err) => { console.error(err); setIsTyping(false); }
        );
    };

    return (
        <div className={styles.chatPage}>
            <div className={styles.backgroundOverlay} />

            {/* Header */}
            <header className={styles.chatHeader}>
                <div className={styles.headerLeft}>
                    <button onClick={() => navigate(-1)} className={styles.backBtn}>
                        <FiArrowLeft size={16} />
                        <span className={styles.backBtnText}>رجوع</span>
                    </button>

                    <div className={styles.botInfo}>
                        <div className={styles.botAvatarWrap}>
                            <div className={styles.botAvatar}>
                                <FiCpu size={18} />
                            </div>
                            <span className={styles.onlineDot} />
                        </div>
                        <div className={styles.botMeta}>
                            <span className={styles.botName}>مساعد أصوات سوريا</span>
                            <span className={`${styles.botStatus} ${isTyping ? styles.botStatusTyping : ''}`}>
                                {isTyping ? 'يكتب...' : '● متصل الآن'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Container */}
            <main className={styles.chatContainer}>
                <div className={styles.messagesArea} ref={scrollRef}>
                    <AnimatePresence initial={false}>
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
                            >
                                {msg.content}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isTyping && messages[messages.length - 1]?.content === '' && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={styles.typingIndicator}
                        >
                            <div className={styles.typingDots}>
                                <span /><span /><span />
                            </div>
                            جاري المعالجة
                        </motion.div>
                    )}
                </div>

                {/* Input */}
                <div className={styles.inputArea}>
                    <div className={styles.inputWrapper}>
                        <textarea
                            ref={inputRef}
                            className={styles.chatInput}
                            placeholder="اسألني أي شيء عن القصص..."
                            value={input}
                            rows={1}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            dir="auto"
                        />
                        <button
                            className={styles.sendBtn}
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                        >
                            <FiSend size={17} />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ChatView;
