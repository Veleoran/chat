import http from 'http';
import path from 'path';
import serveStatic from 'serve-static';
import finalhandler from 'finalhandler';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serve = serveStatic(path.join(__dirname, 'public'), {index: ['index.html', 'index.htm']});

class ChatServer {
  constructor(port) {
    this.port = port;
    this.users = [];
    this.server = http.createServer((req, res) => {
      serve(req, res, finalhandler(req, res));
    });
    this.io = new Server(this.server);
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      socket.on('try_connect', pseudo => this.handleConnect(socket, pseudo));
      socket.on('disconnect_request', () => this.handleDisconnectRequest(socket));
      socket.on('disconnect', () => this.handleDisconnect(socket));
      socket.on('message', message => this.handleMessage(socket, message));
      // Ajoutez d'autres écouteurs d'événements ici
    });
  }

  handleConnect(socket, pseudo) {
    if (this.users.includes(pseudo)) {
      socket.emit('pseudo_taken');
    } else {
      this.users.push(pseudo);
      socket.pseudo = pseudo;
      socket.emit('connected');
      this.io.emit('user_list', this.users);
    }
  }
  
  handleDisconnectRequest(socket) {
    socket.disconnect(true);
  }
  
  handleDisconnect(socket) {
    if (socket.pseudo) {
      this.users = this.users.filter(u => u !== socket.pseudo);
      this.io.emit('user_list', this.users);
    }
  }

  handleMessage(socket, message) {
    this.io.emit('broadcast_message', { user: socket.pseudo, message: message });
  }

  start() {
    this.server.listen(this.port, () => { // Utiliser "this.port" pour écouter sur le bon port
      console.log(`Server listening on http://localhost:${this.port}`);
    });
  }
}

const port = process.env.PORT || 9000; // Utilisez un port par défaut si "process.env.PORT" n’est pas défini
const chatServer = new ChatServer(port);
chatServer.start();