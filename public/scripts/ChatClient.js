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
    }
    displayIncomingMessage(data) {
        const { pseudo, message } = data;
        const listing = document.querySelector('#listingMessages');
        const template = document.querySelector("#messagesTpl");

        let clone = document.importNode(template.content, true);
        clone.querySelector(".time").textContent = new Date().toLocaleTimeString();
        clone.querySelector(".author").textContent = pseudo;
        clone.querySelector(".message").textContent = message;
        listing.appendChild(clone);
    }


    tryConnect(exists) {
        if (exists) { 
            alert(`Ce pseudo est déjà utilisé par un autre utilisateur !`);
        } else {
            let pseudo = window.prompt(`Choisissez un pseudo :`);
            if (pseudo !== null && pseudo !== "") {
                this.socket.emit('client:user:connect', pseudo);
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

