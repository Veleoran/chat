// Chat.js
import http from 'http';
import path from 'path';
import serveStatic from 'serve-static';
import finalhandler from 'finalhandler';
import { Server as SocketIOServer } from 'socket.io';




export default class ChatServer {
    constructor(port, publicPath) {
        this.port = port;
        this.users = [];
        this.serve = serveStatic(publicPath, { index: 'index.html' });

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
                // Renvoyer le message à tous les sockets connectés, y compris à celui qui l'a envoyé
                const data = { pseudo: socket.pseudo, message: message };
                this.io.emit('server:message', data);
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
            socket.emit("server:user:connected")
            this.io.emit('server:user:list', this.users)
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