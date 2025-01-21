import { useEffect, useRef, useState } from "react";
import { socket } from "./config/socket";


function App() {
  const localVideoRef = useRef(null);
  const peer = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(null);


  const streamLocalVideo = async () => {
    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    localVideoRef.current.srcObject = localStream.current
  };

  const createPeer = () => {
    peer.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
  };

  // start video call

  const startVideoCall = async () => {
    const offer = await createOffer();
    socket.emit("offer", offer);
  };

  const createOffer = async () => {
    const offer = await peer.current.createOffer();
    await peer.current.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async (offer) => {
    await peer.current.setRemoteDescription(offer);
    const answer = await peer.current.createAnswer();
    await peer.current.setLocalDescription(answer);
    socket.emit("answer", answer);
  };

  const setRemoteAns = async (ans) => {
    await peer.current.setRemoteDescription(ans);
  };

  const sendStream = () => {
    const tracks = localStream.current.getTracks();
    for (const track of tracks) { 
      peer.current.addTrack(track, localStream.current);
    }
  };

  const handleRemoteStream = (e) => {
    const stream = e.streams;
    remoteStream.current.srcObject = stream[0];
  };

  useEffect(() => {
    const stream = async () => {
      await streamLocalVideo();
      await createPeer();
      const id = window.prompt("enter userId");
      socket.emit("connected", { name: "Vishal", id });
      sendStream()


      socket.on("offer", createAnswer);
      socket.on("answer",setRemoteAns);
  
  
      peer.current.addEventListener("track", handleRemoteStream);
      peer.current.addEventListener("negotiationneeded", startVideoCall);
    }
    stream()


    return () => {
      socket.off("connected");
      socket.off("answer");
      socket.off("offer");
      peer.current.removeEventListener("track", handleRemoteStream);
      peer.current.removeEventListener("negotiationneeded", startVideoCall)
    };
  }, []);

  return (
    <>
      <video ref={localVideoRef} autoPlay width={"500px"}></video>
      <video ref={remoteStream} autoPlay playsInline width={"500px"}></video>
      <button onClick={() => startVideoCall()}>Connect</button>
    </>
  );
}

export default App;
