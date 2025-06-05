const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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

  socket.on('join_inbox', (userId) => {
    socket.join(userId);
  });

  socket.on('send_inbox_message', async (data) => {
    const { sender_id, receiver_id, listing_id, message } = data;

    const { data: insertedInbox, error } = await supabase
      .from('franchise_inbox')
      .insert({
        sender_id,
        receiver_id,
        listing_id,
        message
      })
      .select();

    if (error) {
      console.error('Gagal menyimpan pesan inbox:', error);
      socket.emit('error', 'Gagal menyimpan pesan inbox');
      return;
    }

    if (insertedInbox && insertedInbox.length > 0) {
      const inboxMessage = insertedInbox[0];

      // Kirim ke sender dan receiver saja secara spesifik
      io.to(receiver_id).emit('receive_inbox_message', inboxMessage);
      io.to(sender_id).emit('receive_inbox_message', inboxMessage);
    } else {
      console.error('Insert inbox berhasil tapi tidak ada data dikembalikan');
      socket.emit('error', 'Insert inbox berhasil tapi data tidak kembali');
    }
  });

  socket.on('disconnect', () => {
    console.log(`🚫 User disconnected: ${socket.id}`);
  });
});

server.listen(process.env.INBOX_PORT || 3002, () => {
  console.log(`🚀 Franchise Inbox backend berjalan di port ${process.env.INBOX_PORT || 3002}`);
});
