'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePathname } from 'next/navigation';

export function MessageListener() {
  const pathname = usePathname();
  const [lastChecked, setLastChecked] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('last_message_check');
      return saved ? parseInt(saved, 10) : Date.now();
    }
    return Date.now();
  });

  useEffect(() => {
    // Only poll if a user is logged in
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    // We don't want to show aggressive popups if they are actively in the chat interface
    // but optionally we can still show them. Let's show them everywhere except if they are
    // on the exact same conversation. Since we don't know the active conversation globally,
    // we'll just show toasts on all pages.

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/messages', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        if (data.success && data.data.conversations) {
          let updatedMaxTime = lastChecked;

          data.data.conversations.forEach((conv: any) => {
            const msgTime = new Date(conv.lastMessageAt).getTime();
            
            // Check if this message is newer than our last check
            // AND the message was NOT sent by us (meaning it's an incoming message)
            if (msgTime > lastChecked && !conv.lastMessageIsFromMe) {
              
              // Only toast if we're not actively on the messages page itself
              // Or you could let it toast regardless!
              if (!pathname.includes('/dashboard/messages')) {
                toast(`You have a new message!`, {
                  description: `From ${conv.otherUsername}: ${conv.lastMessage}`,
                  action: {
                    label: 'View',
                    onClick: () => window.location.href = '/dashboard/messages'
                  },
                });
              }
              
              // Push the high watermark up
              if (msgTime > updatedMaxTime) {
                updatedMaxTime = msgTime;
              }
            }
          });

          if (updatedMaxTime > lastChecked) {
            setLastChecked(updatedMaxTime);
            localStorage.setItem('last_message_check', updatedMaxTime.toString());
          }
        }
      } catch (err) {
        // Silently ignore polling errors
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(pollInterval);
  }, [lastChecked, pathname]);

  return null; // This is a purely background listener component
}
