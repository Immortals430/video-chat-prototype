import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function App() {
  const localStream = useRef();
  const remoteStream = useRef();
  const [localVideoRef, setLocalVideoRef] = useState();
  const [myUserId, setMyUserId] = useState();
  const [outGoingUCallserId, setOutGoingUCallserId] = useState();
  const peerReference = useRef();
  const [incomingCallState, setIncomingCallState] = useState(false);
  const [callerId, setCallerId] = useState();
  const [incomingOffer, setIncomingOffer] = useState();

  // stream local video
  const streamLocalVideo = async () => {
    const video = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    localStream.current.srcObject = video;
    setLocalVideoRef(video);
    return video;
  };

  // add track
  const addTrack = async (video, peer) => {
    video.getTracks().forEach((track) => {
      peer.addTrack(track, video);
    });
  };

  // create peer
  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerReference.current = peer;
    return peer;
  };

  // createOffer
  const createOffer = async (peer) => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  };

  // createAnswer
  const createAnswer = async (peer, offer) => {
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  };

  // handle incoming answer
  const handleIncomingAnswer = async (answer) => {
    await peerReference.current.setRemoteDescription(answer);
  };

  // handle incoming track
  const handleTrack = async (e) => {
    remoteStream.current.srcObject = e.streams[0];
  };

  // emit ice candidate
  const emitIceCandidate = (e, outGoingUCallserId) => {
    if (e.candidate) {
      socket.emit("icecandidate", {
        outGoingUCallserId,
        candidate: e.candidate,
      });
    }
  };

  useEffect(() => {
    const myUserId = prompt();
    setMyUserId(myUserId);

    socket.emit("connected", { myUserId });

    socket.on("offer", ({ callerId, offer }) => {
      setIncomingCallState(true);
      setIncomingOffer(offer);
      setCallerId(callerId);
      console.log(offer);
    });

    const handleIceCandidate = async (candidate) => {
      console.log("peer");
      if (peerReference.current) {
        console.log(peerReference);
        await peerReference.current.addIceCandidate(candidate);
      }
    };

    socket.on("answer", ({ answer }) => handleIncomingAnswer(answer));
    socket.on("track", handleTrack);
    socket.on("icecandidate", ({ candidate }) => handleIceCandidate(candidate));

    return () => {
      socket.off("connected");
      socket.off("offer");
      socket.off("answer");
    };
  }, []);

  const callUser = async (myUserId, outGoingUCallserId) => {
    const video = await streamLocalVideo();
    const peer = createPeer();
    peer.onicecandidate = (e) => emitIceCandidate(e, outGoingUCallserId);
    await addTrack(video, peer);
    const offer = await createOffer(peer);
    socket.emit("offer", {
      callerId: myUserId,
      userToCallId: outGoingUCallserId,
      offer,
    });
  };

  const answerCall = async (callerId) => {
    setIncomingCallState(false);
    await streamLocalVideo();
    const peer = createPeer();
    const answer = await createAnswer(peer, incomingOffer);
    socket.emit("answer", { callerId, answer });
  };

  return (
    <>
      <video autoPlay ref={localStream}></video>
      <video autoPlay ref={remoteStream}></video>
      <input
        type="text"
        onChange={(e) => setOutGoingUCallserId(e.target.value)}
      />
      <button onClick={() => callUser(myUserId, outGoingUCallserId)}>
        Call
      </button>
      {incomingCallState && (
        <button onClick={() => answerCall(callerId)}>Incoming Call</button>
      )}
    </>
  );
}
