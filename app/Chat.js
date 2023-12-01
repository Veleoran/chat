// Chat.js
import http from 'http';
import serveStatic from 'serve-static';
import finalhandler from 'finalhandler';
import { Server as SocketIOServer } from 'socket.io';
import Channel from './Channel.js';




export default class ChatServer {
    constructor(port, publicPath) {
        this.port = port;
        this.users = [];
        this.serve = serveStatic(publicPath, { index: 'index.html' });
        this.channels = {
            "Général": new Channel("Général"),
            "Programmation": new Channel("Programmation"),
            "Jeux Vidéo": new Channel("Jeux Vidéo")
        };

        this.httpServer = http.createServer((req, res) =>
            this.serve(req, res, finalhandler(req, res))
        );

        this.io = new SocketIOServer(this.httpServer);

        this.configureSocketIO();
    }

    configureSocketIO() {
        this.io.on('connection', (socket) => {
            socket.on('client:user:connect', pseudo => this.connectUser(socket, pseudo));
            socket.on('client:user:disconnect', () => this.disconnectUser(socket));
            socket.on('client:message', (message) => {
                const channelName = socket.channel || 'Général'; // Assurez-vous que l'utilisateur est dans un channel
                const channel = this.channels[channelName];
                channel.addMessage({ pseudo: socket.pseudo, message });
                this.io.to(channelName).emit('server:message', { pseudo: socket.pseudo, message });
            });
            socket.on('client:typing', (data) => {
                socket.to(data.channel).emit('server:user:typing', { pseudo: data.pseudo });
            });
          
            socket.on('client:joinChannel', (channelName) => {
                if (this.channels[channelName]) {
                    const oldChannel = socket.channel;
                    socket.leave(oldChannel);
                    socket.join(channelName);
                    socket.channel = channelName;
            
                    // Envoyer une notification aux autres utilisateurs du channel
                    this.io.to(channelName).emit('server:message', {
                        pseudo: 'System',
                        message: `${socket.pseudo} a rejoint le channel ${channelName}`
                    });
                    // socket.on('client:typing', (data) => {
                    //     socket.to(data.channel).emit('server:user:typing', { pseudo: data.pseudo });
                    // });
            
                    socket.emit('server:channel:messages', this.channels[channelName].messages);
                }
            });
            
            socket.on('disconnect', () => {
                this.disconnectUser(socket);
            });
        });

    }

    connectUser(socket, pseudo) {
        if (this.users.includes(pseudo)) {
            socket.emit("server:user:exists")
        } else {
            this.users.push(pseudo);
            socket.pseudo = pseudo;
            socket.join('Général');
            socket.channel = 'Général';
            socket.emit("server:user:connected")
            this.io.emit('server:user:list', this.users)
            socket.emit("server:channels:list", Object.keys(this.channels));

        }
    }

    disconnectUser(socket) {
        const index = this.users.indexOf(socket.pseudo);
        if (index !== -1) {
            this.users.splice(index, 1);
            socket.emit("server:user:disconnected")
            this.io.emit('server:user:list', this.users)
        }
    }

    listen() {
        this.httpServer.listen(this.port, () => {
            console.log(`Server listening on http://localhost:${this.port}`);
        });
    }
}