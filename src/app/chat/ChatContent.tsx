"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, Transaction, PublicKey } from "@solana/web3.js";
import { encryptMessage, decryptMessage } from "../../utils/encryption";
import { io, Socket } from "socket.io-client";

const MessageList = ({
  messages,
  currentUser,
}: {
  messages: any[];
  currentUser: string;
}) => (
  <div className="bg-gray-100 p-4 h-64 overflow-y-auto mb-4 rounded-lg shadow">
    {messages.map((msg, index) => (
      <div
        key={index}
        className={`mb-2 ${
          msg.sender === currentUser ? "text-right" : "text-left"
        }`}
      >
        <span
          className={`inline-block p-2 rounded-lg ${
            msg.sender === currentUser ? "bg-blue-500 text-white" : "bg-white"
          }`}
        >
          {msg.content}
        </span>
        {msg.image && (
          <div className="mt-2 max-w-xs">
            <Image
              src={msg.image}
              alt="Shared image"
              width={200}
              height={200}
              className="rounded-lg shadow"
            />
          </div>
        )}
      </div>
    ))}
  </div>
);

const MessageInput = ({
  inputMessage,
  setInputMessage,
  sendMessage,
  sendImage,
}: {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  sendMessage: () => void;
  sendImage: (file: File) => void;
}) => (
  <div className="flex flex-col space-y-2">
    <div className="flex space-x-2">
      <input
        type="text"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        className="flex-grow border p-2 rounded-lg"
        placeholder="Type your message..."
      />
      <button
        onClick={sendMessage}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
      >
        Send
      </button>
    </div>
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files && sendImage(e.target.files[0])}
        className="hidden"
        id="image-upload"
      />
      <label
        htmlFor="image-upload"
        className="bg-green-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-green-600 transition duration-200 inline-block"
      >
        Send Image
      </label>
    </div>
  </div>
);

const ChatContent = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const searchParams = useSearchParams();
  const wallet = useWallet();
  const socketRef = useRef<Socket | null>(null);
  const recipientRef = useRef<string | null>(null);

  useEffect(() => {
    const recipient = searchParams.get("recipient");
    if (recipient) {
      recipientRef.current = recipient;
    }

    if (wallet.connected && recipient && wallet.publicKey) {
      socketRef.current = io("", {
        path: "/api/socket",
      });

      socketRef.current.on("connect", () => {
        console.log("Connected to WebSocket");
        socketRef.current?.emit("join", wallet.publicKey?.toString());
      });

      socketRef.current.on("message", async (message) => {
        if (wallet.publicKey) {
          const decryptedContent = await decryptMessage(
            message.content,
            wallet.publicKey.toBytes()
          );
          setMessages((prevMessages) => [
            ...prevMessages,
            { ...message, content: decryptedContent },
          ]);
        }
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [wallet.connected, searchParams, wallet.publicKey]);

  const sendMessage = async () => {
    if (inputMessage.trim() && wallet.publicKey && recipientRef.current) {
      try {
        const encryptedMessage = await encryptMessage(
          inputMessage,
          recipientRef.current
        );

        const response = await fetch("/api/send-message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: encryptedMessage,
            senderAccount: wallet.publicKey.toString(),
            recipientAccount: recipientRef.current,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const data = await response.json();

        const transaction = Transaction.from(
          Buffer.from(data.transaction, "base64")
        );

        if (wallet.signTransaction) {
          const signedTransaction = await wallet.signTransaction(transaction);
          const connection = new Connection(
            process.env.NEXT_PUBLIC_SOLANA_RPC ||
              "https://api.devnet.solana.com"
          );
          const signature = await connection.sendRawTransaction(
            signedTransaction.serialize()
          );
          await connection.confirmTransaction(signature);

          socketRef.current?.emit("message", {
            content: encryptedMessage,
            sender: wallet.publicKey.toString(),
            recipient: recipientRef.current,
          });

          setMessages([
            ...messages,
            { content: inputMessage, sender: wallet.publicKey.toString() },
          ]);
          setInputMessage("");
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        alert("Failed to send message. Please try again.");
      }
    }
  };

  const sendImage = async (file: File) => {
    if (file && wallet.publicKey && recipientRef.current) {
      try {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("senderAccount", wallet.publicKey.toString());
        formData.append("recipientAccount", recipientRef.current);

        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const data = await response.json();

        socketRef.current?.emit("message", {
          content: "Sent an image",
          image: data.imageUrl,
          sender: wallet.publicKey.toString(),
          recipient: recipientRef.current,
        });

        setMessages([
          ...messages,
          {
            content: "Sent an image",
            image: data.imageUrl,
            sender: wallet.publicKey.toString(),
          },
        ]);
      } catch (error) {
        console.error("Failed to send image:", error);
        alert("Failed to send image. Please try again.");
      }
    }
  };

  if (!wallet.connected) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <p className="mb-4 text-lg">Please connect your wallet to chat.</p>
        <WalletMultiButton className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Flirty Private Chat
      </h1>
      {recipientRef.current && (
        <p className="mb-4 text-center text-gray-600">
          Chatting with: {recipientRef.current}
        </p>
      )}
      <MessageList
        messages={messages}
        currentUser={wallet.publicKey?.toString() || ""}
      />
      <MessageInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        sendMessage={sendMessage}
        sendImage={sendImage}
      />
    </div>
  );
};

export default ChatContent;
