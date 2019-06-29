import * as socketIoClient from 'socket.io-client';
import * as socketIo from 'socket.io';
import { fromEvent } from 'rxjs/internal/observable/fromEvent';
import { Observable } from 'rxjs/internal/Observable';
import { filter } from 'rxjs/internal/operators';
import { Subject } from 'rxjs/internal/Subject';

import 'webrtc-adapter';

export enum SignalingType {
    Offer,
    Answer,
    Candidate
}

export interface MainConfiguration {
    socketEndPoint: string;
    socketPort: string;
}

export class ManagePeer {
    public peerConnection: RTCPeerConnection;
    public audioTrack: AudioTrack;
    public videoTrack: VideoTrack;
    public dataChannel: RTCDataChannel;

    public constructor(public userSocketId: string, public socket: socketIo.Socket) {
        this.peerConnection = new RTCPeerConnection({
            iceServers: [],
        });
        this.dataChannel = this.peerConnection.createDataChannel('chat');
        this.peerConnection.onicecandidate = (e) => {
            this.socket.emit('signaling', {
                to: this.userSocketId,
                from: this.socket.id,
                type: SignalingType.Candidate,
                data: e.candidate
            });
        };
    }
}