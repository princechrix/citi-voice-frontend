import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import Logo from "@/assets/images/Logo.png";
import Image from "next/image";
import { useApi } from "@/hooks/useApi";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Complaint {
  id: string;
  subject: string;
  description: string;
  status: string;
}

interface Agency {
  id: string;
  name: string;
  status: string;
}

export function CitiAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const responseAreaRef = useRef<HTMLDivElement>(null);
  const { fetcher } = useApi();

  // Get user data from storage
  const getUserData = () => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userData) {
        try {
          return JSON.parse(userData);
        } catch (error) {
          console.error('Error parsing user data:', error);
          return null;
        }
      }
    }
    return null;
  };

  // Fetch complaints based on user role
  const fetchComplaints = async (userData: any) => {
    try {
      let response;
      if (userData.role === 'STAFF') {
        response = await fetcher(`/complaints/staff/${userData.id}`);
      } else if (userData.role === 'AGENCY_ADMIN') {
        response = await fetcher(`/complaints/agency/${userData.agencyId}`);
      } else if (userData.role === 'SUPER_ADMIN') {
        response = await fetcher('/complaints');
      }
      return response?.data || [];
    } catch (error) {
      console.error('Error fetching complaints:', error);
      return [];
    }
  };

  // Fetch agencies for super admin
  const fetchAgencies = async () => {
    try {
      const response = await fetcher('/agency');
      return response?.data || [];
    } catch (error) {
      console.error('Error fetching agencies:', error);
      return [];
    }
  };

  const scrollToBottom = () => {
    if (responseAreaRef.current) {
      const viewport = responseAreaRef.current.closest('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  const formatMessage = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }]);
    setIsLoading(true);
    setCurrentResponse('');

    try {
      const userData = getUserData();
      const complaints = userData ? await fetchComplaints(userData) : [];
      const agencies = userData?.role === 'SUPER_ADMIN' ? await fetchAgencies() : [];
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
          userData,
          complaints,
          agencies
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let responseText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        responseText += chunk;
        setCurrentResponse(responseText);
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: responseText, 
        timestamp: Date.now() 
      }]);
      setCurrentResponse('');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to get response from AI assistant');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && input.trim()) {
      handleSubmit(e);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="default" className="gap-2">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            <path d="M5 3v4"/>
            <path d="M19 17v4"/>
            <path d="M3 5h4"/>
            <path d="M17 19h4"/>
          </svg>
          CitiAI Assistant
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[900px] sm:max-w-[900px] p-0 flex flex-col h-full">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle className="text-[24px] font-[700] leading-[30px] tracking-[-0.1px] flex items-center gap-2">
            <Image src={Logo} alt="CitiAI" className="w-6 h-6" />
            CitiAI Assistant
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col p-6 pb-0 min-h-0">
              <ScrollArea className="flex-1 rounded-[8px] bg-background h-full">
                <div
                  ref={responseAreaRef}
                  className="response-area p-4"
                >
                  {messages.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                          />
                        </svg>
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-primary mb-2">
                          Welcome to CitiAI Assistant
                        </h3>
                        <p className="text-gray-600">Let&apos;s chat with CitiVoice AI Assistant</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`message ${
                            message.role === 'user' ? 'user-message' : 'assistant-message'
                          }`}
                        >
                          <div
                            className={`flex items-start gap-2 ${
                              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                                message.role === 'user' ? 'bg-primary' : ''
                              }`}
                            >
                              {message.role === 'user' ? 'U' : (
                                <Image src={Logo} alt="CitiAI" className="w-6 h-6" />
                              )}
                            </div>
                            <div
                              className={`flex-1 ${
                                message.role === 'user' ? 'text-right' : 'text-left'
                              }`}
                            >
                              <div className="text-sm text-muted-foreground mb-1">
                                <span>{message.role === 'user' ? 'You' : 'CitiAI Assistant'}</span>
                                <span className="ml-2">{formatTime(message.timestamp)}</span>
                              </div>
                              <div
                                className="whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-white">
                            <Image src={Logo} alt="CitiAI" className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-muted-foreground mb-1">
                              CitiAI Assistant
                              <span className="ml-2">{formatTime(Date.now())}</span>
                            </div>
                            <div
                              className="whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{ __html: formatMessage(currentResponse) }}
                            />
                            <div className="flex justify-center items-center mt-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            <div className="sticky bottom-0 p-6 pt-4 bg-background border-t shrink-0">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="bg-background flex-1"
                  placeholder="Type your question here..."
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !input.trim()}
                  className="bg-primary hover:bg-primary/90 text-white px-4"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 