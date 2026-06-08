import { useState, useEffect, useRef, useCallback } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "import.meta.env.VITE_API_BASE_URL";

interface ChatUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
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
  body: string;
  read: boolean;
  created_at: string;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

function getAvatarUrl(path: string | null): string {
  if (!path) return null as unknown as string;
  if (path.startsWith("http")) return path;
  return `import.meta.env.VITE_API_BASE_URL?.replace(`"/api`",`"`")${path.startsWith("/") ? path : "/" + path}`;
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
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Fetch user list
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/chat/users`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (_) {}
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
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || sending) return;

    setSending(true);
    const body = newMessage.trim();
    setNewMessage("");

    try {
      const res = await fetch(`${API_URL}/chat/send`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ receiver_id: selectedUser.id, body }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
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

          {/* Scrollable user list — min-h-0 is the key fix for flex overflow */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {filteredUsers.length === 0 && (
              <p className="text-center text-sm text-gray-400 mt-8">No users found</p>
            )}
            {filteredUsers.map((user) => (
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
            ))}
          </div>
        </div>

        {/* ════ RIGHT PANEL — flex-1, independent scroll ════ */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {selectedUser ? (
            <>
              {/* Conversation Header — pinned top */}
              <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200 dark:border-white/[0.05] flex items-center justify-between bg-white dark:bg-gray-900">
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
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages area — scrolls independently, min-h-0 prevents expansion */}
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50 dark:bg-gray-950">
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
                      <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        {!isMe && <Avatar name={msg.sender.name} avatar={msg.sender.avatar} size={32} />}
                        <div className={`flex flex-col gap-0.5 max-w-[65%] ${isMe ? "items-end" : "items-start"}`}>
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
                            {msg.body}
                          </div>
                          <span className="text-xs text-gray-400 px-1">{formatTime(msg.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar — pinned bottom */}
              <form onSubmit={handleSend} className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-white/[0.05] bg-white dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <button type="button" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition flex-shrink-0">
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
                  <button type="button" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
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
    </>
  );
}
