import React, { useState, useRef, useEffect } from 'react';
import './AgentAssistChatbot.css';

const AgentAssistChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [conversationContext, setConversationContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assistResponse, setAssistResponse] = useState(null);
  const [activeTab, setActiveTab] = useState('assist'); // 'assist', 'summary', 'draft'
  const [customerQuery, setCustomerQuery] = useState('');
  const [relevantInfo, setRelevantInfo] = useState('');
  const [responseTone, setResponseTone] = useState('professional');
  const [draftResponse, setDraftResponse] = useState(null);
  const [ticketSummary, setTicketSummary] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Get API URL from environment variables or use default
  const API_URL = import.meta.env.VITE_API_URL || 
                 (window.location.origin !== 'null' ? window.location.origin : 'http://localhost:8000');
  
  // Get agent ID from localStorage
  const agentId = localStorage.getItem('accessToken')?.startsWith('demo_token_for_agent') 
    ? 'agent_demo' 
    : localStorage.getItem('accessToken')?.startsWith('demo_token_for_admin')
      ? 'admin_demo'
      : 'agent_' + Math.random().toString(36).substring(2, 9);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [assistResponse, draftResponse, ticketSummary]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/agent-assist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          agent_id: agentId,
          conversation_context: conversationContext,
          query: query
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setAssistResponse(data.response);
    } catch (error) {
      console.error('Error getting agent assistance:', error);
      setAssistResponse('Sorry, I encountered an error while processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTicketSummary = async (e) => {
    e.preventDefault();
    
    if (!conversationContext.trim()) {
      alert('Please provide conversation history to summarize');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/ticket-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          agent_id: agentId,
          conversation_history: conversationContext
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setTicketSummary(data.summary);
    } catch (error) {
      console.error('Error getting ticket summary:', error);
      setTicketSummary('Sorry, I encountered an error while summarizing the ticket. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseDraft = async (e) => {
    e.preventDefault();
    
    if (!customerQuery.trim()) {
      alert('Please provide a customer query to draft a response for');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/response-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          agent_id: agentId,
          customer_query: customerQuery,
          relevant_info: relevantInfo,
          tone: responseTone
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setDraftResponse(data.draft);
    } catch (error) {
      console.error('Error getting response draft:', error);
      setDraftResponse('Sorry, I encountered an error while drafting a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <div className="agent-assist-chatbot">
      <button 
        className={`agent-assist-toggle ${isOpen ? 'open' : ''}`} 
        onClick={toggleChatbot}
      >
        {isOpen ? 'Close Agent Assist' : 'Agent Assist'}
      </button>
      
      {isOpen && (
        <div className="agent-assist-container">
          <div className="agent-assist-header">
            <h3>Agent Assist</h3>
            <div className="agent-assist-tabs">
              <button 
                className={`tab-btn ${activeTab === 'assist' ? 'active' : ''}`}
                onClick={() => setActiveTab('assist')}
              >
                Assist
              </button>
              <button 
                className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                Ticket Summary
              </button>
              <button 
                className={`tab-btn ${activeTab === 'draft' ? 'active' : ''}`}
                onClick={() => setActiveTab('draft')}
              >
                Response Draft
              </button>
            </div>
          </div>
          
          <div className="agent-assist-content">
            {activeTab === 'assist' && (
              <div className="assist-tab">
                <form onSubmit={handleQuerySubmit}>
                  <div className="form-group">
                    <label htmlFor="conversation-context">Conversation Context:</label>
                    <textarea 
                      id="conversation-context"
                      value={conversationContext}
                      onChange={(e) => setConversationContext(e.target.value)}
                      placeholder="Paste customer conversation here..."
                      rows={5}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="agent-query">Your Question:</label>
                    <input 
                      type="text"
                      id="agent-query"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask for assistance..."
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Getting assistance...' : 'Get Assistance'}
                  </button>
                </form>
                
                {assistResponse && (
                  <div className="response-container">
                    <div className="response-header">
                      <h4>AI Assistant Response</h4>
                      <button 
                        className="copy-btn"
                        onClick={() => copyToClipboard(assistResponse)}
                      >
                        Copy
                      </button>
                    </div>
                    <div className="response-content">
                      <pre>{assistResponse}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'summary' && (
              <div className="summary-tab">
                <form onSubmit={handleTicketSummary}>
                  <div className="form-group">
                    <label htmlFor="ticket-conversation">Conversation History:</label>
                    <textarea 
                      id="ticket-conversation"
                      value={conversationContext}
                      onChange={(e) => setConversationContext(e.target.value)}
                      placeholder="Paste the entire conversation history here..."
                      rows={8}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Summarizing...' : 'Generate Ticket Summary'}
                  </button>
                </form>
                
                {ticketSummary && (
                  <div className="response-container">
                    <div className="response-header">
                      <h4>Ticket Summary</h4>
                      <button 
                        className="copy-btn"
                        onClick={() => copyToClipboard(ticketSummary)}
                      >
                        Copy
                      </button>
                    </div>
                    <div className="response-content">
                      <pre>{ticketSummary}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'draft' && (
              <div className="draft-tab">
                <form onSubmit={handleResponseDraft}>
                  <div className="form-group">
                    <label htmlFor="customer-query">Customer Query:</label>
                    <textarea 
                      id="customer-query"
                      value={customerQuery}
                      onChange={(e) => setCustomerQuery(e.target.value)}
                      placeholder="Enter the customer's question or issue..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="relevant-info">Relevant Information (Optional):</label>
                    <textarea 
                      id="relevant-info"
                      value={relevantInfo}
                      onChange={(e) => setRelevantInfo(e.target.value)}
                      placeholder="Add any relevant information that should be included in the response..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="response-tone">Response Tone:</label>
                    <select
                      id="response-tone"
                      value={responseTone}
                      onChange={(e) => setResponseTone(e.target.value)}
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="technical">Technical</option>
                      <option value="simple">Simple</option>
                    </select>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Drafting response...' : 'Draft Response'}
                  </button>
                </form>
                
                {draftResponse && (
                  <div className="response-container">
                    <div className="response-header">
                      <h4>Response Draft</h4>
                      <button 
                        className="copy-btn"
                        onClick={() => copyToClipboard(draftResponse)}
                      >
                        Copy
                      </button>
                    </div>
                    <div className="response-content">
                      <pre>{draftResponse}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentAssistChatbot;