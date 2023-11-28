import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

class ChatClient {
  constructor() {
    // this.port = port;
    this.socket = io.connect();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    const connectButton = document.getElementById('connect');
    const pseudoInput = document.getElementById('pseudo');
    const chatContainer = document.getElementById('chat');
    const loginContainer = document.getElementById('login');
    const messageInput = document.getElementById('messageInput');
    const sendMessageButton = document.getElementById('sendMessage');
    const messageArea = document.getElementById('messageArea');

    connectButton.addEventListener('click', () => {
      const pseudo = pseudoInput.value.trim();
      if (pseudo) { 
        this.socket.emit('try_connect', pseudo);
      } else {
        alert('Veuillez entrer un pseudo valide !');
      }
    });

    sendMessageButton.addEventListener('click', () => {
      const message = messageInput.value.trim();
      if (message) {
        this.socket.emit('message', message);
        messageInput.value = ''; // Réinitialiser le champ après envoi
      }
    });
    
    this.socket.on('pseudo_taken', () => alert('Ce pseudo est déjà pris, veuillez en essayer un autre.'));
    this.socket.on('connected', () => this.handleConnected(chatContainer, loginContainer));
    this.socket.on('new_message', data => this.handleNewMessage(messageArea, data));
    this.socket.on('disconnected', () => this.handleDisconnected(chatContainer, loginContainer));
    this.socket.on('user_list', users => this.handleUserList(users));
    
    document.getElementById('disconnect').addEventListener('click', () => this.socket.emit('disconnect_request'));
  }

  handleConnected(chatContainer, loginContainer) {
    loginContainer.style.display = 'none';
    chatContainer.style.display = 'block';
  }
  
  handleDisconnected(chatContainer, loginContainer) {
    chatContainer.style.display = 'none';
    loginContainer.style.display = 'block';
    alert('Vous avez été déconnecté.');
  }
  
  handleNewMessage(messageArea, data) {
    const newMessage = document.createElement('div');
    newMessage.textContent = `${data.user}: ${data.message}`;
    messageArea.appendChild(newMessage);
  }

  handleUserList(users) {
    const userListContainer = document.getElementById('userList');
    userListContainer.innerHTML = '';
    users.forEach(user => {
      const userElement = document.createElement('li');
      userElement.textContent = user;
      userListContainer.appendChild(userElement);
    });
  }
}
window.addEventListener('DOMContentLoaded', () => {
  new ChatClient();
});



const chatClient = new ChatClient(location.host);