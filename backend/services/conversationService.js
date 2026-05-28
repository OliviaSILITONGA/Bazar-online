const supabase = require("../config/supabase");
const path = require("path");
const { messageNotification } = require("../utils/notificationGenerator"); // <- Abstraction

// =====================================================
// GET ALL CONVERSATIONS
// =====================================================
const getConversations = async (userId) => {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order("last_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// =====================================================
// GET MESSAGES BY CONVERSATION
// =====================================================
const getMessages = async (conversationId, userId) => {
  // optional: validasi ownership conversation
  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (convErr) throw new Error(convErr.message);

  if (conv.user_a_id !== userId && conv.user_b_id !== userId) {
    throw new Error("Unauthorized access to conversation");
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};

// =====================================================
// CREATE CONVERSATION
// =====================================================
const createConversation = async (userAId, userBId) => {
  // cek apakah sudah ada conversation
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .or(
      `and(user_a_id.eq.${userAId},user_b_id.eq.${userBId}),and(user_a_id.eq.${userBId},user_b_id.eq.${userAId})`,
    )
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("conversations")
    .insert([
      {
        user_a_id: userAId,
        user_b_id: userBId,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// =====================================================
// SEND MESSAGE (TEXT + MEDIA UPLOAD)
// =====================================================
const sendMessage = async (conversationId, senderId, messageData) => {
  let mediaUrl = null;

  // -------------------------------
  // HANDLE FILE UPLOAD (SUPABASE STORAGE)
  // -------------------------------
  if (messageData.file) {
    const file = messageData.file;

    // pakai path untuk amanin nama file
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = `messages/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("messages")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrlData } = supabase.storage
      .from("messages")
      .getPublicUrl(filePath);

    mediaUrl = publicUrlData.publicUrl;
  }

  // -------------------------------
  // INSERT MESSAGE
  // -------------------------------
  const { data: message, error } = await supabase
    .from("messages")
    .insert([
      {
        conversation_id: conversationId,
        sender_id: senderId,
        body: messageData.body || null,
        media_url: mediaUrl,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  // =====================================================
  // GET CONVERSATION (UNTUK MENENTUKAN PENERIMA)
  // =====================================================
  const { data: conversation } = await supabase
    .from("conversations")
    .select("user_a_id, user_b_id")
    .eq("id", conversationId)
    .single();

  const receiverId =
    conversation.user_a_id === senderId
      ? conversation.user_b_id
      : conversation.user_a_id;

  const { data: sender, error } = await supabase
    .from("users")
    .select("name")
    .eq("id", senderId)
    .single();

  if (error) throw new Error(error.message);

  // =====================================================
  // CREATE NOTIFICATION
  // =====================================================
  await messageNotification({
    user_id: receiverId,
    conversation_id: conversationId,
    sender_name: sender.name || "User",
  });

  return data;
};

// =====================================================
// MARK AS READ
// =====================================================
const markAsRead = async (conversationId, userId) => {
  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId);

  if (error) throw new Error(error.message);

  return { success: true };
};

module.exports = {
  getConversations,
  getMessages,
  createConversation,
  sendMessage,
  markAsRead,
};
