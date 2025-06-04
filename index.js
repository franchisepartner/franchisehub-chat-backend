const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    const { sender_id, sender_name, sender_role, content } = data;

    const { data: insertedMessages, error } = await supabase
      .from('messages')
      .insert({
        sender_id,
        sender_name,
        sender_role,
        content
      })
      .select(); // memastikan data hasil insert dikembalikan

    if (error) {
      console.error('Gagal simpan pesan:', error);
      socket.emit('error', 'Gagal simpan pesan');
      return;
    }

    if (insertedMessages && insertedMessages.length > 0) {
      const insertedMessage = insertedMessages[0];

      // Mengirim pesan yang disimpan ke semua pengguna
      io.emit('receive_message', insertedMessage);
    } else {
      console.error('Insert berhasil tapi tidak ada data yang dikembalikan');
      socket.emit('error', 'Insert berhasil tapi data tidak kembali');
    }
  });

  socket.on('disconnect', () => {
    console.log(`🚫 User disconnected: ${socket.id}`);
  });
});

server.listen(process.env.PORT || 3001, () => {
  console.log(`🚀 Chat backend berjalan.`);
});
