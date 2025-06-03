const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: ["https://franchisehubcom.vercel.app"],
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  socket.on('send_message', async (data) => {
    console.log('📨 Message received:', data);

    io.emit('receive_message', data);  

    await supabase.from('messages').insert([{
      sender_id: data.sender_id,
      content: data.content,
      created_at: new Date()
    }]);
  });

  socket.on('disconnect', () => {
    console.log(`🚫 User disconnected: ${socket.id}`);
  });
});

server.listen(process.env.PORT || 3001, () => {
  console.log(`🚀 Chat backend berjalan.`);
});
