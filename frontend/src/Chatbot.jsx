import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm your virtual assistant. How can I help you today?", 
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isWaitingForAgent, setIsWaitingForAgent] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Generate a unique user ID if not already present
  const getUserId = () => {
    let userId = localStorage.getItem('chatbot_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('chatbot_user_id', userId);
    }
    return userId;
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Simple responses for common questions without needing the backend
  const getSimpleResponse = (text) => {
    const textLower = text.toLowerCase();
    
    // Simple greeting
    if (['hi', 'hello', 'hey', 'greetings'].includes(textLower)) {
      return "Hello! I'm your virtual assistant. How can I help you today?";
    }
    
    // Business hours (from knowledge base)
    if (textLower.includes('hours') || textLower.includes('open') || textLower.includes('time')) {
      return "We are open 9 AM to 5 PM, Monday to Friday.";
    }
    
    // Contact information (from knowledge base)
    if (textLower.includes('contact') || textLower.includes('email') || textLower.includes('phone') || textLower.includes('call')) {
      return "You can contact support via email at support@example.com or by calling us at 1-800-EXAMPLE.";
    }
    
    // Password reset (from knowledge base)
    if (textLower.includes('password') || textLower.includes('reset') || textLower.includes('forgot')) {
      return "You can reset your password by clicking the 'Forgot Password' link on the login page.";
    }
    
    // Website information
    if (textLower.includes('website') || textLower.includes('site') || textLower.includes('provide') || 
        textLower.includes('offer') || textLower.includes('service') || textLower.includes('what do you') ||
        textLower.includes('what can you') || textLower.includes('what is this')) {
      return "Our website provides customer support services, product information, and account management tools. You can browse our products, manage your account, track orders, and get help with any issues you might have.";
    }
    
    // Product information
    if (textLower.includes('product') || textLower.includes('item') || textLower.includes('merchandise')) {
      return "We offer a range of products including the SuperWidget ($99.99) with features A and B, and the MegaGadget ($199.99) which is ultra fast with long battery life and AI-powered capabilities. Would you like more specific information about any of these products?";
    }
    
    // Account help
    if (textLower.includes('account') || textLower.includes('login') || textLower.includes('sign in') || 
        textLower.includes('register') || textLower.includes('sign up')) {
      return "You can create an account by clicking the 'Register' button on the top right of our homepage. If you already have an account, click 'Login' to access your dashboard where you can manage your profile, orders, and preferences.";
    }
    
    // Pricing information
    if (textLower.includes('price') || textLower.includes('cost') || textLower.includes('fee') || 
        textLower.includes('subscription') || textLower.includes('plan')) {
      return "We offer various pricing plans to suit your needs. Our basic plan starts at $9.99/month, while our premium plan with additional features is $19.99/month. We also offer a 14-day free trial for all new users.";
    }
    
    // Shipping information
    if (textLower.includes('ship') || textLower.includes('delivery') || textLower.includes('arrive') || 
        textLower.includes('track') || textLower.includes('order status')) {
      return "Standard shipping takes 3-5 business days. Express shipping (2-day delivery) is available for an additional fee. Once your order ships, you'll receive a tracking number via email to monitor your delivery.";
    }
    
    // Return policy
    if (textLower.includes('return') || textLower.includes('refund') || textLower.includes('exchange') || 
        textLower.includes('cancel order')) {
      return "Products can be returned within 30 days of purchase for a full refund, provided they are in original condition. Opened software is non-refundable. To initiate a return, please log into your account and select the order you wish to return.";
    }
    
    // Technical support
    if (textLower.includes('technical') || textLower.includes('tech support') || textLower.includes('not working') || 
        textLower.includes('broken') || textLower.includes('issue') || textLower.includes('problem')) {
      return "For technical support, please provide details about the issue you're experiencing. Our support team is available to help troubleshoot problems with your products or services. For immediate assistance, you can also call our technical support line at 1-800-TECH-HELP.";
    }
    
    // About the company
    if (textLower.includes('about') || textLower.includes('company') || textLower.includes('history') || 
        textLower.includes('who are you')) {
      return "Our company was founded in 2010 with a mission to provide exceptional products and customer service. We've grown to serve over 1 million customers worldwide, with offices in 5 countries. We're committed to innovation, quality, and sustainability in everything we do.";
    }
    
    // Return null if no simple response is available
    return null;
  };

  const handleSendMessage = async () => {
    if (inputText.trim() === '' || isTyping || isWaitingForAgent) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Check for simple responses first
    const simpleResponse = getSimpleResponse(userMessage.text);
    if (simpleResponse) {
      console.log('Simple response detected, responding directly');
      setTimeout(() => {
        const botMessage = {
          id: Date.now(),
          text: simpleResponse,
          sender: 'bot',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 500);
      return;
    }

    try {
      const userId = getUserId();
      console.log('Sending message to backend:', userMessage.text);
      
      const API_URL = import.meta.env.VITE_API_URL || 
                 (window.location.origin !== 'null' ? window.location.origin : 'http://localhost:8000');
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          message: userMessage.text
        }),
      });

      if (!response.ok) {
        console.error('Backend response not OK:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received response from backend:', data);
      
      // Add a slight delay to make the bot response feel more natural
      setTimeout(() => {
        const botMessage = {
          id: Date.now(),
          text: data.response,
          sender: 'bot',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        
        // Handle handoff to human agent if needed
        if (data.handoff) {
          setIsWaitingForAgent(true);
          // In a real application, this would trigger a notification to a human agent
        }
      }, 1000);
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      
      // For connection errors, provide a helpful message and offer to connect to a human
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: "I'm sorry, I'm having trouble accessing my knowledge base right now. I can answer simple questions, but for more complex inquiries, let me connect you with a human agent who can help you better.",
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      }]);
      
      // Automatically trigger handoff for errors
      setIsWaitingForAgent(true);
      setIsTyping(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleAgentConnect = () => {
    // This would be replaced with actual agent connection logic
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: "You've been connected with a support agent. They will be with you shortly.",
      sender: 'system',
      timestamp: new Date()
    }]);
    setIsWaitingForAgent(false);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
  };

  return (
    <div className="chatbot-container">
      {!isOpen ? (
        <button className="chat-button" onClick={toggleChat}>
          <span className="chat-icon">💬</span>
          <span className="chat-text">Chat with us</span>
        </button>
      ) : (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-title">
              <div className="chat-avatar">🤖</div>
              <div>
                <h3>Customer Support</h3>
                {isWaitingForAgent ? (
                  <span className="status waiting">Connecting to agent...</span>
                ) : (
                  <span className="status online">Online</span>
                )}
              </div>
            </div>
            <button className="close-button" onClick={handleCloseChat}>×</button>
          </div>
          
          <div className="chat-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.sender} ${message.isError ? 'error' : ''}`}
              >
                {message.sender === 'bot' && <div className="bot-avatar">🤖</div>}
                {message.sender === 'system' && <div className="system-avatar">ℹ️</div>}
                <div className="message-content">
                  <div className="message-text">{message.text}</div>
                  <div className="message-time">{formatTimestamp(message.timestamp)}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot typing">
                <div className="bot-avatar">🤖</div>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-input-container">
            {isWaitingForAgent ? (
              <div className="waiting-for-agent">
                <p>Waiting to connect you with an agent...</p>
                <button onClick={handleAgentConnect} className="connect-button">
                  Connect Now (Demo)
                </button>
              </div>
            ) : (
              <>
                <textarea
                  ref={inputRef}
                  className="chat-input"
                  placeholder="Type your message here..."
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  disabled={isTyping}
                />
                <button 
                  className="send-button" 
                  onClick={handleSendMessage}
                  disabled={inputText.trim() === '' || isTyping}
                >
                  <span className="send-icon">➤</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;