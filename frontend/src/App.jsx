import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import './index.css'

// Get API URL from environment variable, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [activeTab, setActiveTab] = useState('chat'); 
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hi there! I can help you find info in your knowledge base. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchKnowledgeBases = useCallback(async () => {
    setKbLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/knowledgebase`);
      if (!response.ok) throw new Error('Failed to fetch KBs');
      const data = await response.json();
      setKnowledgeBases(data.knowledgeBases || data || []);
    } catch (error) {
      console.error('Error fetching KBs:', error);
      setUploadStatus('Error loading knowledge bases');
    } finally {
      setKbLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'kb') {
      fetchKnowledgeBases();
    }
  }, [activeTab, fetchKnowledgeBases]);

  const handleKBUpload = async (e) => {
    e.preventDefault();
    if (!uploadName.trim() || selectedFiles.length === 0) {
      setUploadStatus('Please provide a name and select at least one file');
      return;
    }

    setKbLoading(true);
    setUploadStatus('Uploading...');

    try {
      const formData = new FormData();
      formData.append('name', uploadName);
      if (uploadDescription) {
        formData.append('description', uploadDescription);
      }

    
      Array.from(selectedFiles).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_BASE_URL}/api/knowledgebase`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setUploadStatus(`Success! KB created: ${uploadName}`);

      setUploadName('');
      setUploadDescription('');
      setSelectedFiles([]);
      document.getElementById('fileInput').value = '';

      setTimeout(() => fetchKnowledgeBases(), 1000);
    } catch (error) {
      console.error('Error uploading KB:', error);
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setKbLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);

    const currentQuery = input;
    setInput('');
    setIsLoading(true);

    try {
     
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQuery }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

    
      let botResponseText = "I couldn't find anything on that topic.";

      if (data.answer) {
        botResponseText = data.answer;
      }


      setMessages(prev => [...prev, { role: 'bot', content: botResponseText }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'bot', content: 'Connection error. Please check if the backend is running.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="chat-header">
        <h1>AI Knowledge Base</h1>
        <div className="tabs">
          <button
            className={activeTab === 'chat' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button
            className={activeTab === 'kb' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('kb')}
          >
            Manage KBs
          </button>
        </div>
      </header>

      {activeTab === 'chat' ? (
        <>
          <div className="chat-window">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-content">
                  {msg.role === 'bot' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message bot">
                <div className="message-content typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question here..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              Send
            </button>
          </form>
        </>
      ) : (
        <div className="kb-manager">
          <div className="kb-upload-section">
            <h2>Create New Knowledge Base</h2>
            <form onSubmit={handleKBUpload} className="kb-upload-form">
              <input
                type="text"
                placeholder="Knowledge Base Name *"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              />
              <div className="file-input-wrapper">
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={(e) => setSelectedFiles(e.target.files)}
                />
                <label htmlFor="fileInput">
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} file(s) selected`
                    : 'Choose Files'}
                </label>
              </div>
              <button type="submit" disabled={kbLoading}>
                {kbLoading ? 'Uploading...' : 'Create KB'}
              </button>
            </form>
            {uploadStatus && (
              <div className={`upload-status ${uploadStatus.includes('Error') ? 'error' : 'success'}`}>
                {uploadStatus}
              </div>
            )}
          </div>

          <div className="kb-list-section">
            <h2>Your Knowledge Bases</h2>
            {kbLoading && !knowledgeBases.length ? (
              <div className="loading">Loading...</div>
            ) : knowledgeBases.length === 0 ? (
              <div className="empty-state">No knowledge bases yet. Create one above!</div>
            ) : (
              <div className="kb-list">
                {knowledgeBases.map((kb, index) => (
                  <div key={kb.id || index} className="kb-item">
                    <div className="kb-info">
                      <h3>{kb.name}</h3>
                      {kb.description && <p>{kb.description}</p>}
                      <small>Created: {new Date(kb.createdAt).toLocaleDateString()}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
