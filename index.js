// index.js
import ChatServer from './app/Chat.js'; // Assurez-vous que le chemin est correct
import { fileURLToPath } from 'url';
import path from 'path';

const publicPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const PORT = 9000;
const chatServer = new ChatServer(PORT, publicPath);
chatServer.listen();