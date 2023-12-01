class Channel {
    constructor(name) {
        this.name = name;
        this.message = [];
    }
    
    addMessage(message) {
        this.message.push(message);
    }
}
export default Channel;
