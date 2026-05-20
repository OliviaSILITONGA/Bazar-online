const supabase = require("../config/supabase");

const getNotifications = async (userId) => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const markAsRead = async (notificationId, userId) => {
  // Pastikan notifikasi milik user tersebut
  const { data: existing, error: fetchError } = await supabase
    .from("notifications")
    .select("*")
    .eq("id", notificationId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existing) {
    throw new Error("Notification not found or unauthorized access");
  }

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const markAllAsRead = async (userId) => {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return {
    updated_count: data?.length || 0,
    updated: data,
  };
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
