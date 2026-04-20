// frontend/src/components/ChatBot.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMessageSquare, FiX, FiSend, FiTrash2,
  FiUser, FiCpu, FiAlertCircle, FiLoader
} from 'react-icons/fi';
import { askChatbot } from '../api/chatService';
import styles from './ChatBot.module.css';

const WELCOME = 'مرحباً! أنا مساعدك الذكي لاستكشاف قصص أصوات سوريا. اسألني عن أي قصة أو حدث.';

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME }
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const inputRef = useRef(null);
  const sendingRef = useRef(false);

  // scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const handleSend = useCallback(() => {
    const q = input.trim();
    if (!q || streaming || sendingRef.current) return;
    sendingRef.current = true;

    setError('');
    setInput('');

    const history = messages.filter(m => m.role !== 'system');
    const userMsg = { role: 'user', content: q };
    const assistantMsg = { role: 'assistant', content: '' };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    abortRef.current = askChatbot(
      q,
      history,
      // onChunk
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
      // onDone
      () => {
        setStreaming(false);
        sendingRef.current = false;
      },
      // onError
      (msg) => {
        setStreaming(false);
        sendingRef.current = false;
        setError(msg);
        setMessages(prev => prev.slice(0, -1)); // remove empty assistant msg
      }
    );
  }, [input, streaming, messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    abortRef.current?.();
    setStreaming(false);
    setMessages([{ role: 'assistant', content: WELCOME }]);
    setError('');
  };

  const handleClose = () => {
    abortRef.current?.();
    setStreaming(false);
    setOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className={styles.fab}
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={open ? { opacity: 0, pointerEvents: 'none' } : { opacity: 1, pointerEvents: 'auto' }}
        aria-label="Open chatbot"
      >
        <FiMessageSquare size={24} />
        <span className={styles.fabLabel}>AI Chat</span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.window}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <div className={styles.headerAvatarWrap}>
                  <div className={styles.headerIcon}><FiCpu size={17} /></div>
                  <span className={styles.headerOnlineDot} />
                </div>
                <div className={styles.headerMeta}>
                  <p className={styles.headerTitle}>مساعد أصوات سوريا</p>
                  <p className={styles.headerSub}>
                    {streaming ? (
                      <span className={styles.typingDot}>يكتب...</span>
                    ) : '● متصل الآن'}
                  </p>
                </div>
              </div>
              <div className={styles.headerActions}>
                <button onClick={handleClear} className={styles.iconBtn} title="مسح المحادثة">
                  <FiTrash2 size={15} />
                </button>
                <button onClick={handleClose} className={styles.iconBtn} title="إغلاق">
                  <FiX size={17} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className={styles.messages}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.aiBubble}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={styles.avatar}>
                    {msg.role === 'user' ? <FiUser size={14} /> : <FiCpu size={14} />}
                  </div>
                  <div className={styles.bubbleContent}>
                    {msg.content || (streaming && i === messages.length - 1 ? (
                      <span className={styles.cursor}>▋</span>
                    ) : '')}
                  </div>
                </motion.div>
              ))}

              {error && (
                <div className={styles.errorMsg}>
                  <FiAlertCircle size={14} /> {error}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className={styles.inputArea}>
              <textarea
                ref={inputRef}
                className={styles.input}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب سؤالك هنا..."
                rows={1}
                disabled={streaming}
                dir="auto"
              />
              <motion.button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={!input.trim() || streaming}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {streaming ? <FiLoader size={18} className={styles.spin} /> : <FiSend size={18} />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
