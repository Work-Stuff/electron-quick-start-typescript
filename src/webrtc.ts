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

    static typeOfSignal(signalType: SignalingType) {
        return SignalingType[signalType];
    }

    public addTrack(track: MediaStreamTrack) {
        if (track instanceof VideoTrack) {
            this.videoTrack = track as VideoTrack;
            this.peerConnection.addTrack(track);
        }
        else if (track instanceof AudioTrack) {
            this.audioTrack = track as AudioTrack;
            this.peerConnection.addTrack(track);
        }
        else {
            console.log("Unkown Stream Type {0}", typeof (track));
        }
    }

    public connect() {
        this.peerConnection.createOffer()
            .then(offer => {
                this.peerConnection.setLocalDescription(offer).then(() => {
                    this.socket.emit('signaling', {
                        to: this.userSocketId,
                        from: this.socket.id,
                        type: SignalingType.Offer,
                        data: offer
                    });
                })
                    .catch(err => console.error(err));
            })
            .catch((error) => {
                console.error('error', error);
            });
    }

    public addConnection(offer: any) {
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer.data))
            .then(() => {
                return this.peerConnection.createAnswer();
            })
            .then(answer => {
                this.peerConnection.setLocalDescription(answer).then(() => {
                    this.socket.emit('signaling', {
                        to: offer.from,
                        from: this.socket.id,
                        type: SignalingType.Answer,
                        data: answer
                    });
                }).catch(err => console.error(err));
            });
    }
}