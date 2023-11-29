import http from 'http';
import path from 'path';
import serveStatic  from 'serve-static';
import finalhandler from 'finalhandler';
import { fileURLToPath } from 'url';
import { Server } from "socket.io";


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const serve =  serveStatic(path.join(__dirname, 'public'), {index: 'index.html'});
const httpServer = http.createServer((req,res) =>
    serve(req, res, finalhandler(req, res))
);
httpServer.listen(9000, () => { console.log(`http://localhost:9000`); });


const users = [];
const io = new Server(httpServer);
io.on('connection', (socket) => {
    socket.on('client:user:connect', (pseudo) => {
        if(users.includes(pseudo)) {
           socket.emit("server:user:exists") 
        } else {
            users.push(pseudo)
            socket.pseudo = pseudo;
            socket.emit("server:user:connected") 
            io.emit('server:user:list', users)
        }
    })

    socket.on('client:user:disconnect', () => {
        users.splice(users.indexOf(socket.pseudo),1);
        socket.emit("server:user:disconnected") 
        io.emit('server:user:list', users)
    })
});