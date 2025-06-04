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

    const { error } = await supabase.from('messages').insert({
      sender_id,
      sender_name,
      sender_role,
      content
    });

    if (error) {
      console.error('Gagal simpan pesan:', error);
      return;
    }

    const { data: insertedMessage, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', data[0].id)
      .single();

    if (fetchError) {
      console.error('Error fetching inserted message:', fetchError);
      socket.emit('error', fetchError.message);
      return;
    }

io.emit('receive_message', insertedMessage);

    io.emit('receive_message', {
      sender_id,
      sender_name,
      sender_role,
      content,
      created_at: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log(`🚫 User disconnected: ${socket.id}`);
  });
});

server.listen(process.env.PORT || 3001, () => {
  console.log(`🚀 Chat backend berjalan.`);
});
