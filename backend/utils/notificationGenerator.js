const Notification = require("../classes/notification");

const orderNotification = async ({ user_id, order_id, status }) => {
  const notification = Notification.order(user_id, order_id, status);

  return await notification.save();
};

const reviewNotification = async ({ user_id, review_id, buyer_name }) => {
  const notification = Notification.review(user_id, review_id, buyer_name);

  return await notification.save();
}

const promoNotification = async ({ user_ids, promo_code }) => {
  const results = [];

  for (const userId of user_ids) {
    const notification = Notification.promo(userId, promo_code);

    results.push(await notification.save());
  }

  return results;
};

module.exports = {
  orderNotification,
  reviewNotification,
  promoNotification,
};
