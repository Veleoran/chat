class ChatClient {
    constructor(host) {
        this.socket = io.connect(host);
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelector("#btnConnect").addEventListener('click', () => this.tryConnect(false));
        document.querySelector("#btnDisconnect").addEventListener('click', () => this.tryDisconnect());
        document.querySelector("#createMessage").addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Empêcher le comportement par défaut du formulaire
                const message = e.target.value.trim();
                if (message) {
                    this.socket.emit('client:message', message);
                    e.target.value = ''; // Vider le champ après l'envoi 
                }
            }
        });
        this.socket.on('server:user:exists', () => this.tryConnect(true));
        this.socket.on('server:user:connected', () => this.toggleAuthenticationInterface(true));
        this.socket.on('server:user:disconnected', () => this.toggleAuthenticationInterface(false));
        this.socket.on('server:user:list', (users) => this.updateUserList(users));
        this.socket.on('server:message', (data) => this.displayIncomingMessage(data));  
        this.socket.on('server:channels:list', (channels) => {
            this.displayChannels(channels);
            document.querySelectorAll('.channel').forEach(element => {
                element.addEventListener('click', () => this.joinChannel(element.textContent));
            });
        });
        this.socket.on('server:channel:messages', (messages) => {
            const listing = document.querySelector('#listingMessages');
            console.log(listing); // Affichage pour débogage
            if (listing) {
                listing.innerHTML = "";
                messages.forEach(msg => {
                    this.addMessageToList(msg);
                });
            } else {
                console.error("L'élément listingMessages n'a pas été trouvé.");
            };
        
            this.socket.on('server:user:typing', (data) => {
                console.log(`${data.pseudo} est en train de taper...`);
                const typingDisplay = document.querySelector('#typingDisplay');
                typingDisplay.textContent = `${data.pseudo} est en train de taper...`;
                setTimeout(() => { typingDisplay.textContent = ''; }, 3000); // Effacer après un délai
            });
            
            // Votre code pour afficher les messages dans l'interface utilisateur
        });
        const createMessageInput = document.querySelector("#createMessage");
        createMessageInput.addEventListener('input', () => {
            if (createMessageInput.value.trim() !== '') {
                this.socket.emit('client:typing', { pseudo: this.pseudo, channel: this.currentChannel });
            }
        });
       
    }
    // 
    displayChannels(channels) {
        const listing = document.querySelector('#listingChannels');
        listing.innerHTML = ''; // Nettoyer la liste actuelle

        channels.forEach(channel => {
            let li = document.createElement('li');
            li.textContent = channel;
            li.classList.add('channel');
            if (channel === this.currentChannel) {
                li.classList.add('active');
            }
            li.addEventListener('click', () => this.joinChannel(channel));
            listing.appendChild(li);
        });
    }
// 
    addMessageToList(msg) {
        const { pseudo, message } = msg;
        const listing = document.querySelector('#listingMessages');
        const template = document.querySelector("#messagesTpl");
      ;
    
        let clone = document.importNode(template.content, true);
        clone.querySelector(".time").textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        clone.querySelector(".author").textContent = pseudo;
        clone.querySelector(".message").textContent = message;
        clone.querySelector(".time").classList.add("message-time");
        clone.querySelector(".author").classList.add("message-author");
        clone.querySelector(".message").classList.add("message-content");
        listing.appendChild(clone);

        const messagesContainer = document.querySelector('#ui_chat_messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
    displayIncomingMessage(data) {
        const { pseudo, message } = data;
        const listing = document.querySelector('#listingMessages');
        const template = document.querySelector("#messagesTpl");

        let clone = document.importNode(template.content, true);
        clone.querySelector(".time").textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        clone.querySelector(".author").textContent = pseudo;
        clone.querySelector(".message").textContent = message;
        clone.querySelector(".time").classList.add("message-time");
        clone.querySelector(".author").classList.add("message-author");
        clone.querySelector(".message").classList.add("message-content");
        listing.appendChild(clone);
    }
    joinChannel(channelName) {
        // Ajouter la classe 'active' au channel sélectionné
        document.querySelectorAll('.channel').forEach(element => {
            element.classList.remove('active');
            if (element.textContent === channelName) {
                element.classList.add('active');
            }
        });
    
        this.socket.emit('client:joinChannel', channelName);
        this.currentChannel = channelName; 
        const listingMessages = document.querySelector('#listingMessages');
        if (listingMessages) {
            listingMessages.innerHTML = '';
        } else {
            console.error("L'élément listingMessages n'a pas été trouvé lors du changement de channel.");
        }
    }
    
    displayChannels(channels) {
        const listing = document.querySelector('#listingChannels');
        listing.innerHTML = ''; // Nettoyer la liste actuelle
        channels.forEach((channel) => {
            let li = document.createElement('li');
            li.textContent = channel;
            li.classList.add('channel');
            li.addEventListener('click', () => this.joinChannel(channel));
            listing.appendChild(li);
        });
        
        
    }

    tryConnect(exists) {
        if (exists) { 
            alert(`Ce pseudo est déjà utilisé par un autre utilisateur !`);
        } else {
            let pseudo = window.prompt(`Choisissez un pseudo :`);
            if (pseudo !== null && pseudo !== "") {
                this.socket.emit('client:user:connect', pseudo);
                this.pseudo = pseudo; // Stocker le pseudo de l'utilisateur
                this.updateUserInterface(); // Mettre à jour l'interface utilisateur
            }
        }
    }
    
    tryDisconnect() {
        this.socket.emit('client:user:disconnect');
    }

    toggleAuthenticationInterface(authenticated) {
        const action = authenticated ? 'add' : 'remove';
        document.querySelectorAll('.not_authenticated').forEach((element) => {
            element.classList[action]('hide');
        });
        document.querySelectorAll('.authenticated').forEach((element) => {
            element.classList[action === 'add' ? 'remove' : 'add']('hide');
        });
    }
    updateUserInterface() {
        const userDisplay = document.querySelector('#userDisplay');
           console.log("Mise à jour de l'interface utilisateur, pseudo:", this.pseudo);
        if (this.pseudo) {
            userDisplay.textContent = `Connecté en tant que : ${this.pseudo}`;
        } else {
            userDisplay.textContent = '';
        }
    }
    

    updateUserList(users) {
        const listing = document.querySelector('#listingUsers');
        listing.innerHTML = '';
        const template = document.querySelector("#usersTpl");
        users.forEach((user) => {
            let clone = document.importNode(template.content, true);
            clone.querySelector("li").textContent = user;
            listing.appendChild(clone);
        });
        
    }
}


