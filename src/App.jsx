import 'katex/dist/katex.min.css';
import { useState, useEffect, useRef } from 'react';
import './App.css';
import logo from '../public/boralogo.png'; 


const systemMessage = {
  role: "system",
  content: `` // Context for AI 

};

const API_KEY = import.meta.env.VITE_API_KEY;



function App() {
  const [messages, setMessages] = useState([
    {
      message: `Hello, I am BoraAI. How can I assist you?`,
      sender: "ChatGPT"
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [modelIdentifier] = useState("gpt-3.5-turbo-0125");
  const [inputContainerHeight, setInputContainerHeight] = useState(0);
  const [selectedImages] = useState([]);
  const lastMessageRef = useRef(null); // Reference to the last message

  useEffect(() => {
    const updateInputContainerHeight = () => {
      const inputContainerElement = document.querySelector('.input-container');
      if (inputContainerElement) {
        setInputContainerHeight(inputContainerElement.offsetHeight);
      }
    };

    updateInputContainerHeight();
    window.addEventListener('resize', updateInputContainerHeight);
    return () => window.removeEventListener('resize', updateInputContainerHeight);
  }, []);

  useEffect(() => {
    if (lastMessageRef.current) {
      const observer = new IntersectionObserver(entries => {
        const lastEntry = entries[0];
        if (!lastEntry.isIntersecting) {
          lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, {
        threshold: 1.0 // Adjust this value based on how much of the item needs to be visible
      });

      observer.observe(lastMessageRef.current);
      return () => observer.disconnect(); // Clean up the observer when the component unmounts or updates
    }
  }, [messages]);

  
  const displayErrorMessage = (errorMessage) => {
    // Append the error message to the chat as a system message
    setMessages(prevMessages => [...prevMessages, { message: errorMessage, sender: 'ChatGPT' }]);
  };


  
  const sendMessageToAPI = async (userMessage) => {
    setIsTyping(true);
    let apiErrorOccurred = false;
    let friendlyErrorMessage = "Oops! There was an unexpected hiccup.";
    
    const apiRequestBody = {
      model: modelIdentifier, // Use the current model identifier state
      messages: [
        systemMessage,
        ...messages.map(msg => ({
          role: msg.sender === "ChatGPT" ? "assistant" : "user",
          content: msg.message
        })),
        { role: 'user', content: userMessage }
      ]
    };
  
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(apiRequestBody)
      });
  
      const data = await response.json();
      if (response.ok) {
        setMessages(prevMessages => [...prevMessages, {
          message: data.choices[0].message.content,
          sender: "ChatGPT"
        }]);
      } else {
        apiErrorOccurred = true;
        if (data.error) {
          friendlyErrorMessage = `Error: ${data.error.message}`;
        } else {
          friendlyErrorMessage = "BoraAI might be on maintenance right now. Please check back in a bit.";
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      apiErrorOccurred = true;
      if (error.message.includes('quota')) {
        friendlyErrorMessage = "Looks like BoraAI's got too excited and needs a moment. Let's give it some space and try again after a short break.";
      } else {
        friendlyErrorMessage = "BoraAI might be on maintenance right now. Please check back in a bit.";
      }
    } finally {
      setIsTyping(false);
      if (apiErrorOccurred) {
        displayErrorMessage(friendlyErrorMessage);
      }
    }
  };
  
  
  
  

  // Modify handleSendMessage to use the new checkForKeywordAndSendMessage function
  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedImages.length === 0) return;
  
    const outgoingMessage = {
      message: newMessage,
      sender: 'user'
    };
  
    const isDuplicateMessage = messages.some(msg => 
      msg.sender === 'user' && msg.message.trim() === outgoingMessage.message.trim()
    );
  
    if (isDuplicateMessage) {
      return;
    }
  
    setIsTyping(true);
  
    if (newMessage.trim()) {
      setMessages(prevMessages => [...prevMessages, outgoingMessage]);
    }
  
    setNewMessage('');
  
    // Call sendMessageToAPI here
    await sendMessageToAPI(outgoingMessage.message);
  
    setIsTyping(false);
  };
  
  

  
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent the default behavior of Enter key in a textarea
      handleSendMessage();
    } else if (event.key === 'Enter' && event.shiftKey) {
      // Allow the Shift + Enter behavior to create a new line
      const value = newMessage;
      const cursorPos = event.target.selectionStart;
      setNewMessage(
        value.slice(0, cursorPos) + "\n" + value.slice(cursorPos)
      );
    }
  };

  const handlePaste = (event) => {
    // Prevent the default paste action
    event.preventDefault();
    // Use the Clipboard API to access the data directly
  
    // Find items of the type 'image'
  };
  

  const formatMessage = (message) => {
    // Convert Markdown headings to bold tags
    let formattedMessage = message.replace(/###\s?(.*)/g, '<strong>$1</strong>');
    // Convert bold Markdown to strong tags
    formattedMessage = formattedMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert Markdown links to anchor tags
    formattedMessage = formattedMessage.replace(/\[([^\]]+)\]\((http[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Convert plain text URLs to anchor tags, but skip ones already in anchor tags
    formattedMessage = formattedMessage.replace(/(\bhttps?:\/\/[^\s<]+)(?![^<]*<\/a>)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  
    return { __html: formattedMessage };
  };
  
  

  const handleTextareaChange = (e) => {
    const target = e.target;
    setNewMessage(target.value);
  
    // Reset the height to auto to get the correct scrollHeight
    target.style.height = 'auto';
    // Set the height to scrollHeight to accommodate all the content
    target.style.height = `${target.scrollHeight}px`;
  };

  return (
    <div id="root">
      <header className="app-header">
      <a href="/"><img src={logo} height= '50' width='50' alt="BoraAI Logo" className="app-logo" /></a>
        <h1>BoraAI</h1>
      </header>
      <div className="app-body" style={{ marginBottom: `${inputContainerHeight}px`}}>
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`message ${msg.sender === "ChatGPT" ? 'incoming' : 'outgoing'}`}
        >
          {msg.image ? (
            <img src={msg.message} alt="User upload" style={{ maxWidth: '100%', maxHeight: '400px' }} />
          ) : (
            <div
              className={`message-content ${msg.sender}`}
              dangerouslySetInnerHTML={formatMessage(msg.message.replace(/mooseAnkle/g, '**KEYWORD USED**'))}
            />
          )}
        </div>
      ))}
        <div ref={lastMessageRef} />
        {isTyping && (
          <div className="typing-indicator">
            <span></span><span></span><span></span> BoraAI is typing...
          </div>
        )}
      </div>
      <div className="input-container">
      <textarea
        type="text"
        placeholder="Type a message..."
        value={newMessage} // This should be the state variable
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        autoFocus
        style={{ height: 'auto', overflowY: 'auto' }}
      />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  </div>

  );
}

export default App;
