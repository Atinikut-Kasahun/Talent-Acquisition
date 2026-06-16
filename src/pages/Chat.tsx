import { useState, useEffect, useRef, useCallback } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";

const API_URL = import.meta.env.VITE_API_BASE_URL;

interface ChatUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  phone: string | null;
  unread_count: number;
  last_message: {
    body: string;
    created_at: string;
  } | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string | null;
  read: boolean;
  created_at: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

function getAvatarUrl(path: string | null): string {
  if (!path) return null as unknown as string;
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${path.startsWith("/") ? path : "/" + path}`;
}

function AvatarFallback({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className={`${color} flex items-center justify-center rounded-full text-white font-semibold flex-shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

function Avatar({ name, avatar, size = 40 }: { name: string; avatar: string | null; size?: number }) {
  const url = getAvatarUrl(avatar);
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return <AvatarFallback name={name} size={size} />;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const storedUser = localStorage.getItem("user");
  const me = storedUser ? JSON.parse(storedUser) : null;
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [mutedUsers, setMutedUsers] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem("chat_muted_users") || "[]");
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const toggleMessageSelection = (msgId: string) => {
    setSelectedMessages(prev => 
      prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
    );
  };

  const [showConfirmModal, setShowConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const [toastMessage, setToastMessage] = useState<{
    isVisible: boolean;
    message: string;
  }>({ isVisible: false, message: "" });

  const showToast = (message: string) => {
    setToastMessage({ isVisible: true, message });
    setTimeout(() => {
      setToastMessage({ isVisible: false, message: "" });
    }, 3000);
  };

  const requestDeleteSelected = () => {
    if (selectedMessages.length === 0) return;
    setShowConfirmModal({
      isOpen: true,
      title: "Delete Messages",
      message: `Are you sure you want to delete ${selectedMessages.length} message(s)? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/chat/messages/delete`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({ message_ids: selectedMessages }),
          });
          if (res.ok) {
            setMessages(prev => prev.filter(m => !selectedMessages.includes(m.id)));
            const count = selectedMessages.length;
            setSelectedMessages([]);
            showToast(`${count} message(s) deleted successfully`);
          }
        } catch (_) {}
        setShowConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const requestClearChat = () => {
    if (!selectedUser) return;
    setShowConfirmModal({
      isOpen: true,
      title: "Clear Conversation",
      message: `Are you sure you want to delete all messages with ${selectedUser.name}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/chat/conversation/${selectedUser.id}`, {
            method: "DELETE",
            headers: authHeaders,
          });
          if (res.ok) {
            setMessages([]);
            showToast("Conversation cleared successfully");
          }
        } catch (_) {}
        setShowOptions(false);
        setShowConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const toggleMute = () => {
    if (!selectedUser) return;
    const isMuted = mutedUsers.includes(selectedUser.id);
    const newMuted = isMuted
      ? mutedUsers.filter((id) => id !== selectedUser.id)
      : [...mutedUsers, selectedUser.id];
    setMutedUsers(newMuted);
    localStorage.setItem("chat_muted_users", JSON.stringify(newMuted));
    setShowOptions(false);
    showToast(isMuted ? "Notifications unmuted" : "Notifications muted");
  };

  // Fetch user list
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/chat/users`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (_) {} finally {
      setUsersLoading(false);
    }
  }, []);

  // Fetch conversation with selected user
  const fetchConversation = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`${API_URL}/chat/conversation/${userId}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (selectedUser) {
      setLoading(true);
      fetchConversation(selectedUser.id).finally(() => setLoading(false));

      pollRef.current = setInterval(() => {
        fetchConversation(selectedUser.id);
        fetchUsers();
      }, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedUser, fetchConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectUser = (user: ChatUser) => {
    setSelectedUser(user);
    setMessages([]);
    setSelectedMessages([]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !selectedUser || sending) return;

    setSending(true);
    const body = newMessage.trim();
    setNewMessage("");
    
    try {
      const isFormData = !!selectedFile;
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      };
      
      let reqBody: any;
      if (isFormData) {
        reqBody = new FormData();
        reqBody.append("receiver_id", selectedUser.id);
        if (body) reqBody.append("body", body);
        reqBody.append("attachment", selectedFile);
      } else {
        headers["Content-Type"] = "application/json";
        reqBody = JSON.stringify({ receiver_id: selectedUser.id, body });
      }

      const res = await fetch(`${API_URL}/chat/send`, {
        method: "POST",
        headers,
        body: reqBody,
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (_) {}
    setSending(false);
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageMeta title="Chat | Talent Acquisition" description="Internal team chat" />
      <PageBreadcrumb pageTitle="Chat" />

      {/* Outer wrapper: two separate cards side by side */}
      <div
        className="flex gap-5 overflow-hidden"
        style={{ height: "calc(100vh - 210px)", minHeight: "500px" }}
      >
        {/* ════ LEFT CARD — fixed 320px ════ */}
        <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-gray-900">

          {/* Panel Header */}
              <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200 dark:border-white/[0.05] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Chats</h2>
            <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-300 rounded-full px-2 py-0.5 font-medium">
              {users.reduce((a, u) => a + u.unread_count, 0)} new
            </span>
          </div>

          {/* Search */}
          <div className="flex-shrink-0 px-4 py-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-gray-500"
              />
            </div>
          </div>

          {/* Scrollable user list with fade mask and hidden scrollbar */}
          <div className="flex-1 min-h-0 relative">
            {/* Top fade mask */}
            <div
              className="pointer-events-none absolute top-0 left-0 right-0 h-6 z-10"
              style={{ background: "linear-gradient(to bottom, #ffffff 0%, transparent 100%)" }}
            />
            {/* Bottom fade mask */}
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 z-10"
              style={{ background: "linear-gradient(to top, #ffffff 0%, transparent 100%)" }}
            />
            {/* Dark-mode top fade mask */}
            <div
              className="pointer-events-none absolute top-0 left-0 right-0 h-6 z-10 hidden dark:block"
              style={{ background: "linear-gradient(to bottom, #111827 0%, transparent 100%)" }}
            />
            {/* Dark-mode bottom fade mask */}
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 z-10 hidden dark:block"
              style={{ background: "linear-gradient(to top, #111827 0%, transparent 100%)" }}
            />
            
            <div 
              className="h-full overflow-y-scroll chat-users-scroll pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
            >
              <style>{`
                .chat-users-scroll::-webkit-scrollbar { display: none; }
              `}</style>
              
              {usersLoading ? (
                <div className="flex justify-center mt-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-sm text-gray-400 mt-8">No users found</p>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                onClick={() => handleSelectUser(user)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                  selectedUser?.id === user.id
                    ? "bg-yellow-50 dark:bg-yellow-400/10 border-l-4 border-yellow-400"
                    : "hover:bg-gray-50 dark:hover:bg-white/5 border-l-4 border-transparent"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Avatar name={user.name} avatar={user.avatar} size={42} />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white truncate">{user.name}</span>
                    {user.last_message && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{timeAgo(user.last_message.created_at)}</span>
                      )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 truncate capitalize">{user.role}</span>
                    {user.unread_count > 0 && (
                      <span className="flex-shrink-0 ml-2 w-5 h-5 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
                        {user.unread_count}
                      </span>
                    )}
                  </div>
                  {user.last_message && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{user.last_message.body}</p>
                  )}
                </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ════ RIGHT PANEL — flex-1, independent scroll ════ */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {selectedUser ? (
            <>
              {/* Conversation Header — pinned top */}
              <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200 dark:border-white/[0.05] flex items-center justify-between bg-white dark:bg-gray-900 min-h-[73px]">
                {selectedMessages.length > 0 ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedMessages([])} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition text-gray-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      <span className="font-medium text-gray-800 dark:text-white">{selectedMessages.length} selected</span>
                    </div>
                    <button onClick={requestDeleteSelected} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="text-sm font-medium">Delete</span>
                    </button>
                  </div>
                ) : (
                <>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={selectedUser.name} avatar={selectedUser.avatar} size={40} />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white dark:border-gray-900" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{selectedUser.name}</h3>
                    <p className="text-xs text-green-500 font-medium">Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 relative">
                  <div className="relative group flex items-center">
                    {/* Phone number appears inline to the left on hover */}
                    <span className="mr-2 text-sm font-medium text-gray-500 dark:text-gray-400 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap select-none">
                      {selectedUser.phone || "Not provided"}
                    </span>
                    <button 
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </button>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setShowOptions(!showOptions)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                      </svg>
                    </button>
                    {showOptions && (
                      <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-white/5 py-1 z-50">
                        {/* Header with close button */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-white/5">
                          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Options</span>
                          <button
                            onClick={() => setShowOptions(false)}
                            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <button 
                          onClick={toggleMute}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2.5"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          {mutedUsers.includes(selectedUser.id) ? "Unmute Notifications" : "Mute Notifications"}
                        </button>
                        <button 
                          onClick={requestClearChat}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Messages
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                </>
                )}
              </div>

              {/* Messages area — fade-mask scroll, no visible scrollbar */}
              <div className="flex-1 min-h-0 relative">
                {/* Top fade */}
                <div
                  className="pointer-events-none absolute top-0 left-0 right-0 h-10 z-10"
                  style={{ background: "linear-gradient(to bottom, #f9fafb 0%, transparent 100%)" }}
                />
                {/* Bottom fade */}
                <div
                  className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 z-10"
                  style={{ background: "linear-gradient(to top, #f9fafb 0%, transparent 100%)" }}
                />
                {/* Dark-mode top fade (rendered on top of light one when dark mode active) */}
                <div
                  className="pointer-events-none absolute top-0 left-0 right-0 h-10 z-10 hidden dark:block"
                  style={{ background: "linear-gradient(to bottom, #030712 0%, transparent 100%)" }}
                />
                {/* Dark-mode bottom fade */}
                <div
                  className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 z-10 hidden dark:block"
                  style={{ background: "linear-gradient(to top, #030712 0%, transparent 100%)" }}
                />
                <div
                  className="h-full overflow-y-scroll px-5 py-4 space-y-4 bg-gray-50 dark:bg-gray-950 chat-messages-scroll"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
                >
                  {/* Hide webkit scrollbar */}
                  <style>{`
                    .chat-messages-scroll::-webkit-scrollbar { display: none; }
                  `}</style>
                {loading && messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8" style={{ borderBottomWidth: 2, borderBottomColor: '#FFF200' }} />
                  </div>
                )}
                {!loading && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <svg className="w-12 h-12 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm">Start a conversation with {selectedUser.name}</p>
                  </div>
                )}
                {messages
                  .map((msg, idx) => {
                  const isMe = msg.sender_id === me?.id;
                  const showDate =
                    idx === 0 ||
                    new Date(messages[idx - 1].created_at).toDateString() !==
                      new Date(msg.created_at).toDateString();
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                          <span className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-950 px-2">
                            {new Date(msg.created_at).toLocaleDateString()}
                          </span>
                          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                        </div>
                      )}
                      <div 
                        className={`flex items-end gap-2 cursor-pointer transition-all ${isMe ? "flex-row-reverse" : "flex-row"} ${selectedMessages.includes(msg.id) ? "opacity-75 scale-[0.98]" : "hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl p-1"}`}
                        onClick={() => toggleMessageSelection(msg.id)}
                      >
                        {!isMe && <Avatar name={msg.sender.name} avatar={msg.sender.avatar} size={32} />}
                        <div className={`flex flex-col gap-0.5 max-w-[65%] ${isMe ? "items-end" : "items-start"} relative`}>
                          {selectedMessages.includes(msg.id) && (
                            <div className="absolute inset-0 bg-blue-500/10 rounded-2xl border-2 border-blue-500 pointer-events-none z-10"></div>
                          )}
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isMe
                                ? "rounded-br-sm font-medium"
                                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-sm shadow-sm border border-gray-100 dark:border-white/5"
                            }`}
                            style={
                              isMe
                                ? { backgroundColor: "#FFF200", color: "#000" }
                                : undefined
                            }
                          >
                            {msg.attachment_url && msg.attachment_type === 'image' && (
                              <img src={getAvatarUrl(msg.attachment_url)} alt="Attachment" className="max-w-[200px] rounded-lg mb-2 object-cover" />
                            )}
                            {msg.attachment_url && msg.attachment_type !== 'image' && (
                              <a 
                                href={getAvatarUrl(msg.attachment_url)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-black/5 dark:bg-white/10 rounded-lg mb-2 text-current hover:underline"
                              >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <span className="truncate max-w-[150px]">{msg.attachment_name || 'Document'}</span>
                              </a>
                            )}
                            {msg.body && <span>{msg.body}</span>}
                          </div>
                          <span className="text-xs text-gray-400 px-1">{formatTime(msg.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input bar — pinned bottom */}
              <form onSubmit={handleSend} className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-white/[0.05] bg-white dark:bg-gray-900">
                {selectedFile && (
                  <div className="mb-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg inline-flex items-center gap-2 max-w-[200px]">
                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">{selectedFile.name}</span>
                    <button 
                      type="button" 
                      onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }} 
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition flex-shrink-0"
                    title="Attach file"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 text-sm rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FFF200]/50 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedFile) || sending}
                    className="p-2.5 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition flex-shrink-0"
                    style={{ backgroundColor: "#FFF200", color: "#000" }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
              <div className="text-center max-w-xs">
                <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-9 h-9 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Select a Chat</h3>
                <p className="text-sm text-gray-400">Pick a user from the left panel to start a conversation.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════ PREMIUM CONFIRM MODAL ════ */}
      {showConfirmModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-sm w-full p-7 border border-gray-100 dark:border-gray-800 transform transition-all scale-100 opacity-100">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0 text-red-500">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {showConfirmModal.title}
                </h3>
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-[15px] mb-8 leading-relaxed">
              {showConfirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={showConfirmModal.onConfirm}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-[0_4px_14px_0_rgb(239,68,68,0.39)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.23)] transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ PREMIUM TOAST NOTIFICATION ════ */}
      <div 
        className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-4 px-5 py-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-100 dark:border-gray-700 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-500 ease-out transform ${
          toastMessage.isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="w-9 h-9 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-[15px] font-medium pr-3">{toastMessage.message}</p>
      </div>
    </>
  );
}
